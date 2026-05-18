// app/api/test-email/route.ts

import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const sanitize = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production.' }, { status: 403 })
    }

    const testPayload = {
        name: 'John Brand',
        email: 'johnbrand@example.com',
        phone: '+256 700 000 000',
        provider: 'NormalAuthentication',
    }

    const { data, error } = await resend.emails.send({
        from: 'Goheza <brands@emails.goheza.com>',
        to: ['info@goheza.com'], // 👈 change to your own email while testing
        replyTo: testPayload.email,
        subject: '(GOHEZA) - Brand Signed Up [TEST]',
        html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fafafa;border-radius:12px;">
                <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
                    <p style="margin:0;font-size:13px;color:#856404;">⚠️ This is a test email — not a real signup.</p>
                </div>
                <h2 style="margin:0 0 24px;font-size:20px;color:#111;">New Brand Signup</h2>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                    <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:13px;width:110px;">Name</td>
                        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#111;">${sanitize(
                            testPayload.name
                        )}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:13px;">Email</td>
                        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#111;">
                            <a href="mailto:${sanitize(testPayload.email)}" style="color:#e85c51;">${sanitize(
            testPayload.email
        )}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:13px;">Phone</td>
                        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#111;">${sanitize(
                            testPayload.phone
                        )}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;font-size:13px;">Provider</td>
                        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;color:#111;">${sanitize(
                            testPayload.provider
                        )}</td>
                    </tr>
                </table>
                <div style="background:white;border:1px solid #eee;border-radius:8px;padding:20px;">
                    <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Details</p>
                    <p style="margin:0;font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap;">
Name:        ${sanitize(testPayload.name)}
Email:       ${sanitize(testPayload.email)}
Phone:       ${sanitize(testPayload.phone)}
Provider:    ${sanitize(testPayload.provider)}
Timestamp:   ${new Date().toISOString()}
                    </p>
                </div>
                <p style="margin:24px 0 0;font-size:12px;color:#bbb;">
                    Sent via Goheza brand signup · Reply directly to respond to ${sanitize(testPayload.name)}
                </p>
            </div>
        `,
    })

    if (error) {
        console.error('Resend error:', error)
        return NextResponse.json({ success: false, error }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        id: data?.id,
        sentTo: 'info@goheza.com',
        payload: testPayload,
    })
}
