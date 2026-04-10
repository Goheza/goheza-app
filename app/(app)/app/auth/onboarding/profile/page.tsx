"use client"

import { makeProfile } from '@/lib/supabase/auth/helpers'
import { supabaseClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import logo from '@/assets/GOHEZA-02.png'
import { toast } from 'sonner'


export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const params = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const profileRoleChecker = async () => {
            try {
                setLoading(true)
                const role = params.get('role') // can be null
                const {
                    data: { user: User },
                } = await supabaseClient.auth.getUser()

                if (User == null) {
                    return
                }

                if(role == null){
                    toast.error('Unknown Error Contact Support')
                    return;
                }

                if (role == 'brand') {
                    //make the profile for the brand
                    await makeProfile(User!, 'brand')
                    //take the brand user for verifying
                    router.push('/app/auth/onboarding/brand/verification')
                    return
                }

                if (role == 'creator') {
                    /**Since the creator has signup and doesn't need onboarding entry */
                    //make the profile of the creator
                    await makeProfile(User!, 'creator')
                    //send the creator to the mainDashboard
                    router.push('/app/accounts/creator/dashboard')
                }
            } catch (error) {}
        }

        profileRoleChecker()
    }, [router])

    if (loading) {
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
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin" />
                <span>Creating Profile and Finalizing...</span>
            </div>
        )
    }

    return null
}
