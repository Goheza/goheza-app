import ClientRedirect from '@/components/_pages/_pages_redirect/howitworks'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'How it Works',
    description: 'Simple, transparent, and performance-driven. Connect, create, and earn with Goheza.',
}

export default function Page() {
    return <ClientRedirect />
}
