'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 *
 * @returns Used to redirect the brand to the dashboard screen
 */

export default function brandRedirect() {
    const router = useRouter()

    useEffect(() => {
        const onLoad = () => {
            router.push('/brand/dashboard')
        }

        onLoad()
    }, [])

    return <div className="h-screen w-full flex items-center justify-center">...Redirecting Please Wait.</div>
}
