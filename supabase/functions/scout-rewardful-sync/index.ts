import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

console.log('scout-rewardful-sync function started')

// PAID_FEATURE: kill switch — set to true to re-enable Rewardful affiliate sync
const PAID_FEATURES_ENABLED = false

serve(async (req) => {
  // PAID_FEATURE: kill switch
  if (!PAID_FEATURES_ENABLED) return new Response(
    JSON.stringify({ ok: false, disabled: true }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  )
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const payload = await req.json()
    const { type, record } = payload

    if (type !== 'INSERT' || !record?.id || !record?.email || !record?.referral_code) {
      console.log('Skipping: missing required fields', { type, id: record?.id, email: record?.email, code: record?.referral_code })
      return new Response(JSON.stringify({ ok: true, message: 'Skipped: missing data' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      })
    }

    const REWARDFUL_API_KEY    = Deno.env.get('REWARDFUL_API_KEY')
    const REWARDFUL_CAMPAIGN_ID = Deno.env.get('REWARDFUL_CAMPAIGN_ID')

    if (!REWARDFUL_API_KEY || !REWARDFUL_CAMPAIGN_ID) {
      throw new Error('Missing REWARDFUL_API_KEY or REWARDFUL_CAMPAIGN_ID')
    }

    // Create affiliate in Rewardful
    const res = await fetch('https://api.rewardful.com/v1/affiliates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(REWARDFUL_API_KEY + ':'),
      },
      body: JSON.stringify({
        campaign_id:   REWARDFUL_CAMPAIGN_ID,
        email:         record.email,
        referral_code: record.referral_code,  // becomes their affiliate slug
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      // 422 = affiliate already exists — not a real error
      if (res.status === 422) {
        console.log('Affiliate already exists in Rewardful:', record.email)
        return new Response(JSON.stringify({ ok: true, message: 'Already exists' }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        })
      }
      console.error('Rewardful API error:', res.status, data)
      return new Response(JSON.stringify({ ok: false, error: data }), {
        status: res.status, headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Rewardful affiliate created:', record.email, data.id)
    return new Response(JSON.stringify({ ok: true, rewardfulId: data.id }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Function error:', error.message)
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
