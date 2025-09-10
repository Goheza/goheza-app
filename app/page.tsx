'use client'

import { supabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function InitialLoader() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (!user) {
                router.replace('/auth/signin')
                return
            }

            const role = user.user_metadata?.role

            if (role === 'brand') {
                router.replace('/brand/dashboard')
            } else if (role === 'creator') {
                router.replace('/creator/dashboard')
            } else {
                router.replace('/auth/signin')
            }
        }

        init().finally(() => setLoading(false))
    }, [router])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-6">
                {/* Logo */}
                <div className='text-2xl font-bold text-neutral-900'>Goheza</div>

                {/* Spinner */}
                <div className="w-12 h-12 border-4 border-[#E66262] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return null
}
