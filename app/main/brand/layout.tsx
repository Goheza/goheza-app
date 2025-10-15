'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NotVerifiedPage from '@/components/components/brand/not-verified' // Create this component next
import HeaderItemMainBre from '@/components/components/common/header/header-bre'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

// Define the interface for your brand profile to use in the state
interface BrandProfile {
    user_id: string
    is_verified: boolean
}

export default function RootLayout(props: { children: React.ReactNode }) {
    const router = useRouter()

    // State to manage loading, verification status, and profile data
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<BrandProfile | null>(null)

    useEffect(() => {
        async function checkVerification() {
            setLoading(true)

            // 1. Get the current user session
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (!user) {
                // If no user, redirect them to login (or your brand onboarding path)
                router.push('/main')
                return
            }

            // 2. Fetch the brand profile for the current user
            const { data: profileData, error } = await supabaseClient
                .from('brand_profiles')
                .select(`user_id, is_verified`)
                .eq('user_id', user.id)
                .single() // Expecting one profile per user

            if (error && error.code !== 'PGRST116') {
                // PGRST116 is "No rows found"
                // Handle other errors (e.g., network, database error)
                console.error('Error fetching brand profile:', error)
            }

            setProfile(profileData)
            setLoading(false)
        }

        checkVerification()
    }, [router, supabaseClient])

     const onWillSignOutUser = async () => {
        await supabaseClient.auth.signOut({scope : "global"})
        router.push('/main/auth/signin')
    }

    // --- GUARD LOGIC ---

    // 3. Show Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <span className="mb-2">Loading Brand Profile...</span>
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) // Replace with your actual loading component
    }

    // 4. Check Verification Status
    const isVerified = profile?.is_verified === true

    if (!isVerified) {
        // If not verified, show the special "wait" page.
        return (
            <div className="flex flex-col h-screen">
                <div className='w-full'>
                   <Button
                            size="lg"
                            onClick={onWillSignOutUser}
                            className="font-semibold cursor-pointer absolute right-10 top-6  bg-[#e85c51] hover:bg-[#df4848] transform-gpu transition-all hover:scale-105"
                        >
                            <ArrowLeft/>
                           Sign out
                        </Button>
                </div>
                <NotVerifiedPage />
            </div>
        )
    }

    // 5. Render the content for verified brands
    return (
        <div>
            <HeaderItemMainBre />
            <div className="translate-y-14 ">{props.children}</div>
        </div>
    )
}
