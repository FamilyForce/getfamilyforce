module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, childName, phase, milestoneCount, dashboardUrl } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const displayName = name || 'Parent';
  const child = childName || 'your child';
  const phaseName = phase || 'a new development phase';
  const count = milestoneCount || 'new';
  const url = dashboardUrl || 'https://getfamilyforce.com/dashboard.html';

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
        subject: `🌱 New milestones unlocked for ${child}`,
        html: `
          <div style="font-family:'Outfit',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#FAFAFA">
            <div style="text-align:center;margin-bottom:32px">
              <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:24px">Family<span style="color:#6E4ED6">Force</span></div>
              <div style="font-size:48px;margin-bottom:16px">🌱</div>
              <h1 style="font-size:24px;font-weight:800;color:#1D1D1F;margin:0 0 10px">${child} just entered a new phase, ${displayName}</h1>
              <p style="font-size:16px;color:#5C5960;line-height:1.6;margin:0"><strong>${count} new milestones</strong> have unlocked for the <strong>${phaseName}</strong> stage. Your Advisor has been updated.</p>
            </div>
            <div style="background:#fff;border-radius:14px;padding:24px;text-align:center;border:1px solid #E5E2EC;margin-bottom:24px">
              <p style="font-size:13.5px;color:#5C5960;margin:0 0 16px;line-height:1.5">Open your Advisor to see what's coming up and mark milestones as you hit them.</p>
              <a href="${url}" style="display:inline-block;background:#6E4ED6;color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:100px;text-decoration:none">Open Advisor →</a>
            </div>
            <hr style="border:none;border-top:1px solid #E5E2EC;margin:4px 0 20px">
            <p style="font-size:11.5px;color:#8A879A;text-align:center;line-height:1.7">
              You're receiving this because you enabled milestone notifications in FamilyForce.<br>
              <a href="https://getfamilyforce.com/dashboard.html" style="color:#6E4ED6;text-decoration:none">Manage notification preferences</a>
            </p>
          </div>
        `,
      }),
    });
    if (!response.ok) throw new Error('Resend error');
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('milestone-unlocked notify error:', err);
    return res.status(500).json({ error: 'Failed to send' });
  }
};
