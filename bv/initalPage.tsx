'use client'
import { getUserProfileType } from '@/lib/supabase/auth/new/getProfiletype'
/**
 * This is where the authentication begins with everything;
 */
import { supabaseClient } from '@/lib/supabase/client'
import { makeProfile } from '@/lib/supabase/profiles/profile-maker'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import logo from '@/assets/GOHEZA-02.png'


export default function MainPage() {
    /**
     * Used when creating profile or reading things;
     */
    const [loading, setLoading] = useState(true)

    /**
     * Used for profile creation as well;
     */
    const params = useSearchParams()
    /**
     * Get the current router
     */
    const router = useRouter()

    useEffect(() => {
        /**
         * The Main Startup code area for the application
         */
        const MainStartup = async () => {
            /**
             *
             * Get current user from existing Session
             *
             */
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (user) {
                /**
                 * The User Session is Present so  check which profile
                 * the current profile type the user is so we take them
                 * to the required page.(We also so Profile Creation here.)
                 */

                const { type } = await getUserProfileType(user)

                /**
                 * The type of brand to be used
                 */
                if (type == 'brand') {
                    /**
                     * If its the brand we take them to the
                     */
                    router.replace('/main/brand/dashboard')
                } else {
                    /**
                     * If its the creator we take them to the
                     */
                    router.replace('/main/creator/dashboard')
                }

                /**
                 * The User is available but with no profile we
                 * create them one and then we route them
                 */

                if (type == null) {
                    /**
                     * get the current profile role;
                     */
                    const currentProfileRole = params.get('so')

                    if (currentProfileRole == 'creator') {
                        /**
                         * Make the Profile of the creator
                         */
                        await makeProfile(user, 'creator')
                        router.push('/main/creator/dashboard')
                    } else {
                        /**
                         * Make the profile of the brand
                         */
                        await makeProfile(user, 'brand')
                        router.push('/main/brand/dashboard')
                    }
                }
            } else {
                /**
                 * The User Session is Absent;
                 *
                 * So we take them to the signin page
                 */

                router.replace('/main/auth/signin')
            }
        }
        MainStartup().finally(() => {
            setLoading(false)
        })
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-6">
                <div className=" flex items-center justify-center">
                    <Image
                        src={logo.src}
                        width={100}
                        height={30}
                        alt="Goheza Logo"
                        className=" p-0 m-0 object-contain"
                    />
                </div>
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
                <span>Initializing....</span>
            </div>
        )
    }
    return null
}
