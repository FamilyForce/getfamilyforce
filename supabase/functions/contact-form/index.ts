// ═══════════════════════════════════════════════════════════════
// FamilyForce — Contact Form Handler
// Receives POST from contact.html, forwards to support@ via Resend
//
// Deploy: supabase functions deploy contact-form
//
// Secrets: RESEND_API_KEY
// ═══════════════════════════════════════════════════════════════

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  let body: { first_name?: string; email?: string; subject?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { first_name, email, subject, message } = body

  if (!first_name || !email || !subject || !message) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'Server misconfiguration' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;color:#6E4ED6;">New contact form submission</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;font-weight:700;width:100px;">From</td><td style="padding:8px 0;">${first_name} &lt;${email}&gt;</td></tr>
        <tr><td style="padding:8px 0;font-weight:700;">Subject</td><td style="padding:8px 0;">${subject}</td></tr>
      </table>
      <hr style="margin:16px 0;border:none;border-top:1px solid #eee;">
      <p style="white-space:pre-wrap;line-height:1.6;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      <hr style="margin:16px 0;border:none;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;">Reply directly to this email to respond to ${first_name}.</p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:     'FamilyForce Contact <support@getfamilyforce.com>',
      to:       ['support@getfamilyforce.com'],
      reply_to: email,
      subject:  `[Contact] ${subject} — ${first_name}`,
      html:     emailHtml,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[contact-form] Resend error:', err)
    return new Response(JSON.stringify({ success: false, error: 'Failed to send email' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
