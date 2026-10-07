/**
 * The server-rendered content routes boot the SPA, not the TanStack client bundle (see src/routes/__root.tsx), but
 * TanStack still emits `<link rel="modulepreload">` hints for its own route chunks (~260 kB gzipped) — bytes that would
 * compete with the real app bundle on a phone and never execute. The shell's own preloads carry `data-spa-shell`
 * and are kept; every other modulepreload is dropped from the document head.
 */
export const SPA_SHELL_MARKER = "data-spa-shell";

const MODULEPRELOAD = /<link\b[^>]*\brel="modulepreload"[^>]*>/gi;

export const stripClientPreloads = (headHtml: string): string =>
  headHtml.replace(MODULEPRELOAD, (tag) => (tag.includes(SPA_SHELL_MARKER) ? tag : ""));

/** Rewrites only the part of an HTML response up to </head>; the body streams through untouched. */
export const stripClientPreloadsFromResponse = (response: Response): Response => {
  const type = response.headers.get("content-type") ?? "";
  if (!response.body || !/text\/html/i.test(type)) return response;

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let headDone = false;
  const MAX_HEAD_CHARS = 256 * 1024; // never hold back a response indefinitely

  const stream = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (headDone) {
          controller.enqueue(chunk);
          return;
        }
        buffer += decoder.decode(chunk, { stream: true });
        const end = buffer.indexOf("</head>");
        if (end === -1 && buffer.length < MAX_HEAD_CHARS) return;
        const cut = end === -1 ? buffer.length : end + "</head>".length;
        headDone = true;
        controller.enqueue(encoder.encode(stripClientPreloads(buffer.slice(0, cut)) + buffer.slice(cut)));
        buffer = "";
      },
      flush(controller) {
        if (!headDone && buffer) controller.enqueue(encoder.encode(stripClientPreloads(buffer)));
      },
    }),
  );
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(stream, { status: response.status, statusText: response.statusText, headers });
};
