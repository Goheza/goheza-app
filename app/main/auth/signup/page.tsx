import SignUpPageForUser from "@/components/_pages/signuptr";

import type { Metadata } from 'next'

export const metadata:Metadata = {
    title: 'Create Account',
    description:
        'Connect with thousands of content creators who promote your business, online and only pay for content that performs. Get started now',
}
export default function Page() {
    return (
        <SignUpPageForUser/>
    )
}