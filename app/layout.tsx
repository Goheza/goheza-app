import type { Metadata } from 'next'
import local from 'next/font/local'

import './globals.css'
const Lexendfont = local({
    src: './fonts/lexend.ttf',
    style: 'normal',
    variable: '--font-primary',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'Goheza',
    description:
        'Connect with thousands of content creators who promote your business and only pay for performance. Get started now.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={Lexendfont.className}>
            <body>{children}</body>
        </html>
    )
}
