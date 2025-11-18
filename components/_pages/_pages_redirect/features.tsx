'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ClientRedirect2() {
    const router = useRouter()

    useEffect(() => {
        router.push('/#features')
    }, [router])

    return null
}
