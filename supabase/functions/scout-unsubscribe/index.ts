// scout-unsubscribe
// GET /scout-unsubscribe?t=<unsubscribe_token>
//
// One-click unsubscribe for family circle members.
// Token is a UUID stored in family_members.unsubscribe_token.
// Sets family_members.status = 'unsubscribed' and returns a confirmation HTML page.
// No auth required — token is the credential.
//
// Deploy: supabase functions deploy scout-unsubscribe

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const html = (title: string, heading: string, body: string, color = '#6E4ED6') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #F7F5FF; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 16px; border: 1px solid #E5E2EC; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-family: Georgia, serif; font-size: 24px; color: #1D1D1F; margin-bottom: 12px; line-height: 1.3; }
    p { font-size: 15px; color: #5C5960; line-height: 1.7; }
    a { color: ${color}; text-decoration: none; font-weight: 600; }
    .tag { display: inline-block; background: #F0EBFF; color: ${color}; font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 4px 12px; border-radius: 100px; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="tag">FamilyForce Scout</div>
    <div class="icon">${heading === 'Already unsubscribed' ? '👍' : '✅'}</div>
    <h1>${heading}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const url   = new URL(req.url)
  const token = url.searchParams.get('t')

  const respondHtml = (status: number, title: string, heading: string, body: string) =>
    new Response(html(title, heading, body), {
      status,
      headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8' },
    })

  if (!token) {
    return respondHtml(400, 'Invalid link', 'Invalid link', 'This unsubscribe link is missing its token. Please use the link from your email.')
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  // Look up the family_members row by token
  const { data: member, error: lookupErr } = await sb
    .from('family_members')
    .select('id, status, child_id, children:child_id(name)')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  if (lookupErr || !member) {
    return respondHtml(404, 'Link not found', 'Link not found', 'This unsubscribe link is invalid or has expired. If you\'re still receiving emails, contact us at support@getfamilyforce.com.')
  }

  // Already unsubscribed
  if (member.status === 'unsubscribed') {
    const childName = (member.children as { name?: string } | null)?.name || 'this child'
    return respondHtml(200, 'Already unsubscribed', 'Already unsubscribed', `You're already unsubscribed from Scout updates for ${childName}. You won't receive any more emails.`)
  }

  // Set status = unsubscribed
  const { error: updateErr } = await sb
    .from('family_members')
    .update({ status: 'unsubscribed' })
    .eq('unsubscribe_token', token)

  if (updateErr) {
    console.error('[scout-unsubscribe] update failed:', updateErr)
    return respondHtml(500, 'Something went wrong', 'Something went wrong', 'We couldn\'t process your unsubscribe request. Please try again or contact us at support@getfamilyforce.com.')
  }

  const childName = (member.children as { name?: string } | null)?.name || 'this child'

  return respondHtml(200, 'Unsubscribed', 'You\'re unsubscribed', `You'll no longer receive Scout digest emails for ${childName}. If this was a mistake, ask the account owner to re-add you to the family circle.`)
})
