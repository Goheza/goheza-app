'use client'

import { baseLogger } from '@/lib/logger'
import { supabaseClient } from '@/lib/supabase/client'
import { getProfile, makeProfile } from '@/lib/supabase/profiles/profile-maker'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner' // Added for user feedback

export default function InitalPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const params = useSearchParams()

    // Used to show a loading state for profile creation
    const [isCreatingProfile, setCreatingProfile] = useState(false) 

    useEffect(() => {
        const main = async () => {
            baseLogger('AUTHENTICATION', 'WillSearchForLoggedInUser')
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (!user) {
                baseLogger('AUTHENTICATION', 'DidFailToFindLoggedInUser')
                baseLogger('AUTHENTICATION', 'WillNavigateToSignIn')
                router.replace('/main/auth/signin')
                return
            }
            baseLogger('AUTHENTICATION', 'didFindLoggedInUSer')

            // Check if the user signed up with a provider (e.g., Google)
            if (user.identities && user.identities[0].provider === 'google') {
                baseLogger('AUTHENTICATION', 'DidSignUpWithGoogle')
                const currentRole = params.get('role') as 'brand' | 'creator' | undefined

                if (!currentRole) {
                    baseLogger('AUTHENTICATION', 'DidFailToFindRole')
                    baseLogger('AUTHENTICATION', 'WillAssumeSignInCase and check for existing profiles')

                    const brandProfileCheck = await getProfile(user, 'brand')
                    if (brandProfileCheck.profile) {
                        baseLogger('AUTHENTICATION', 'DidFindProfileAsBrand')
                        router.replace('/main/brand/dashboard')
                        return
                    }
                    const creatorProfileCheck = await getProfile(user, 'creator')
                    if (creatorProfileCheck.profile) {
                        baseLogger('AUTHENTICATION', 'DidFindProfileAsCreator')
                        router.replace('/main/creator/dashboard')
                        return
                    }
                    
                    // A Google user with no profile and no role param needs to select a role.
                    toast.info("Please select your role to continue.", { style: { fontSize: 14 } });
                    router.replace('/main/auth/signin');
                    return;
                }

                // A Google user with a role param (from a new sign-up)
                baseLogger('AUTHENTICATION', `WillLookForProfile as role of: ${currentRole}`)

                const profileCheck = await getProfile(user, currentRole)

                if (profileCheck.profile) {
                    baseLogger('AUTHENTICATION', 'DidFindProfile')
                    baseLogger('AUTHENTICATION', 'WillNavigateToDashboard')
                    router.replace(`/main/${currentRole}/dashboard`)
                    return
                } else {
                    baseLogger('AUTHENTICATION', 'DidFailToFindProfile (Sign-Up)')
                    baseLogger('AUTHENTICATION', `WillRedirect to onboarding for role: ${currentRole}`)
                    
                    // This is the key integration point!
                    router.replace(`/main/auth/onboarding?role=${currentRole}`)
                    return
                }

            } else {
                // Logic for normal (email/password) sign-up
                baseLogger('AUTHENTICATION', 'DidSignUpWithNormalUser')
                let currentRole = user.user_metadata?.role as 'brand' | 'creator' | undefined

                if (!currentRole) {
                     // Handle case where user_metadata is missing role (shouldn't happen with your sign-up form but good practice)
                    baseLogger('AUTHENTICATION', 'No role in metadata. Redirecting to signin.');
                    router.replace('/main/auth/signin');
                    return;
                }

                const profileCheck = await getProfile(user, currentRole)

                if (profileCheck.profile) {
                    baseLogger('AUTHENTICATION', 'DidFindProfile')
                    router.replace(`/main/${currentRole}/dashboard`)
                    return
                } else {
                    baseLogger('AUTHENTICATION', 'DidFailToFindProfile')
                    setCreatingProfile(true)

                    await makeProfile(user, currentRole, {
                        phone: user.user_metadata?.phone,
                        country: user.user_metadata?.country,
                        paymentMethod: user.user_metadata?.payment_method,
                        socialLinks: user.user_metadata?.sociallinks,
                        // Brand-specific fields would need to be added here if applicable
                        // brandName: user.user_metadata?.brandName,
                        // industry: user.user_metadata?.industry,
                        // website: user.user_metadata?.website,
                    })

                    setCreatingProfile(false)
                    baseLogger('AUTHENTICATION', 'DidSuccessfullyMakeProfile')
                    router.replace(`/main/${currentRole}/dashboard`)
                    return
                }
            }
        }

        main().finally(() => setLoading(false))
    }, [router, params])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-6">
                <div className="text-2xl font-bold text-neutral-900">Goheza</div>
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
                <span className={`${isCreatingProfile ? 'flex' : 'hidden'}`}>Initializing Profile....</span>
            </div>
        )
    }

    return null
}