// Lectura en streaming de un CSV elegido por el usuario en el navegador.

/** Llama a `onLine` por cada línea del archivo e informa el avance (0 a 1). */
export async function readLines(
  file: File,
  onLine: (line: string) => void,
  onProgress: (fraction: number, lines: number) => void,
): Promise<number> {
  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
  let rest = "";
  let bytes = 0;
  let lines = 0;
  let lastUpdate = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.length;
    const parts = (rest + value).split("\n");
    rest = parts.pop() ?? "";
    for (const line of parts) {
      lines++;
      onLine(line.trim());
    }
    const now = performance.now();
    if (now - lastUpdate > 120) {
      lastUpdate = now;
      onProgress(Math.min(1, bytes / file.size), lines);
    }
  }
  if (rest) {
    lines++;
    onLine(rest.trim());
  }
  onProgress(1, lines);
  return lines;
}
