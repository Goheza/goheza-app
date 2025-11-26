import type { Metadata } from 'next'
import local from 'next/font/local'
import { Toaster } from '@/components/ui/sonner'
import Header from '@/components/layout/header'
import Script from 'next/script'
import FooterComponent from '@/components/components/landing/footertc'
import './globals.css'

const Lexendfont = local({
    src: './fonts/lexend.ttf',
    style: 'normal',
    variable: '--font-primary',
    display: 'swap',
})

export const metadata: Metadata = {
    metadataBase: new URL('https://goheza.com'),
    title: {
        default: 'Goheza',
        template: '%s | Goheza',
    },
    icons: {
        icon: 'https://goheza.com/favicon.jpg',
    },
    description:
        'Connect with thousands of content creators who promote your business and only pay for performance. Get started now.',
    keywords: [
        'goheza',
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
    authors: [{ name: 'Goheza' }],
    creator: 'Goheza',
    publisher: 'Goheza',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://goheza.com',
        title: 'Goheza - Connecting Businesses To Content Creators Paid on Performance',
        description:
            'Connect with thousands of content creators who promote your business and only pay for performance.',
        images: [
            {
                url: 'https://goheza.com/gz.jpg',
                width: 1200,
                height: 630,
                alt: 'Goheza',
            },
        ],
        siteName: 'Goheza',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Goheza - Connecting Businesses To Content Creators Paid on Performance',
        description: 'Connect with top creators who promote your business and only pay when content performs.',
        images: ['https://goheza.com/gz.jpg'],
    },
    alternates: {
        canonical: 'https://goheza.com',
    },
    other: {
        'theme-color': '#e85c51',
        'msapplication-TileColor': '#e85c51',
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={Lexendfont.variable}>
            <body>
                {/* Schema.org JSON-LD (Google prefers it in body) */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'WebSite',
                            '@id': 'https://goheza.com/#website',
                            url: 'https://goheza.com',
                            name: 'Goheza',
                            description:
                                'Connect with thousands of content creators who promote your business and only pay for performance.',
                            publisher: {
                                '@id': 'https://goheza.com/#organization',
                            },
                            inLanguage: 'en-US',
                        }),
                    }}
                />

                {/* Google Analytics */}
                <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-ECR813DSJP" />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', 'G-ECR813DSJP');
                    `}
                </Script>

                <Header />

                {children}

                <FooterComponent />
                <Toaster />
            </body>
        </html>
    )
}
