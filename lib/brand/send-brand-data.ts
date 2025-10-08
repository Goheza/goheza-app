/**
 * Sends brand signup information to the admin inbox (info@goheza.com)
 */

interface ISendBrandEmailData {
  to?: string // optional, defaults to info@goheza.com
  subject?: string
  message: string
}

export async function sendBrandEmailData({
  to = 'info@goheza.com',
  subject = '(GOHEZA) - Brand Signed Up',
  message,
}: ISendBrandEmailData) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        message: `
          New Brand Signup Notification

          ${message}
        `,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to send email')

    console.log('✅ Email sent successfully to:', to)
  } catch (error: any) {
    console.error('❌ Email sending failed:', error.message)
  }
}
