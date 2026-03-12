module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, playbookTitle, playbookUrl, progress } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const displayName = name || 'Parent';
  const playbook = playbookTitle || 'your playbook';
  const url = playbookUrl || 'https://getfamilyforce.com/dashboard.html';
  const pct = progress || 0;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FamilyForce <support@getfamilyforce.com>',
        to: [email],
        bcc: ['support@getfamilyforce.com'],
        subject: `You're ${pct}% through ${playbook} — finish it today`,
        html: `
          <div style="font-family:'Outfit',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#FAFAFA">
            <div style="text-align:center;margin-bottom:32px">
              <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:24px">Family<span style="color:#6E4ED6">Force</span></div>
              <div style="font-size:48px;margin-bottom:16px">📖</div>
              <h1 style="font-size:24px;font-weight:800;color:#1D1D1F;margin:0 0 10px">You've got unfinished business, ${displayName}</h1>
              <p style="font-size:16px;color:#5C5960;line-height:1.6;margin:0">You're <strong>${pct}% through <em>${playbook}</em></strong>. The badge and certificate are waiting — it only takes a few more minutes.</p>
            </div>
            <div style="background:#fff;border-radius:16px;padding:28px;text-align:center;border:1px solid #E5E2EC;margin-bottom:24px">
              <div style="background:#F0EBFF;border-radius:100px;height:8px;margin-bottom:20px;overflow:hidden">
                <div style="background:#6E4ED6;height:8px;width:${pct}%;border-radius:100px"></div>
              </div>
              <a href="${url}" style="display:inline-block;background:#6E4ED6;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:100px;text-decoration:none">Continue reading →</a>
            </div>
            <p style="font-size:12px;color:#8A879A;text-align:center;line-height:1.6">
              You're receiving this because you enabled course reminders in FamilyForce.<br>
              <a href="https://getfamilyforce.com/dashboard.html" style="color:#6E4ED6">Manage notification preferences</a>
            </p>
          </div>
        `,
      }),
    });
    if (!response.ok) throw new Error('Resend error');
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('course-reminder notify error:', err);
    return res.status(500).json({ error: 'Failed to send' });
  }
};
