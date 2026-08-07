type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim() ?? 'KUZU <onboarding@resend.dev>'

  if (!apiKey) {
    logEmailInsteadOfSending(to, subject, text, 'RESEND_API_KEY not set')
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[email] Resend failed (${res.status}): ${body}`)
      logEmailInsteadOfSending(to, subject, text, 'Resend request failed — logged instead')
    }
  } catch (e) {
    console.error('[email] Resend request error:', e)
    logEmailInsteadOfSending(to, subject, text, 'Resend request error — logged instead')
  }
}

function logEmailInsteadOfSending(
  to: string,
  subject: string,
  text: string,
  reason: string
): void {
  console.info(`[email] ${reason}`)
  console.info(`To: ${to}`)
  console.info(`Subject: ${subject}`)
  console.info(text)
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = 'Reset your KUZU password'
  const text = [
    'You requested a password reset for your KUZU account.',
    '',
    'Reset your password using this link (expires in 1 hour):',
    resetUrl,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n')

  const html = `
    <p>You requested a password reset for your KUZU account.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim()

  await sendEmail({ to, subject, html, text })
}
