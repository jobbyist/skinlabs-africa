// Reconstructs hardened briefings-sync from gzip+base64 parts hosted on GitHub, then runs it.
const baseUrl = "https://raw.githubusercontent.com/jobbyist/skinlabs-africa/main/supabase/functions/briefings-sync";
const p1 = await (await fetch(`${baseUrl}/bs.b64.1`)).text();
const p2 = await (await fetch(`${baseUrl}/bs.b64.2`)).text();
const b64 = p1.trim() + p2.trim();
const compressed = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const ds = new DecompressionStream("gzip");
const stream = new Blob([compressed]).stream().pipeThrough(ds);
const source = new TextDecoder().decode(await new Response(stream).arrayBuffer());
// Rewrite relative imports to absolute raw URLs for shared modules
const sharedBase = "https://raw.githubusercontent.com/jobbyist/skinlabs-africa/2ebc766e15d30956d66236ee180c4c8e90dd676e/supabase/functions/_shared/pipelines";
const rewritten = source
  .replaceAll('../_shared/pipelines/geminiFallback.ts', sharedBase + '/geminiFallback.ts')
  .replaceAll('../_shared/pipelines/complianceTerms.ts', sharedBase + '/complianceTerms.ts')
  .replaceAll('../_shared/pipelines/briefingSimilarity.ts', sharedBase + '/briefingSimilarity.ts')
  .replaceAll('./_shared/pipelines/geminiFallback.ts', sharedBase + '/geminiFallback.ts')
  .replaceAll('./_shared/pipelines/complianceTerms.ts', sharedBase + '/complianceTerms.ts')
  .replaceAll('./_shared/pipelines/briefingSimilarity.ts', sharedBase + '/briefingSimilarity.ts');
const path = await Deno.makeTempFile({ suffix: ".ts" });
await Deno.writeTextFile(path, rewritten);
await import(`file://${path}`);
