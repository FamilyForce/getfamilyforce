// scout-admin/index.ts
// CEO admin portal API — protected by SCOUT_ADMIN_TOKEN env var
// Actions: stats | users | gifts | emails | upcoming | user-detail

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, authorization', 'Content-Type': 'application/json' }

const ok  = (d: unknown)          => new Response(JSON.stringify(d), { headers: H })
const err = (s: number, m: string) => new Response(JSON.stringify({ error: m }), { status: s, headers: H })

// ── helpers ───────────────────────────────────────────────────────────────────

function ageStr(dob: string | null): string {
  if (!dob) return '—'
  const d = new Date(dob)
  const now = new Date()
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
  if (months < 0) {
    const daysUntil = Math.ceil((d.getTime() - now.getTime()) / 86400000)
    return `Due in ${daysUntil}d`
  }
  if (months === 0) return 'Newborn'
  if (months < 24) return `${months}mo`
  const yrs = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${yrs}y ${rem}mo` : `${yrs}y`
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

function subStatusLabel(sub: Record<string, unknown> | null): string {
  if (!sub) return 'none'
  if (sub.is_gift && sub.status === 'trialing') return 'gift-trial'
  return sub.status as string
}

function planLabel(plan: string | null): string {
  if (!plan) return '—'
  if (plan === 'monthly')   return 'Monthly'
  if (plan === 'annual')    return 'Annual'
  if (plan === 'triennial') return '3-Year'
  return plan
}

// ── action handlers ───────────────────────────────────────────────────────────

async function getStats(sb: ReturnType<typeof createClient>) {
  const now       = new Date()
  const ago7      = new Date(now.getTime() - 7  * 86400000).toISOString()
  const ago30     = new Date(now.getTime() - 30 * 86400000).toISOString()
  const in7       = new Date(now.getTime() + 7  * 86400000).toISOString()

  const [
    { data: subs },
    { count: totalUsers },
    { count: new7d },
    { count: new30d },
    { data: gifts },
    { count: digests7d },
    { count: digestsTotal },
  ] = await Promise.all([
    sb.from('scout_subscriptions').select('id, status, plan, is_gift, trial_end, period_end, created_at'),
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', ago7),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', ago30),
    sb.from('scout_gifts').select('id, gift_email_sent, redeemed_at, deliver_at, expires_at, created_at'),
    sb.from('scout_digest_log').select('id', { count: 'exact', head: true }).gte('sent_at', ago7),
    sb.from('scout_digest_log').select('id', { count: 'exact', head: true }),
  ])

  const allSubs = subs ?? []
  const activePaid = allSubs.filter(s => s.status === 'active' && !s.is_gift)
  const activeGifts = allSubs.filter(s => s.status === 'active' && s.is_gift)
  const trials = allSubs.filter(s => s.status === 'trialing')
  const expiring7d = trials.filter(s => s.trial_end && new Date(s.trial_end) <= new Date(in7) && new Date(s.trial_end) > now)

  const mrr = activePaid.reduce((sum, s) => {
    if (s.plan === 'monthly')   return sum + 9.99
    if (s.plan === 'annual')    return sum + 49.99 / 12
    if (s.plan === 'triennial') return sum + 99.99 / 36
    return sum
  }, 0)

  const allGifts = gifts ?? []
  const giftsDelivered = allGifts.filter(g => g.gift_email_sent)
  const giftsPending   = allGifts.filter(g => !g.gift_email_sent && g.deliver_at)
  const giftsRedeemed  = allGifts.filter(g => g.redeemed_at)
  const giftsExpired   = allGifts.filter(g => !g.redeemed_at && g.expires_at && new Date(g.expires_at) < now)
  const giftsLive      = giftsDelivered.filter(g => !g.redeemed_at && (!g.expires_at || new Date(g.expires_at) >= now))

  return {
    subs: {
      active_paid:      activePaid.length,
      active_gifts:     activeGifts.length,
      trialing:         trials.length,
      cancelling:       allSubs.filter(s => s.status === 'cancelling').length,
      cancelled:        allSubs.filter(s => s.status === 'cancelled').length,
      expiring_7d:      expiring7d.length,
      monthly_count:    activePaid.filter(s => s.plan === 'monthly').length,
      annual_count:     activePaid.filter(s => s.plan === 'annual').length,
      triennial_count:  activePaid.filter(s => s.plan === 'triennial').length,
      mrr:              Math.round(mrr * 100) / 100,
      arr:              Math.round(mrr * 12 * 100) / 100,
    },
    gifts: {
      total_sold:           allGifts.length,
      total_redeemed:       giftsRedeemed.length,
      pending_delivery:     giftsPending.length,
      delivered_unredeemed: giftsLive.length,
      expired_unclaimed:    giftsExpired.length,
    },
    users: {
      total:  totalUsers  ?? 0,
      new_7d: new7d       ?? 0,
      new_30d: new30d     ?? 0,
    },
    emails: {
      digests_7d:    digests7d    ?? 0,
      digests_total: digestsTotal ?? 0,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function getUsers(sb: ReturnType<typeof createClient>, body: Record<string, unknown>) {
  const search       = ((body.search as string) ?? '').toLowerCase().trim()
  const filterStatus = (body.filterStatus as string) ?? 'all'

  // Load all data in parallel
  const [
    authResult,
    { data: profiles },
    { data: children },
    { data: subs },
    { data: digests },
    { data: familyMembers },
  ] = await Promise.all([
    sb.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    sb.from('profiles').select('id, name, referral_code, created_at'),
    sb.from('children').select('id, user_id, name, dob, gender, created_at'),
    sb.from('scout_subscriptions').select('id, user_id, child_id, status, plan, trial_end, period_end, is_gift, plan_months, stripe_sub_id, created_at'),
    sb.from('scout_digest_log').select('user_id, child_id, digest_type, sent_at, email_subject').order('sent_at', { ascending: false }),
    sb.from('family_members').select('owner_user_id, member_user_id, child_id, status, invited_email'),
  ])

  const authUsers = authResult.data?.users ?? []

  // Build lookup maps
  const profileMap    = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const childrenByUser: Record<string, typeof children> = {}
  for (const c of children ?? []) {
    ;(childrenByUser[c.user_id] ??= []).push(c)
  }
  const subsByUser: Record<string, typeof subs> = {}
  for (const s of subs ?? []) {
    ;(subsByUser[s.user_id] ??= []).push(s)
  }
  const lastDigestByUser: Record<string, (typeof digests)[0]> = {}
  for (const d of digests ?? []) {
    if (!lastDigestByUser[d.user_id]) lastDigestByUser[d.user_id] = d
  }
  const familyCountByOwner: Record<string, number> = {}
  for (const fm of familyMembers ?? []) {
    if (fm.status === 'active') familyCountByOwner[fm.owner_user_id] = (familyCountByOwner[fm.owner_user_id] ?? 0) + 1
  }

  let users = authUsers.map(u => {
    const profile      = profileMap[u.id] ?? {}
    const userChildren = childrenByUser[u.id] ?? []
    const userSubs     = subsByUser[u.id] ?? []
    const lastDigest   = lastDigestByUser[u.id] ?? null
    const familyCount  = familyCountByOwner[u.id] ?? 0

    // Primary sub: active > trialing > cancelling > most recent
    const sub = userSubs.find(s => s.status === 'active')
      ?? userSubs.find(s => s.status === 'trialing')
      ?? userSubs.find(s => s.status === 'cancelling')
      ?? userSubs[0]
      ?? null

    // Primary child: match sub's child_id, else first
    const primaryChild = (sub?.child_id ? userChildren.find(c => c.id === sub.child_id) : null) ?? userChildren[0] ?? null

    return {
      id:            u.id,
      email:         u.email ?? '—',
      name:          (profile as Record<string, string>).name ?? '',
      created_at:    u.created_at,
      children_count: userChildren.length,
      primary_child:  primaryChild ? { id: primaryChild.id, name: primaryChild.name, dob: primaryChild.dob, age: ageStr(primaryChild.dob) } : null,
      sub_status:    subStatusLabel(sub),
      sub_plan:      sub?.plan ?? null,
      sub_is_gift:   sub?.is_gift ?? false,
      trial_end:     sub?.trial_end ?? null,
      period_end:    sub?.period_end ?? null,
      last_digest:   lastDigest ? { sent_at: lastDigest.sent_at, type: lastDigest.digest_type, subject: lastDigest.email_subject } : null,
      family_count:  familyCount,
      referral_code: (profile as Record<string, string>).referral_code ?? null,
    }
  })

  // Filter
  if (search) {
    users = users.filter(u => u.email.toLowerCase().includes(search) || u.name.toLowerCase().includes(search) || (u.primary_child?.name ?? '').toLowerCase().includes(search))
  }
  if (filterStatus !== 'all') {
    if (filterStatus === 'none') users = users.filter(u => u.sub_status === 'none')
    else users = users.filter(u => u.sub_status === filterStatus)
  }

  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return { users, total: users.length }
}

// ─────────────────────────────────────────────────────────────────────────────

async function getGifts(sb: ReturnType<typeof createClient>) {
  const { data: gifts } = await sb.from('scout_gifts')
    .select('id, code, plan, plan_months, buyer_name, buyer_email, recipient_email, recipient_name, personal_message, deliver_at, gift_email_sent, redeemed_at, redeemed_by, expires_at, created_at, promo_code')
    .order('created_at', { ascending: false })

  const now = new Date()
  return (gifts ?? []).map(g => ({
    ...g,
    state: g.redeemed_at ? 'redeemed'
      : !g.gift_email_sent && g.deliver_at && new Date(g.deliver_at) > now ? 'scheduled'
      : !g.gift_email_sent ? 'pending'
      : g.expires_at && new Date(g.expires_at) < now ? 'expired'
      : 'delivered',
    deliver_at_fmt: fmtDate(g.deliver_at),
    expires_at_fmt: fmtDate(g.expires_at),
    redeemed_at_fmt: fmtDate(g.redeemed_at),
    created_at_fmt:  fmtDate(g.created_at),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────

async function getEmails(sb: ReturnType<typeof createClient>) {
  const ago30 = new Date(Date.now() - 30 * 86400000).toISOString()

  const [
    { data: digests },
    { data: events },
    { data: profiles },
  ] = await Promise.all([
    sb.from('scout_digest_log')
      .select('id, user_id, child_id, digest_type, email_subject, sent_at, child_age_months')
      .gte('sent_at', ago30)
      .order('sent_at', { ascending: false })
      .limit(200),
    sb.from('scout_events')
      .select('id, user_id, event_type, properties, occurred_at')
      .in('event_type', ['trial_start', 'trial_converted', 'gift_purchased', 'gift_redeemed', 'subscription_cancelled', 'subscription_reactivated'])
      .gte('occurred_at', ago30)
      .order('occurred_at', { ascending: false })
      .limit(200),
    sb.from('profiles').select('id, name'),
  ])

  const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name ?? '']))

  const digestRows = (digests ?? []).map(d => ({
    type:    'digest',
    subtype: d.digest_type,
    label:   d.email_subject ?? `Scout digest — month ${d.child_age_months}`,
    user_id: d.user_id,
    name:    nameMap[d.user_id] ?? '',
    ts:      d.sent_at,
  }))

  const eventRows = (events ?? []).map(e => ({
    type:    'event',
    subtype: e.event_type,
    label:   e.event_type.replace(/_/g, ' '),
    user_id: e.user_id ?? '',
    name:    e.user_id ? (nameMap[e.user_id] ?? '') : '—',
    ts:      e.occurred_at,
    props:   e.properties,
  }))

  // Merge and sort by timestamp
  const all = [...digestRows, ...eventRows].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

  return { rows: all, total: all.length }
}

// ─────────────────────────────────────────────────────────────────────────────

async function getUpcoming(sb: ReturnType<typeof createClient>) {
  const now  = new Date()
  const in14 = new Date(now.getTime() + 14 * 86400000).toISOString()

  const [
    { data: scheduledGifts },
    { data: expiringTrials },
    { data: profiles },
    { data: children },
  ] = await Promise.all([
    sb.from('scout_gifts')
      .select('id, code, buyer_name, buyer_email, recipient_email, recipient_name, plan, deliver_at, gift_email_sent')
      .eq('gift_email_sent', false)
      .not('deliver_at', 'is', null)
      .lte('deliver_at', in14)
      .gt('deliver_at', now.toISOString())
      .order('deliver_at', { ascending: true }),
    sb.from('scout_subscriptions')
      .select('id, user_id, child_id, plan, trial_end, status')
      .eq('status', 'trialing')
      .lte('trial_end', in14)
      .gt('trial_end', now.toISOString())
      .order('trial_end', { ascending: true }),
    sb.from('profiles').select('id, name'),
    sb.from('children').select('id, user_id, name, dob'),
  ])

  const nameMap  = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name ?? '']))
  const childMap = Object.fromEntries((children ?? []).map(c => [c.id, c]))

  const giftDeliveries = (scheduledGifts ?? []).map(g => ({
    type:            'gift-delivery',
    when:             g.deliver_at,
    when_fmt:         fmtDate(g.deliver_at),
    days_until:       daysUntil(g.deliver_at),
    description:      `Gift (${g.plan}) from ${g.buyer_name} → ${g.recipient_name} (${g.recipient_email})`,
    code:             g.code,
  }))

  const trialExpiries = (expiringTrials ?? []).map(t => {
    const child = t.child_id ? childMap[t.child_id] : null
    const name  = nameMap[t.user_id] ?? 'Unknown'
    return {
      type:         'trial-expiry',
      when:          t.trial_end,
      when_fmt:      fmtDate(t.trial_end),
      days_until:    daysUntil(t.trial_end),
      description:   `Trial ends — ${name}${child ? ` (${child.name})` : ''}`,
      user_id:       t.user_id,
    }
  })

  const all = [...giftDeliveries, ...trialExpiries].sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime())

  return { items: all }
}

// ─────────────────────────────────────────────────────────────────────────────

async function getUserDetail(sb: ReturnType<typeof createClient>, email: string) {
  if (!email) return { error: 'email required' }

  // Find auth user by email
  const { data: { users: authUsers } } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const authUser = authUsers.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!authUser) return { found: false }

  const userId = authUser.id

  const [
    { data: profile },
    { data: children },
    { data: subs },
    { data: events },
    { data: digests },
    { data: giftsReceived },
    { data: giftsSent },
    { data: familyMembers },
  ] = await Promise.all([
    sb.from('profiles').select('*').eq('id', userId).maybeSingle(),
    sb.from('children').select('*').eq('user_id', userId).order('created_at'),
    sb.from('scout_subscriptions').select('*').eq('user_id', userId).order('created_at'),
    sb.from('scout_events').select('*').eq('user_id', userId).order('occurred_at', { ascending: false }).limit(100),
    sb.from('scout_digest_log').select('*').eq('user_id', userId).order('sent_at', { ascending: false }),
    sb.from('scout_gifts').select('id, code, plan, buyer_name, buyer_email, redeemed_at, created_at, deliver_at, gift_email_sent').eq('redeemed_by', userId),
    sb.from('scout_gifts').select('id, code, plan, recipient_email, recipient_name, redeemed_at, gift_email_sent, deliver_at, created_at').eq('buyer_email', authUser.email ?? ''),
    sb.from('family_members').select('*').or(`owner_user_id.eq.${userId},member_user_id.eq.${userId}`),
  ])

  return {
    found:          true,
    auth:           { id: authUser.id, email: authUser.email, created_at: authUser.created_at, last_sign_in: authUser.last_sign_in_at, email_confirmed: !!authUser.email_confirmed_at },
    profile,
    children:       children ?? [],
    subscriptions:  subs ?? [],
    events:         events ?? [],
    digests:        digests ?? [],
    gifts_received: giftsReceived ?? [],
    gifts_sent:     giftsSent ?? [],
    family_members: familyMembers ?? [],
  }
}

// ── analytics ─────────────────────────────────────────────────────────────────

async function getAnalytics(sb: ReturnType<typeof createClient>) {
  const now              = new Date()
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const ago7             = new Date(now.getTime() - 7  * 86400000).toISOString()
  const ago14            = new Date(now.getTime() - 14 * 86400000).toISOString()

  const [
    { data: trialEvents },
    { data: convEvents },
    { data: referralEvents },
    { data: profiles },
    { data: expiredTrials },
    { count: users7d },
    { count: usersPrev },
    { data: authResult },
  ] = await Promise.all([
    sb.from('scout_events').select('user_id, occurred_at').eq('event_type', 'trial_start'),
    sb.from('scout_events').select('user_id, occurred_at, properties').eq('event_type', 'trial_converted'),
    sb.from('scout_events').select('user_id, occurred_at, properties').eq('event_type', 'referral_attributed').order('occurred_at', { ascending: false }),
    sb.from('profiles').select('id, name, referral_code, created_at'),
    sb.from('scout_subscriptions').select('user_id, child_id, trial_end, plan, created_at').eq('status', 'trialing').lt('trial_end', now.toISOString()),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', ago7),
    sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', ago14).lt('created_at', ago7),
    sb.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const trials   = trialEvents  ?? []
  const convs    = convEvents   ?? []
  const referrals = referralEvents ?? []

  // Funnel counts
  const trialsAll    = trials.length
  const trialsMonth  = trials.filter(e => e.occurred_at >= startOfMonth).length
  const trialsLast   = trials.filter(e => e.occurred_at >= startOfLastMonth && e.occurred_at < startOfMonth).length
  const convsAll     = convs.length
  const convsMonth   = convs.filter(e => e.occurred_at >= startOfMonth).length
  const convsLast    = convs.filter(e => e.occurred_at >= startOfLastMonth && e.occurred_at < startOfMonth).length
  const convRate     = trialsAll > 0 ? Math.round(convsAll / trialsAll * 100) : 0
  const convRateMonth = trialsMonth > 0 ? Math.round(convsMonth / trialsMonth * 100) : 0

  // Avg days to convert
  const convertedUserIds = new Set(convs.map(e => e.user_id))
  const daysList = convs.map(c => {
    const s = trials.find(t => t.user_id === c.user_id)
    if (!s) return null
    const diff = (new Date(c.occurred_at).getTime() - new Date(s.occurred_at).getTime()) / 86400000
    return diff >= 0 && diff <= 60 ? diff : null
  }).filter((d): d is number => d !== null)
  const avgDays = daysList.length ? Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length * 10) / 10 : null

  // WoW trends
  const trials7d   = trials.filter(e => e.occurred_at >= ago7).length
  const trialsPrev = trials.filter(e => e.occurred_at >= ago14 && e.occurred_at < ago7).length
  const convs7d    = convs.filter(e => e.occurred_at >= ago7).length
  const convsPrev  = convs.filter(e => e.occurred_at >= ago14 && e.occurred_at < ago7).length

  // Lost trials — never converted
  const lostTrials = (expiredTrials ?? []).filter(t => !convertedUserIds.has(t.user_id))

  // Enrich lost trials with email/name from auth
  const authUsers  = authResult?.users ?? []
  const emailMap   = Object.fromEntries(authUsers.map(u => [u.id, u.email ?? '']))
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const lostEnriched = lostTrials.map(t => ({
    user_id:    t.user_id,
    email:      emailMap[t.user_id] ?? '—',
    name:       (profileMap[t.user_id] as Record<string, string>)?.name ?? '',
    trial_end:  t.trial_end,
    plan:       t.plan,
    created_at: t.created_at,
  })).sort((a, b) => new Date(b.trial_end).getTime() - new Date(a.trial_end).getTime())

  // Referral leaderboard
  const referrerMap: Record<string, { name: string; code: string; count: number; revenue: number }> = {}
  for (const r of referrals) {
    const rid = (r.properties as Record<string, string>)?.referrer_user_id
    if (!rid) continue
    if (!referrerMap[rid]) {
      const p = profileMap[rid] as Record<string, string> | undefined
      referrerMap[rid] = { name: p?.name ?? '—', code: p?.referral_code ?? '—', count: 0, revenue: 0 }
    }
    referrerMap[rid].count++
    const plan = (r.properties as Record<string, string>)?.plan ?? 'annual'
    referrerMap[rid].revenue += plan === 'triennial' ? 74.99 : plan === 'monthly' ? 9.99 : 37.49
  }
  const referrers = Object.entries(referrerMap)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return {
    funnel: {
      trials_all: trialsAll, trials_month: trialsMonth, trials_last_month: trialsLast,
      conversions_all: convsAll, conversions_month: convsMonth, conversions_last_month: convsLast,
      conversion_rate: convRate, conversion_rate_month: convRateMonth,
      avg_days_to_convert: avgDays,
      lost_trials_count: lostTrials.length,
    },
    trends: {
      users_7d: users7d ?? 0, users_prev_7d: usersPrev ?? 0,
      trials_7d: trials7d, trials_prev_7d: trialsPrev,
      conversions_7d: convs7d, conversions_prev_7d: convsPrev,
    },
    lost_trials: lostEnriched,
    referrers,
    referral_total: referrals.length,
  }
}

async function getCronHealth(sb: ReturnType<typeof createClient>) {
  const { data, error } = await sb.rpc('admin_cron_health')
  if (error) return { error: error.message, jobs: [] }
  const now = new Date()
  return {
    jobs: (data ?? []).map((j: Record<string, unknown>) => {
      const lastRun  = j.last_run ? new Date(j.last_run as string) : null
      const hoursAgo = lastRun ? Math.round((now.getTime() - lastRun.getTime()) / 3600000 * 10) / 10 : null
      const isStale  = hoursAgo !== null && hoursAgo > 26 // should run daily; >26h is overdue
      return { ...j, hours_ago: hoursAgo, is_stale: isStale }
    })
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: H })
  if (req.method !== 'POST') return err(405, 'POST required')

  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  const adminToken = Deno.env.get('SCOUT_ADMIN_TOKEN')
  if (!adminToken || body.token !== adminToken) return err(401, 'Unauthorized')

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const action = (body.action as string) ?? 'stats'

  try {
    switch (action) {
      case 'stats':       return ok(await getStats(sb))
      case 'users':       return ok(await getUsers(sb, body))
      case 'gifts':       return ok(await getGifts(sb))
      case 'emails':      return ok(await getEmails(sb))
      case 'upcoming':    return ok(await getUpcoming(sb))
      case 'user-detail':  return ok(await getUserDetail(sb, body.email as string))
      case 'analytics':    return ok(await getAnalytics(sb))
      case 'cron-health':  return ok(await getCronHealth(sb))
      default:             return err(400, `Unknown action: ${action}`)
    }
  } catch (e) {
    console.error('[scout-admin] error in action', action, ':', e)
    return err(500, String(e))
  }
})
