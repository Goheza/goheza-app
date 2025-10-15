'use client'

import { sendBrandEmailData } from '@/lib/brand/send-brand-data'
import { supabaseClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import logo from '@/assets/GOHEZA-02.png'
import { useEffect, useState } from 'react'

export default function Page() {
    const params = useSearchParams()
    const router = useRouter()
    /**
     * Used when creating profile or reading things;
     */
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const mainLoader = async () => {
            const getverif = params.get('verif')

            if (getverif && getverif=='brand') {
                const {
                    data: { user },
                } = await supabaseClient.auth.getUser()

                if (user) {
                    let currentName = user.identities![0]?.identity_data?.full_name || user.user_metadata?.fullName
                    let currentEmail = user!.email!
                    let currentPhone = user.user_metadata.phone || 'unknown Phone number'
                    const __email__ = sendBrandEmailData({
                        email: currentEmail,
                        name: currentName,
                        message: ` 
                    name : ${currentName}\n
                     phoneNumber: ${currentPhone}\n
                    email : ${currentEmail}\n
                    provider : (NormalAuthentication)
                    `,
                    })
                    /**
                     * We send them to the feedback page after here...
                     */
                    __email__.then(() => {
                        router.push('/main/auth/feedback')
                    })
                }
            }
        }
        mainLoader().finally(() => {
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
                <span>Checking...</span>
            </div>
        )
    }
    return null
}
