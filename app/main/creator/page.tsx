'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 *
 * @returns Used to redirect the creator to the dashboard screen
 */

export default function CreatorRedirect() {
    const router = useRouter()

    useEffect(() => {
        const onLoad = () => {
            router.push('/main')
        }

        onLoad()
    }, [])

    return <div className="h-screen w-full flex items-center justify-center">...Redirecting Please Wait.</div>
}
