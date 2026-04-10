'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import logo from '@/assets/GOHEZA-02.png'
import { checkUserSession } from '@/lib/supabase/auth/helpers'

export default function MainBootstrapWorkspace() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const initalizeWebApp = async () => {
            try {
                const { isSessionAvailable } = await checkUserSession()

                if (!isSessionAvailable) {
                    /**
                     * If no sessions is found,redirect to signup
                     */
                    router.replace('/app/auth/signup')
                } else {
                    /**
                     * Check for user account
                     */
                    setIsLoading(false)
                    router.push('/app/auth/user-check')
                }
            } catch (error) {
                console.error('Bootstrap error:', error)
                router.replace('/app/auth')
            }
        }

        initalizeWebApp()
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
                <span>Loading....</span>
            </div>
        )
    }
    return null
}

