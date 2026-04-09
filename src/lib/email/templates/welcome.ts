export function welcomeEmail(name: string): { subject: string; html: string } {
  const subject = "Welcome to The Planning Consultant"
  const safeName = name?.trim() || "there"
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f6f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8e3;">
      <tr>
        <td style="background:#0B4D2C;padding:32px 32px 28px;">
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.6);">The Planning Consultant</p>
          <p style="margin:8px 0 0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.2;">Welcome, ${safeName} 👋</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">Your account is ready. You can now run instant AI planning constraint reports for any UK address — check conservation areas, permitted development rights, flood zones and more in under 60 seconds.</p>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#374151;">Start by entering a postcode on your dashboard.</p>
          <a href="https://theplanningconsultant.com/dashboard" style="display:inline-block;background:#126B3A;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">Go to dashboard →</a>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #e2e8e3;background:#f9faf9;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 The Planning Consultant · <a href="https://theplanningconsultant.com" style="color:#9ca3af;">theplanningconsultant.com</a></p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
  return { subject, html }
}
