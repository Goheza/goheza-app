// app/layout.tsx (server component)
import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import Header from '@/components/layout/header'
import './globals.css'
import Script from 'next/script'
import FooterComponent from '@/components/components/landing/footertc'


export const metadata: Metadata = {
    title: 'Goheza - Connecting Businesses To Content Creators Paid on Performance',
    description:
        'Get your businesses seen everywhere. Connect with thousands of content creators who promote your business, products, and services online and pay only for content that performs. Get Started Now',
    icons: {
        icon: '/icon.ico', // relative to /public
    },
    keywords: [
        'Goheza',
        'content creators',
        'influencer marketing',
        'business promotion',
        'performance marketing',
        'social media marketing',
        'brand visibility',
        'creator partnerships',
        'pay for performance',
        'Goheza platform',
    ],
    metadataBase: new URL('https://goheza.com'),
    alternates: {
        canonical: 'https://goheza.com',
    },
    openGraph: {
        title: 'Goheza - Connecting Businesses To Content Creators Paid on Performance',
        description:
            'Connect your business with thousands of verified content creators who promote your products and services online. Only pay for content that performs — boost visibility and growth with Goheza.',
        url: 'https://goheza.com',
        siteName: 'Goheza',
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Goheza platform connecting businesses and content creators',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Goheza - Connecting Businesses To Content Creators Paid on Performance',
        description:
            'Get your business seen everywhere. Partner with content creators and pay only for real performance. Start your growth journey with Goheza today.',
        images: ['/og-image.jpg'],
        creator: '@goheza',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
        },
    },
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
                <FooterComponent />
                <Toaster />
            </body>
        </html>
    )
}
