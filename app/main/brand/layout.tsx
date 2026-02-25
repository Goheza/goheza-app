'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NotVerifiedPage from '@/components/components/brand/not-verified'
import HeaderItemMainBre from '@/components/components/common/header/header-bre'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

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
                    router.replace('/main/auth/signin')
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

    const onWillSignOutUser = async () => {
        await supabaseClient.auth.signOut({ scope: 'global' })
        router.replace('/main/auth/signin')
    }

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
                <Button
                    size="lg"
                    onClick={onWillSignOutUser}
                    className="absolute right-10 top-6 font-semibold bg-[#e85c51] hover:bg-[#df4848] transition-all hover:scale-105"
                >
                    <ArrowLeft className="mr-2" />
                    Sign out
                </Button>

                <NotVerifiedPage />
            </div>
        )
    }

    // ✅ Verified view
    return (
        <div>
            <HeaderItemMainBre />
            <div className="translate-y-14">{children}</div>
        </div>
    )
}
