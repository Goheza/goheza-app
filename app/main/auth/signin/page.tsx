import SigninPage from '@/bv/pages/_signin'
import type { Metadata } from 'next'

export const metadata:Metadata = {
    title: 'Login to Goheza',
    description:
        'Connect with thousands of content creators who promote your business, online and only pay for content that performs. Get started now',
}
export default function Page() {
    return <SigninPage />
}
