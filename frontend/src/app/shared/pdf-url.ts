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

/**
 * Ruta del proxy propio para leer los bytes del PDF con `fetch`.
 * No se puede pedir a Drive directamente: responde 403 a las peticiones
 * cross-site por su cabecera `Sec-Fetch-Site`, que el navegador impone y JS
 * no puede alterar. Desde nuestro origen viaja como `same-origin` y pasa.
 */
export function fetchUrl(url: string): string {
  const id = driveFileId(url);
  return id ? `/drive/download?id=${id}&export=download` : url;
}

/** URL de descarga directa. */
export function downloadUrl(url: string): string {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}
