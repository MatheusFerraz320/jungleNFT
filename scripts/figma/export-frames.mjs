import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function loadLocalEnv() {
  try {
    const content = await readFile(path.join(root, '.env.local'), 'utf8');
    const values = {};
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator === -1) continue;
      values[trimmed.slice(0, separator).trim()] = trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
    }
    return values;
  } catch {
    return {};
  }
}

const env = { ...(await loadLocalEnv()), ...process.env };
const token = env.FIGMA_ACCESS_TOKEN;
const fileKey = env.FIGMA_FILE_KEY ?? 'Ff0SksUi7UFtPWUO8kyNtw';

if (!token) throw new Error('FIGMA_ACCESS_TOKEN não encontrado no .env.local.');

const report = JSON.parse(await readFile(path.join(root, 'design', 'figma-report.json'), 'utf8'));
const outputDir = path.join(root, 'design', 'frames');
await mkdir(outputDir, { recursive: true });

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function exportGroup(frames, scale) {
  const ids = frames.map((frame) => frame.id).join(',');
  const url = new URL(`https://api.figma.com/v1/images/${fileKey}`);
  url.searchParams.set('ids', ids);
  url.searchParams.set('format', 'png');
  url.searchParams.set('scale', String(scale));

  const response = await fetch(url, { headers: { 'X-Figma-Token': token } });
  if (!response.ok) throw new Error(`Figma Images respondeu ${response.status}.`);

  const payload = await response.json();
  const manifest = [];

  for (const frame of frames) {
    const imageUrl = payload.images?.[frame.id];
    if (!imageUrl) {
      console.warn(`Frame sem imagem: ${frame.name}`);
      continue;
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Falha ao baixar ${frame.name}.`);

    const filename = `${slugify(frame.name)}.png`;
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    await writeFile(path.join(outputDir, filename), buffer);
    manifest.push({ ...frame, filename, scale, bytes: buffer.length });
    console.log(`Exportado: ${filename}`);
  }

  return manifest;
}

const desktop = report.frames.filter((frame) => frame.name.startsWith('Desktop'));
const mobile = report.frames.filter((frame) => frame.name.startsWith('Mobile'));
const manifest = [...(await exportGroup(desktop, 1)), ...(await exportGroup(mobile, 2))];

await writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`${manifest.length} frames exportados para design/frames/.`);
