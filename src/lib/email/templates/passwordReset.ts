export function passwordResetEmail(
  resetLink: string,
): { subject: string; html: string } {
  const subject = "Reset your password — The Planning Consultant";

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f9f7;font-family:Arial,sans-serif;color:#0A0F0C;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f9f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #E2E8E3;border-radius:10px;">
            <tr>
              <td style="padding:28px 24px 12px 24px;">
                <p style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:#126B3A;">
                  The Planning Consultant
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 12px 24px;">
                <p style="margin:0;font-size:16px;line-height:1.7;color:#4A5C50;">
                  We received a request to reset your password.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 20px 24px;">
                <a
                  href="${resetLink}"
                  style="display:inline-block;background:#126B3A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;line-height:1;padding:12px 18px;border-radius:8px;"
                >
                  Reset your password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 12px 24px;">
                <p style="margin:0;font-size:14px;line-height:1.7;color:#4A5C50;">
                  This link expires in 1 hour.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 28px 24px;">
                <p style="margin:0;font-size:14px;line-height:1.7;color:#4A5C50;">
                  If you did not request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;border-top:1px solid #E2E8E3;">
                <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#8FA896;">
                  theplanningconsultant.com
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  return { subject, html };
}
