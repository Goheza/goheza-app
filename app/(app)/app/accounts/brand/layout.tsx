'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import NotVerifiedBanner from '@/components/workspace/pages/brand/notVerified/notVerifiedBanner'
import HeaderItemBrand from '@/components/workspace/common/header/headerBrand'

interface BrandProfile {
    user_id: string
    is_verified: boolean
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<BrandProfile | null>(null)

    // ✅ Always declare hooks before any return
    useEffect(() => {
        async function checkVerification() {
            try {
                setLoading(true)

                const {
                    data: { user },
                } = await supabaseClient.auth.getUser()

                if (!user) {
                    router.replace('/app/auth/signin')
                    return
                }

                const { data, error } = await supabaseClient
                    .from('brand_profiles')
                    .select('user_id, is_verified')
                    .eq('user_id', user.id)
                    .single()

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching brand profile:', error)
                }

                setProfile(data ?? null)
            } catch (err) {
                console.error('Unexpected error:', err)
            } finally {
                setLoading(false)
            }
        }

        checkVerification()
    }, [router])


    // ✅ Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <span className="mb-2">Loading Brand Profile...</span>
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const isVerified = profile?.is_verified === true

    // ✅ Not verified view
    if (!isVerified) {
        return (
            <div className="flex flex-col min-h-screen">
                <NotVerifiedBanner />
            </div>
        )
    }

    // ✅ Verified view
    return (
        <div>
            <HeaderItemBrand />
            <div className="translate-y-14">{children}</div>
        </div>
    )
}
