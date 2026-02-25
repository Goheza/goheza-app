'use client'

import { getUserProfileType } from '@/lib/supabase/auth/new/getProfiletype'
import { makeProfile } from '@/lib/supabase/profiles/profile-maker'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import logo from '@/assets/GOHEZA-02.png'

export default function ProfileMaker() {
    const [loading, setLoading] = useState(true)
    const params = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const checkOrMakeProfile = async () => {
            try {
                setLoading(true)

                const { type, user } = await getUserProfileType()
                const roleParam = params.get('role') // can be null

                if (!user) {
                    toast.error('No user found. Please sign in.')
                    router.replace('/main/auth/signin')
                    return
                }

                if (!roleParam || (roleParam !== 'brand' && roleParam !== 'creator')) {
                    toast.error('Invalid role provided')
                    router.replace('/main/auth/signin')
                    return
                }

                // Create profile based on role
                await makeProfile(user, roleParam as 'brand' | 'creator')
                toast.success('Profile Created Successfully')

                // Redirect based on role
                if (roleParam === 'brand') {
                    router.push('/main/auth/onboarding/brandcheck?verif=brand')
                } else {
                    router.push('/main/auth/onboarding?type=user')
                }
            } catch (err) {
                console.error('Error creating profile:', err)
                toast.error('Failed to create profile. Try again.')
            } finally {
                setLoading(false)
            }
        }

        checkOrMakeProfile()
    }, [params, router])

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
                <span>Creating Profile...</span>
            </div>
        )
    }

    return null
}
