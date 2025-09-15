import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/sonner"
import { Manrope } from "next/font/google"

import './globals.css'


export const sans = Manrope({
    preload : true,
    subsets : ["latin"],
})


export const metadata: Metadata = {
    title: 'Goheza',
    description: 'Connecting Brands and Creators',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className={`font-sans ${sans.className} `}>
                {children}
                <Toaster/>
            </body>
        </html>
    )
}
