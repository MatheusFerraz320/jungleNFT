import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

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

const fileResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
  headers: { 'X-Figma-Token': token },
});
if (!fileResponse.ok) throw new Error(`Figma respondeu ${fileResponse.status}.`);
const file = await fileResponse.json();

const artworks = [];
function visit(node, parentPath = '') {
  const currentPath = parentPath ? `${parentPath} / ${node.name}` : node.name;
  const match = node.name.match(/^NFT Artwork (\d{2})$/);
  if (
    match &&
    currentPath.includes('Desktop / Início / Products / Product Grid') &&
    Number(match[1]) >= 3 &&
    Number(match[1]) <= 11
  ) {
    artworks.push({
      id: node.id,
      name: node.name,
      number: Number(match[1]),
      width: node.absoluteBoundingBox?.width,
      height: node.absoluteBoundingBox?.height,
    });
  }
  for (const child of node.children ?? []) visit(child, currentPath);
}
for (const child of file.document.children ?? []) visit(child);
artworks.sort((a, b) => a.number - b.number);

if (artworks.length !== 9) {
  throw new Error(`Esperados 9 artworks únicos, encontrados ${artworks.length}.`);
}

const outputDir = path.join(root, 'public', 'assets', 'nfts');
await mkdir(outputDir, { recursive: true });

const imageUrl = new URL(`https://api.figma.com/v1/images/${fileKey}`);
imageUrl.searchParams.set('ids', artworks.map((artwork) => artwork.id).join(','));
imageUrl.searchParams.set('format', 'png');
imageUrl.searchParams.set('scale', '2');

const imageResponse = await fetch(imageUrl, { headers: { 'X-Figma-Token': token } });
if (!imageResponse.ok) throw new Error(`Figma Images respondeu ${imageResponse.status}.`);
const payload = await imageResponse.json();
const manifest = [];

for (const artwork of artworks) {
  const url = payload.images?.[artwork.id];
  if (!url) throw new Error(`Imagem não gerada para ${artwork.name}.`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao baixar ${artwork.name}.`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const webp = await sharp(buffer).webp({ quality: 82 }).toBuffer();
  const filename = `artwork-${String(artwork.number).padStart(2, '0')}.webp`;
  await writeFile(path.join(outputDir, filename), webp);
  manifest.push({ ...artwork, filename, bytes: webp.length });
  console.log(`Exportado: ${filename}`);
}

await mkdir(path.join(root, 'design', 'assets'), { recursive: true });
await writeFile(
  path.join(root, 'design', 'assets', 'artworks.json'),
  JSON.stringify(manifest, null, 2),
);
