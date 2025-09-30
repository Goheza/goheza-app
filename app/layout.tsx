// app/layout.tsx (server component)
import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import Header from '@/components/layout/header'
import './globals.css'

export const metadata: Metadata = {
    title: 'Goheza',
    description: 'Connecting Brands and Creators',
}

const sans = Roboto({ subsets: ['latin'], preload: true })

export default function RootLayout({ children }: { children: React.ReactNode }) {


    return (
        <html lang="en">
            <body className={sans.className}>
                <Header /> {/* <-- client component */}
                {children}
                <Toaster />
            </body>
        </html>
    )
}
