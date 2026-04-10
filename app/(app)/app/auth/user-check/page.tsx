'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import logo from '@/assets/GOHEZA-02.png'
import { supabaseClient } from '@/lib/supabase/client'
import { getProfileBasedOnUser } from '@/lib/supabase/auth/helpers'

const supabase = supabaseClient

export default function MainUserCheck() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const initializeUserCheck = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Authentication error. Please sign in again.')
                setIsLoading(false)
                router.push('/app/auth/signin')
                return
            }

            /**
             * Since we have now a valid user, we check which profile they belong to and send
             * them
             */

            const currentAvailableProfile = await getProfileBasedOnUser(user)

            switch (currentAvailableProfile.profileType) {
                case 'brand':
                    /**
                     * Ensure to make Administrative check
                     */
                    router.push('/app/accounts/brand')

                    break

                case 'creator':
                    /**
                     * Send them direct to there page
                     */
                    router.push('/app/accounts/creator/dashboard')
                    break

                case 'unknown':
                    toast.error('Authentication error. Please sign in again.')
                    setTimeout(() => {
                        router.push('/app/auth/signup')
                    }, 2000)
                    break
            }
        }

        initializeUserCheck()
    }, [router])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-6">
                <div className="flex items-center justify-center">
                    <Image
                        src={logo.src}
                        width={100}
                        height={30}
                        alt="Goheza Logo"
                        className="p-0 m-0 object-contain"
                    />
                </div>
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
                <span>Loading Auxillary Base....</span>
            </div>
        )
    }
    return null
}
