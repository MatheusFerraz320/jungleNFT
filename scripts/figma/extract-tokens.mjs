import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = path.join(root, '.env.local');

async function loadLocalEnv() {
  try {
    const content = await readFile(envPath, 'utf8');
    const values = {};

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      values[key] = value;
    }

    return values;
  } catch {
    return {};
  }
}

const env = { ...(await loadLocalEnv()), ...process.env };
const token = env.FIGMA_ACCESS_TOKEN;
const fileKey = env.FIGMA_FILE_KEY ?? 'Ff0SksUi7UFtPWUO8kyNtw';

if (!token) {
  throw new Error('FIGMA_ACCESS_TOKEN não encontrado. Adicione ao .env.local.');
}

function colorToHex(color) {
  if (!color || typeof color.r !== 'number') return null;
  const channel = (value) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  const alpha = color.a ?? 1;
  const hex = `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
  return alpha < 1
    ? `${hex}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0')}`
    : hex;
}

function addStat(map, key, node, transformer = (value) => value) {
  if (key === null || key === undefined || key === '') return;
  const value = transformer(key);
  const current = map.get(value) ?? { count: 0, samples: [] };
  current.count += 1;
  if (current.samples.length < 6 && !current.samples.includes(node.name)) {
    current.samples.push(node.name);
  }
  map.set(value, current);
}

function collectPaintColors(paints, map, node) {
  if (!Array.isArray(paints)) return;
  for (const paint of paints) {
    if (paint.type === 'SOLID') addStat(map, colorToHex(paint.color), node);
    if (paint.type === 'GRADIENT_STOPS') {
      for (const stop of paint.gradientStops ?? []) addStat(map, colorToHex(stop.color), node);
    }
  }
}

function typographyKey(node) {
  if (node.type !== 'TEXT') return null;
  const style = node.style ?? {};
  return JSON.stringify({
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontSize: style.fontSize,
    lineHeightPx: style.lineHeightPx,
    letterSpacing: style.letterSpacing,
    textCase: style.textCase,
    textDecoration: style.textDecoration,
  });
}

function spacingKey(node) {
  const values = {
    itemSpacing: node.itemSpacing,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
  };
  const entries = Object.entries(values).filter(
    ([, value]) => typeof value === 'number' && value > 0,
  );
  return entries.length ? JSON.stringify(Object.fromEntries(entries)) : null;
}

function radiusKey(node) {
  if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
    return JSON.stringify(node.cornerRadius);
  }
  if (
    Array.isArray(node.rectangleCornerRadii) &&
    node.rectangleCornerRadii.some((value) => value > 0)
  ) {
    return JSON.stringify(node.rectangleCornerRadii);
  }
  return null;
}

function effectKey(node) {
  if (!Array.isArray(node.effects) || node.effects.length === 0) return null;
  return JSON.stringify(
    node.effects.map((effect) => ({
      type: effect.type,
      color: colorToHex(effect.color),
      offset: effect.offset,
      radius: effect.radius,
      spread: effect.spread,
      visible: effect.visible,
    })),
  );
}

const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
  headers: { 'X-Figma-Token': token },
});

if (!response.ok) {
  throw new Error(`Figma respondeu ${response.status}: ${await response.text()}`);
}

const file = await response.json();
const colors = new Map();
const typography = new Map();
const spacing = new Map();
const radii = new Map();
const effects = new Map();
const images = new Map();
const frames = [];

function visit(node, parentName = '') {
  const qualifiedName = parentName ? `${parentName} / ${node.name}` : node.name;

  collectPaintColors(node.fills, colors, { name: qualifiedName });
  collectPaintColors(node.strokes, colors, { name: qualifiedName });
  for (const effect of node.effects ?? []) {
    addStat(colors, colorToHex(effect.color), { name: qualifiedName });
  }
  addStat(typography, typographyKey(node), { name: qualifiedName });
  addStat(spacing, spacingKey(node), { name: qualifiedName });
  addStat(radii, radiusKey(node), { name: qualifiedName });
  addStat(effects, effectKey(node), { name: qualifiedName });

  if (node.imageRef) {
    const current = images.get(node.imageRef) ?? { count: 0, samples: [] };
    current.count += 1;
    if (current.samples.length < 6 && !current.samples.includes(qualifiedName)) {
      current.samples.push(qualifiedName);
    }
    images.set(node.imageRef, current);
  }

  if (node.type === 'FRAME' && (!parentName || parentName.split(' / ').length <= 1)) {
    frames.push({
      id: node.id,
      name: node.name,
      width: node.absoluteBoundingBox?.width,
      height: node.absoluteBoundingBox?.height,
    });
  }

  for (const child of node.children ?? []) visit(child, qualifiedName);
}

for (const child of file.document.children ?? []) visit(child);

function sortedStats(map, limit = 40) {
  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([value, stat]) => ({ value, ...stat }));
}

const report = {
  file: {
    key: fileKey,
    name: file.name,
    version: file.version,
    lastModified: file.lastModified,
  },
  frames,
  colors: sortedStats(colors),
  typography: sortedStats(typography),
  spacing: sortedStats(spacing),
  radii: sortedStats(radii),
  effects: sortedStats(effects),
  images: [...images.entries()].map(([ref, stat]) => ({ ref, ...stat })),
};

const designDir = path.join(root, 'design');
await mkdir(designDir, { recursive: true });
await writeFile(path.join(designDir, 'figma-report.json'), JSON.stringify(report, null, 2));

const markdown = [
  '# Tokens extraídos do Figma',
  '',
  `Arquivo: **${file.name}**`,
  `Versão: \`${file.version}\``,
  '',
  '## Frames',
  '',
  '| Frame | ID | Dimensões |',
  '| --- | --- | --- |',
  ...frames.map(
    (frame) => `| ${frame.name} | \`${frame.id}\` | ${frame.width} × ${frame.height} |`,
  ),
  '',
  '## Cores mais usadas',
  '',
  '| Cor | Ocorrências | Exemplos |',
  '| --- | ---: | --- |',
  ...report.colors.map(
    (item) => `| \`${item.value}\` | ${item.count} | ${item.samples.join(', ')} |`,
  ),
  '',
  '## Tipografia',
  '',
  '| Estilo | Ocorrências | Exemplos |',
  '| --- | ---: | --- |',
  ...report.typography.map(
    (item) => `| \`${item.value}\` | ${item.count} | ${item.samples.join(', ')} |`,
  ),
  '',
  '## Raios',
  '',
  ...report.radii.map((item) => `- \`${item.value}\` — ${item.count} ocorrências`),
  '',
  '## Imagens',
  '',
  `Total de referências únicas: **${report.images.length}**`,
  '',
].join('\n');

await writeFile(path.join(designDir, 'figma-tokens.md'), markdown);
console.log(
  `Relatório gerado em design/figma-report.json (${report.colors.length} cores, ${report.typography.length} estilos).`,
);
