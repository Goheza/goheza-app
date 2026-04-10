'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { toast } from 'sonner'
import { supabaseClient } from '@/lib/supabase/client'
import Image from 'next/image'
import logo from '@/assets/GOHEZA-02.png'
import { ALL_COUNTRIES } from '@/lib/appServiceData/countries'
import { isOnboardingComplete } from '@/lib/supabase/auth/authHelpers'
const supabase = supabaseClient
type OnboardingData = {
    phone: string
    country: string
}
/**
 * This is for the creators
 * @returns
 */
export default function GoogleAuthFinishedPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [initialChecking, setInitialChecking] = useState(true)
    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        phone: '',
        country: 'Uganda',
    })
    useEffect(() => {
        /**
         * Use this to check whether they are signing up. or signing in
         */
        const initalGoogleCheck = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Authentication error. Please sign in again.')
                setInitialChecking(false)
                return
            }
            const complete = await isOnboardingComplete(user.id)
            if (complete) {
                router.push('/app/accounts/creator/dashboard')
            } else {
                setInitialChecking(false)
            }
        }
        initalGoogleCheck()
    }, [])
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setOnboardingData((prev) => ({ ...prev, [name]: value }))
    }
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            toast.error('Authentication error. Please sign in again.')
            setLoading(false)
            return
        }
        // user_metadata works for both Google OAuth and email/password sign-ups
        const { name, email } = user.user_metadata ?? {}
        const { error } = await supabase.from('creator_profiles').upsert(
            {
                user_id: user.id,
                full_name: name ?? null,
                email: email ?? user.email,
                phone: onboardingData.phone,
                country: onboardingData.country,
            },
            { onConflict: 'user_id' }
        )
        setLoading(false)
        if (error) {
            console.error('Onboarding update error:', error)
            toast.error('Failed to save profile. Please try again.', {
                style: { fontSize: 14 },
            })
        } else {
            toast.success('Profile created successfully! Welcome to Goheza.', {
                style: { fontSize: 14 },
            })
            const complete = await isOnboardingComplete(user.id)
            if (complete) {
                router.push('/app/accounts/creator/dashboard')
            }
        }
    }
    const isFormValid = !!onboardingData.phone && !!onboardingData.country

    if (initialChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center justify-center gap-4">
                <Image src={logo.src} width={100} height={30} alt="Goheza Logo" className="object-contain" />
                <div className="w-8 h-8 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Just a moment...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center py-8">
            <div className="w-full max-w-md p-8 bg-white rounded-3xl">
                {/* Logo */}
                <div className="flex items-center justify-center mb-8">
                    <Image src={logo.src} width={100} height={30} alt="Goheza Logo" className="object-contain" />
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center mb-4">
                        <Users className="w-12 h-12 text-[#e85c51]" />
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">Welcome, Creator!</h1>
                    <p className="text-gray-600 text-center mb-6">
                        Just a few more details to set up your profile and get you started on Goheza.
                    </p>
                    <div className="space-y-4">
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Phone Number"
                            value={onboardingData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                        />
                        <select
                            name="country"
                            value={onboardingData.country}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51] focus:border-transparent transition-all duration-200"
                        >
                            <option value="" disabled>
                                Select a Country
                            </option>
                            {ALL_COUNTRIES.map((countryName) => (
                                <option key={countryName} value={countryName}>
                                    {countryName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={!isFormValid || loading}
                        className={`w-full py-3 px-4 mt-6 rounded-2xl text-sm font-medium transition-all duration-200 ${
                            isFormValid && !loading
                                ? 'bg-[#e85c51] hover:bg-[#f3867e] text-white'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {loading ? 'Saving...' : 'Next Step'}
                    </button>
                </form>
            </div>
        </div>
    )
}