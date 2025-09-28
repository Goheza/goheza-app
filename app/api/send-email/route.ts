import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
    try {
        const { to, subject, message } = await req.json()

        if (!to || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const data = await resend.emails.send({
            from: 'Your Name <onboarding@resend.dev>', // or your verified domain
            to,
            subject,
            html: `<p>${message}</p>`,
        })

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Email error:', error)
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}
