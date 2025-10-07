import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
    try {
        const { name, email, role, subject, message } = await req.json()

        // Validate required fields
        if (!email || !subject || !message) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        // All messages go to info@goheza.com
        const data = await resend.emails.send({
            from: 'Support <info@goheza.com>', // must match your verified sender domain in Resend
            to: ['info@goheza.com'],
            subject: `[${role || 'General'}] ${subject}`,
            text: `From: ${name || 'Anonymous'} (${email})
Role: ${role || 'N/A'}

Message:
${message}`,
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
