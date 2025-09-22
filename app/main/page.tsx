/**
 * This is the inital Page from the start
 * Where the loading of the web application begins
 */

'use client'

import { baseLogger } from '@/lib/logger'
import { supabaseClient } from '@/lib/supabase/client'
import { getProfile, makeProfile } from '@/lib/supabase/profiles/profile-maker'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function InitalPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const params = useSearchParams()

    /**
     * If there is profile creation we do it.
     */
    const [isCreatingProfile, setCreatingProfile] = useState(Boolean)

    useEffect(() => {
        /**
         * Main Function decides the final route
         * @returns
         */

        const main = async () => {
            /**
             * Get the currently Logged in User
             */
            baseLogger('AUTHENTICATION', 'WillSearchForLoggedInUser')
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            /**
             * Send the user to the signin page if there is no other user
             */

            if (!user) {
                baseLogger('AUTHENTICATION', 'DidFailToFindLoggedInUser')
                baseLogger('AUTHENTICATION', 'WillNavigateToSignIn')

                router.replace('/main/auth/signin')
                return
            }
            baseLogger('AUTHENTICATION', 'didFindLoggedInUSer')

            /**
             * @todo
             *
             * When the user signs up without Google, we will be able to check for the role
             * within the metadata that was created, but if they signed up with google,
             *
             * The Redirect Link from google will have the params of the current available role,
             *  --we need to check if they don't have a profile in the beginning so we can create them one,
             *
             * still if the metadata of the normal signup(without provider) has a role, we need to check to make sure
             * they don't have a profile.
             *
             * then we send to the right page.
             */

            /**
             * @@@@@@@@@@With Provider(Google)
             */
            if (user.identities![0].provider == 'google') {
                baseLogger('AUTHENTICATION', 'DidSignUpWithGoogle')
                baseLogger('AUTHENTICATION', 'WillFindSearchParamsForRole')

                let currentRole = params.get('role')! as 'brand' | 'creator' | undefined

                baseLogger('AUTHENTICATION', 'WillStartCreatingProfileLoader')

                /**Signin case */
                setCreatingProfile(true)

                if (currentRole == undefined) {
                    baseLogger('AUTHENTICATION', 'DidFailToFindRole')
                    baseLogger('AUTHENTICATION', 'WillAssumeSignInCase')
                    baseLogger('AUTHENTICATION', 'WillCheckForExistingProfile')

                    //check for profile as a brand:
                    const checkForProfile = await getProfile(user, 'brand')
                    if (checkForProfile.profile) {
                        baseLogger('AUTHENTICATION', 'DidFindProfileAsBrand')
                        router.replace(`/main/brand/dashboard`)
                        return
                    }
                    const checkForProfile2 = await getProfile(user, 'creator')
                    if (checkForProfile2.profile) {
                        baseLogger('AUTHENTICATION', 'DidFindProfileAsCreator')
                        router.replace(`/main/creator/dashboard`)
                        return
                    }
                }

                baseLogger('AUTHENTICATION', 'WillChangeCaseToSignUP')
                baseLogger('AUTHENTICATION', `WillLookForProfileAsRoleOF:${currentRole}`)

                const checkForProfile = await getProfile(user, currentRole!)
                /**Sign up case; */

                if (checkForProfile.profile) {
                    //skip creation and proceed
                    baseLogger('AUTHENTICATION', 'DidFindProfile')
                    baseLogger('AUTHENTICATION', 'WillNavigateToDashboard')
                    router.replace(`/main/${currentRole}/dashboard`)
7o
                    return
                } else {
                    baseLogger('AUTHENTICATION', 'DidFailToFindProfile(SignUP)')
                    baseLogger('AUTHENTICATION', `WillMakeProfileForRole:${currentRole}`)

                    await makeProfile(user, currentRole!!)
                    baseLogger('AUTHENTICATION', 'DidMakeProfile')

                    setCreatingProfile(true)

                    baseLogger('AUTHENTICATION', 'DidSuccefullyMakeProfile')
                    baseLogger('AUTHENTICATION', 'WillNavigateToDashboar')

                    setCreatingProfile(false)
                    router.replace(`/main/${currentRole}/dashboard`)
                    return
                }
            } else {
                baseLogger('AUTHENTICATION', 'DidSignUpWithNormalUSer')
                baseLogger('AUTHENTICATION', 'WillCheckForRoleFromMetaData')

                /**
                 * @@@@@@@@@@@With No Provider
                 */
                let currentRole = user.user_metadata?.role
                let paymentMethod = user.user_metadata?.payment_method
                let country = user.user_metadata?.country
                let socialLinks = user.user_metadata?.sociallinks
                let phone = user.user_metadata?.phone
                let city = user.user_metadata?.city

                const checkForProfile = await getProfile(user, currentRole)

                baseLogger('AUTHENTICATION', `DidFindRoleAs:${currentRole}`)

                if (checkForProfile.profile) {
                    //skip creation and proceed
                    baseLogger('AUTHENTICATION', 'DIdFIndProfile')
                    baseLogger('AUTHENTICATION', 'willSkipProfileCreationAndNavigate')

                    router.replace(`/main/${currentRole}/dashboard`)
                    return
                } else {
                    baseLogger('AUTHENTICATION', 'DIdFailToFIndProfile')
                    baseLogger('AUTHENTICATION', 'WillMakeProfile')

                    await makeProfile(user, currentRole, {
                        city: city,
                        phone: phone,
                        country: country,
                        paymentMethod: paymentMethod,
                        socialLinks: socialLinks,
                    })
                    baseLogger('AUTHENTICATION', 'DidMakeProfile')
                    setCreatingProfile(true)

                    baseLogger('AUTHENTICATION', 'DIdSuccefullyMakeProfileWillContinueToNavigate')
                    setCreatingProfile(false)
                    router.replace(`/main/${currentRole}/dashboard`)
                }
            }
        }

        main().finally(() => setLoading(false))
    }, [router])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-6">
                {/* Logo */}
                <div className="text-2xl font-bold text-neutral-900">Goheza</div>

                {/* Spinner */}
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>

                <span className={`${isCreatingProfile ? 'flex' : 'hidden'}`}>Initalizing Profile....</span>
            </div>
        )
    }

    return null
}
