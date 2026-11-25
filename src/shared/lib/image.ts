/** Reduz uma imagem enviada pelo usuário para um avatar quadrado (data URL JPEG ≤ ~60 KB). */
export async function resizeToAvatar(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponível.');

  // Recorte central (cover).
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', 0.85);
}
