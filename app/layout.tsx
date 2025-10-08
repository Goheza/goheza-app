// app/layout.tsx (server component)
import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import Header from '@/components/layout/header'
import './globals.css'
import Script from 'next/script'
import FooterComponent from '@/components/components/landing/footertc'

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
                {/* Google Analytics Global Site Tag (gtag.js) */}
                <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-ECR813DSJP" />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ECR813DSJP');
          `}
                </Script>
                <Header /> {/* <-- client component */}
                {children}
                <FooterComponent/>
                <Toaster />
            </body>
        </html>
    )
}
