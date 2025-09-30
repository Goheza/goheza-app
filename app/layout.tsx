// app/layout.tsx (server component)
import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import Header from '@/components/layout/header'
import './globals.css'

export const metadata: Metadata = {
    title: 'Goheza',
    description: 'Connecting Brands and Creators',
}

const Lexendfont = Lexend({
    subsets: ['latin'],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={Lexendfont.className}>
                <Header /> {/* <-- client component */}
                {children}
                <Toaster />
            </body>
        </html>
    )
}
