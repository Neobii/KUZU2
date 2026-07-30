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
    console.info('[email] RESEND_API_KEY not set — logging email instead of sending')
    console.info(`To: ${to}`)
    console.info(`Subject: ${subject}`)
    console.info(text)
    return
  }

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
    throw new Error(`Failed to send email (${res.status}): ${body}`)
  }
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
