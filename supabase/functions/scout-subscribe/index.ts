// scout-subscribe — DEPRECATED AND DISABLED
// This endpoint has been replaced by scout-convert.
// Kept as a stub to return 410 Gone for any callers.
Deno.serve(() => new Response(
  JSON.stringify({ ok: false, error: 'This endpoint is deprecated. Use scout-convert.' }),
  { status: 410, headers: { 'Content-Type': 'application/json' } }
))
