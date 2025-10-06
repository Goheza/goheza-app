import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
    try {
        const { to, name, email, role, subject, message } = await req.json()

        if (!to || !email || !subject || !message) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        const data = await resend.emails.send({
            from: 'Support <info@goheza.com>',
            to: [to],
            subject: `[${role}] ${subject}`,
            text: `From: ${name} (${email})\nRole: ${role}\n\nMessage:\n${message}`,
        })

        if (data.error) {
            return NextResponse.json({ success: false, error: data.error })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Support API Error:', error)
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
    }
}
