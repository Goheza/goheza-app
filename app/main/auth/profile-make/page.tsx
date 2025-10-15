'use client'

import { getUserProfileType } from '@/lib/supabase/auth/new/getProfiletype'
import { supabaseClient } from '@/lib/supabase/client'
import { makeProfile } from '@/lib/supabase/profiles/profile-maker'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import logo from '@/assets/GOHEZA-02.png'

export default function ProfileMaker() {
    /**
     * Used when creating profile or reading things;
     */
    const [loading, setLoading] = useState(true)
    const params = useSearchParams()
    /**
     * The current router.
     */
    const router = useRouter()
    useEffect(() => {
        /**
         * This is here to ensure a logged in or
         * present auth token routes the user back to the
         * signin user.
         */
        const InitialLoadStartup = async () => {
            /**
             *
             * Get current user from existing Session
             *
             */
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            /**
             * If the user is present we are going to
             * take them to the basePage, (they will be routed to their
             * dashboard, for them to log out
             * and then they can create an account)
             */

            if (user) {
                const { type, user } = await getUserProfileType()

                if (type) {
                    toast.success('Profile Already Present, going back to signIn')
                    router.push('/main')
                } else {
                    let osi = params.get('role')

                    if (user) {
                        if (osi) {
                            if (osi == 'brand') {
                                makeProfile(user, 'brand').then(() => {

                                    toast.success('Profile Created')
                                    router.push('/main/auth/brandcheck?verif=brand')
                                })

                                return
                            } else if (osi == 'creator') {
                                makeProfile(user, 'creator').then(() => {
                                    toast.success('Profile Created')

                                    router.push('/main')
                                })
                                return
                            }
                        }
                    }
                }
            }
        }

        InitialLoadStartup().finally(() => {
            setLoading(false)
        })
    }, [])

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
                <span>Creating Profile...</span>
            </div>
        )
    }
    return null
}
