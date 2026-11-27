/**
 * Dispara la descarga de un archivo ya generado en el navegador.
 * Se usa para el CSV exportado desde la API; nunca lee datos del usuario.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") {
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
