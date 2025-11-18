'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ClientRedirect() {
    const router = useRouter()

    useEffect(() => {
        router.push('/#how-it-works')
    }, [router])

    return null
}
