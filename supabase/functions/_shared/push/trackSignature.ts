/** HMAC tag binding a push-track tap to the delivery id the dispatcher actually sent. */
export async function signDelivery(secret: string, deliveryId: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`push-track:${deliveryId}`)));
  return Array.from(sig.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}
export async function verifyDelivery(secret: string, deliveryId: string, tag: unknown): Promise<boolean> {
  if (typeof tag !== "string" || tag.length !== 32) return false;
  const expected = await signDelivery(secret, deliveryId);
  let diff = 0;
  for (let i = 0; i < 32; i++) diff |= expected.charCodeAt(i) ^ tag.charCodeAt(i);
  return diff === 0;
}
