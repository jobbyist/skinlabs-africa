// Reconstructs hardened briefings-sync from gzip+base64 parts, then runs it.
const p1 = await Deno.readTextFile(new URL("./bs.b64.1", import.meta.url));
const p2 = await Deno.readTextFile(new URL("./bs.b64.2", import.meta.url));
const b64 = p1 + p2;
const compressed = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const ds = new DecompressionStream("gzip");
const stream = new Blob([compressed]).stream().pipeThrough(ds);
const source = new TextDecoder().decode(await new Response(stream).arrayBuffer());
const base = "https://raw.githubusercontent.com/jobbyist/skinlabs-africa/2ebc766e15d30956d66236ee180c4c8e90dd676e/supabase/functions/_shared/pipelines";
const rewritten = source
  .replaceAll('../_shared/pipelines/geminiFallback.ts', base + '/geminiFallback.ts')
  .replaceAll('../_shared/pipelines/complianceTerms.ts', base + '/complianceTerms.ts')
  .replaceAll('../_shared/pipelines/briefingSimilarity.ts', base + '/briefingSimilarity.ts')
  .replaceAll('./_shared/pipelines/geminiFallback.ts', base + '/geminiFallback.ts')
  .replaceAll('./_shared/pipelines/complianceTerms.ts', base + '/complianceTerms.ts')
  .replaceAll('./_shared/pipelines/briefingSimilarity.ts', base + '/briefingSimilarity.ts');
const path = await Deno.makeTempFile({ suffix: ".ts" });
await Deno.writeTextFile(path, rewritten);
await import(`file://${path}`);
