// Single Resend-calling primitive, reused by email-processor. Previously
// deployed directly to the project (untracked by this repo) with a
// broader access check — any signed-in user's JWT satisfied it. Now
// tightened to service-role only, since its only legitimate caller going
// forward is email-processor; the Supabase Auth "Send Email" Hook
// configured in the Dashboard (invisible to this repo) is expected to
// call Supabase's own auth email delivery path, not this function, for
// token-bearing emails (signup confirmation, magic link, password reset).
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is required')
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')

const FROM = 'SkinLabs® South Africa <support@skinlabs.co.za>'
const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  })
}

function isEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authorization = req.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null
  if (!token || token !== SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Service role authorization required' }, 401)
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400)
  }

  const to = payload.to
  const subject = payload.subject
  const html = payload.html
  const text = payload.text
  const idempotencyKey = payload.idempotency_key

  const recipients = Array.isArray(to) ? to : [to]
  if (recipients.length === 0 || recipients.length > 50 || !recipients.every(isEmail)) {
    return json({ error: 'to must contain 1–50 valid email addresses' }, 400)
  }
  if (typeof subject !== 'string' || subject.trim().length === 0 || subject.length > 998) {
    return json({ error: 'subject is required and must be at most 998 characters' }, 400)
  }
  if (typeof html !== 'string' && typeof text !== 'string') {
    return json({ error: 'Provide html or text content' }, 400)
  }
  if (typeof html === 'string' && html.length > 1_000_000) {
    return json({ error: 'html is too large' }, 413)
  }
  if (typeof text === 'string' && text.length > 1_000_000) {
    return json({ error: 'text is too large' }, 413)
  }
  if (idempotencyKey !== undefined && (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0 || idempotencyKey.length > 256)) {
    return json({ error: 'idempotency_key must be a non-empty string of at most 256 characters' }, 400)
  }

  // Only List-Unsubscribe/List-Unsubscribe-Post are ever forwarded to
  // Resend — an explicit allowlist, not a generic passthrough, so this
  // endpoint can never be used to inject arbitrary email headers.
  const ALLOWED_CUSTOM_HEADERS = new Set(['List-Unsubscribe', 'List-Unsubscribe-Post'])
  const customHeaders: Record<string, string> = {}
  if (payload.headers !== undefined) {
    if (typeof payload.headers !== 'object' || payload.headers === null || Array.isArray(payload.headers)) {
      return json({ error: 'headers must be an object' }, 400)
    }
    for (const [key, value] of Object.entries(payload.headers as Record<string, unknown>)) {
      if (!ALLOWED_CUSTOM_HEADERS.has(key)) {
        return json({ error: `Unsupported header: ${key}` }, 400)
      }
      if (typeof value !== 'string' || value.length === 0 || value.length > 998) {
        return json({ error: `${key} must be a non-empty string of at most 998 characters` }, 400)
      }
      customHeaders[key] = value
    }
  }

  const resendPayload: Record<string, unknown> = {
    from: FROM,
    to: recipients,
    subject: subject.trim(),
  }
  if (typeof html === 'string') resendPayload.html = html
  if (typeof text === 'string') resendPayload.text = text
  if (isEmail(payload.reply_to)) resendPayload.reply_to = payload.reply_to
  if (Object.keys(customHeaders).length > 0) resendPayload.headers = customHeaders

  const resendHeaders: Record<string, string> = {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  }
  // Lets a retried request (e.g. after this function crashes right after
  // Resend accepted the send, before the caller could record success)
  // reuse the same Resend-side result instead of causing a real duplicate
  // send. See email-processor's crash-safety design.
  if (typeof idempotencyKey === 'string') {
    resendHeaders['Idempotency-Key'] = idempotencyKey
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: resendHeaders,
    body: JSON.stringify(resendPayload),
  })

  const responseText = await resendResponse.text()
  let responseBody: unknown
  try {
    responseBody = JSON.parse(responseText)
  } catch {
    responseBody = { message: responseText }
  }

  if (!resendResponse.ok) {
    console.error('Resend API error', { status: resendResponse.status, body: responseBody })
    return json({ error: 'Email provider rejected the message', status: resendResponse.status, detail: responseBody }, 502)
  }

  return json({ ok: true, data: responseBody }, 200)
})
