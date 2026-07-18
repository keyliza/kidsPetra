/** Extrae el ID de archivo de un enlace de Google Drive, si aplica. */
function driveFileId(url: string): string | null {
  const byPath = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (byPath) return byPath[1];
  const byQuery = url.match(/[?&]id=([^&]+)/);
  if (byQuery && url.includes('drive.google.com')) return byQuery[1];
  return null;
}

/** URL apta para incrustar en un iframe (vista previa de Drive o PDF directo). */
export function embedUrl(url: string): string {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}

/** URL de descarga directa. */
export function downloadUrl(url: string): string {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}
