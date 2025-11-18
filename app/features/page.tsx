import ClientRedirect2 from '@/components/_pages/_pages_redirect/features'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Features',
    description: 'Goheza has over 5000 creators and growing each day ready to deliver your brand story in their own style like dances, skits, explainers, reviews and more.',
}

export default function Page() {
    return <ClientRedirect2 />
}
