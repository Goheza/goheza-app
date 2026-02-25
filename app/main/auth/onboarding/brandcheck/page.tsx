'use client'

import { sendEmail } from '@/lib/brand/send-brand-data'
import { supabaseClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import logo from '@/assets/GOHEZA-02.png'
import { useEffect, useState } from 'react'

export default function Page() {
    const params = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        /**
         * Inform the user it time to wait for the people
         * to verify for the data for the brand
         */
        const mainLoader = async () => {
            const getverif = params.get('verif')
            if (getverif && getverif == 'brand') {
                const {
                    data: { user },
                } = await supabaseClient.auth.getUser()

                if (user) {
                    //user-data
                    let currentName = user.identities![0]?.identity_data?.full_name || user.user_metadata?.fullName
                    let currentEmail = user!.email!
                    let currentPhone = user.user_metadata.phone || 'unknown Phone number'

                    sendEmail({
                        currentName,
                        email: currentEmail,
                        currentPhone: currentPhone,
                    }).then(() => {
                        router.push('/main/auth/feedback')
                    })
                }
            }
        }

        //run the function here
        mainLoader().finally(() => {
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
                <span>Checking...</span>
            </div>
        )
    }
    return null
}
