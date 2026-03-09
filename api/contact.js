module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { first_name, email, subject, message } = req.body;

  // Basic validation
  if (!first_name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FamilyForce <support@getfamilyforce.com>',
        to: ['support@getfamilyforce.com'],
        reply_to: email,
        subject: `[Contact] ${subject} — from ${first_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
            <h2 style="color:#6E4ED6;margin-bottom:24px">New Contact Form Message</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;color:#666;width:100px"><strong>From</strong></td>
                <td style="padding:8px 0">${first_name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666"><strong>Email</strong></td>
                <td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666"><strong>Subject</strong></td>
                <td style="padding:8px 0">${subject}</td>
              </tr>
            </table>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
            <p style="color:#666;margin-bottom:8px"><strong>Message</strong></p>
            <p style="color:#333;line-height:1.7;white-space:pre-wrap">${message}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
            <p style="color:#999;font-size:12px">Sent from getfamilyforce.com/contact</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Resend error');
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
};
