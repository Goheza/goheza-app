import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const sanitize = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function POST(req: Request) {
    try {
        const { name, email, subject, message, to } = await req.json()

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
        }

        const { data, error } = await resend.emails.send({
            from: 'Goheza <brands@emails.goheza.com>',
            to: [to ?? 'info@goheza.com'],
            replyTo: email,
            subject: subject ? `${subject}` : `New Brand Signup from ${name}`,
            html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fafafa;border-radius:12px;">
                    <h2 style="margin:0 0 24px;font-size:20px;color:#111;">New Brand Signup</h2>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                        <tr>
                            <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:13px;width:110px;">Name</td>
                            <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#111;">${sanitize(
                                name
                            )}</td>
                        </tr>
                        <tr>
                            <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:13px;">Email</td>
                            <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#111;">
                                <a href="mailto:${sanitize(email)}" style="color:#e85c51;">${sanitize(email)}</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:13px;">Phone</td>
                            <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#111;">${sanitize(
                                message
                            )}</td>
                        </tr>
                    </table>
                    <div style="background:white;border:1px solid #eee;border-radius:8px;padding:20px;">
                        <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Details</p>
                        <p style="margin:0;font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;">${sanitize(
                            message
                        )}</p>
                    </div>
                    <p style="margin:24px 0 0;font-size:12px;color:#bbb;">
                        Sent via Goheza brand signup · Reply directly to respond to ${sanitize(name)}
                    </p>
                </div>
            `,
        })

        if (error) {
            console.error('Resend error:', error)
            return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, id: data?.id })
    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
    }
}
