'use client'

import { sendEmail } from '@/lib/appServiceData/send-brand-data'
import { supabaseClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import logo from '@/assets/GOHEZA-02.png'
import { useEffect, useState } from 'react'

export default function Page() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const mainLoader = async () => {
            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabaseClient.auth.getUser()

                if (authError) throw new Error(authError.message)

                if (!user) {
                    router.push('/app/auth/signin')
                    return
                }

                const currentName =
                    user.identities?.[0]?.identity_data?.full_name ?? user.user_metadata?.fullName ?? 'Unknown'
                const currentEmail = user.email ?? ''
                const currentPhone = user.user_metadata?.phone ?? 'Unknown Phone Number'

                await sendEmail({
                    currentName,
                    email: currentEmail,
                    currentPhone,
                })

                router.push('/app/auth/onboarding/profile/brand/feedback')
            } catch (err) {
                console.error('Brand verification failed:', err)
                setError(err instanceof Error ? err.message : 'Something went wrong.')
            }
        }

        mainLoader()
    }, [router])

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-4">
                <Image src={logo} width={100} height={30} alt="Goheza Logo" className="object-contain" />
                <p className="text-red-500 font-medium">{error}</p>
                <button
                    onClick={() => {
                        setError(null)
                        router.refresh()
                    }}
                    className="px-4 py-2 bg-[#e85c51] text-white rounded-lg hover:bg-[#d44b40] transition-colors"
                >
                    Try Again
                </button>
            </div>
        )
    }

    // Keep showing the loader until navigation completes
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-6">
            <div className="flex items-center justify-center">
                <Image src={logo} width={100} height={30} alt="Goheza Logo" className="object-contain" />
            </div>
            <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin" />
            <span>Verifying Brand...</span>
        </div>
    )
}
