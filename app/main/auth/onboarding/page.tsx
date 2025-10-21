'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { supabaseClient } from '@/lib/supabase/client'
import Image from 'next/image'
import logo from '@/assets/GOHEZA-02.png'
import { getUserProfileType } from '@/lib/supabase/auth/new/getProfiletype'
import { ALL_COUNTRIES } from '@/lib/countries'

const supabase = supabaseClient

// Type for Creator-specific fields in our React state
type CreatorData = {
    phone: string
    country: string
    paymentMethod: string
}

// Type for Brand-specific fields in our React state
type BrandData = {
    phone: string
    brandName: string
}

// Combined type for the onboarding state
type OnboardingData = Partial<CreatorData & BrandData>

export default function OnboardingDialog() {
    const router = useRouter()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        phone: '',
        country: 'Uganda',
        paymentMethod: 'unknown',
        brandName: '',
    })

    // On component mount, check if the user is signed in and if their profile is already complete.
    useEffect(() => {
        /**
         * Checking the user profile for the user
         * @returns
         */
        const checkUserProfile = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                // No user found, redirect to sign-in page
                router.push('/main/auth/signup')
                return
            }

            /**
             * Check for existing profile
             */
            const { type } = await getUserProfileType()

            if (type) {
                if (type == 'creator') {
                    console.log('Profile Exists', user.email!)
                    /**
                     * The profile exists
                     */
                    router.push('/main/')
                    return
                }
            }else{
                return;
            }
        }
        checkUserProfile()
    }, [router])

    // Handler for all form field changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setOnboardingData((prev) => ({ ...prev, [name]: value }))
    }

    /**
     * Handle the Final Submission for the creator
     * @param e
     * @returns
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        /**
         * Check again for existing user
         */

        const {
            data: { user },
        } = await supabase.auth.getUser()

        /**
         * User is not present
         */
        if (!user) {
            toast.error('Authentication error. Please sign in again.')
            setLoading(false)
            return
        }

        let error = null

        /**
         *
         * Re-update the creator-profile of the user
         *
         */
        const { error: creatorError } = await supabase.from('creator_profiles').upsert(
            {
                full_name: user.identities![0].identity_data!.name,
                email: user.identities![0].identity_data!.email,
                user_id: user.id, // ✅ correct column
                phone: !!onboardingData.phone,
                country: onboardingData.country,
            },
            { onConflict: 'user_id' } // ✅ conflict should be on user_id, not id
        )
        error = creatorError

        setLoading(false)

        if (error) {
            console.error('Onboarding update error:', error)
            toast.error('Failed to save profile. Please try again.', { style: { fontSize: 14 } })
        } else {
            toast.success('Profile created successfully! Welcome to Goheza.', { style: { fontSize: 14 } })
            /**
             * We take him direct to where he belongs
             */
            router.push('/main/creator/dashboard') // Redirect to the user's dashboard
        }
    }

    // Renders the different steps of the form based on the user's role
    const renderContent = () => {
        // Step 1: Initial fields for both roles
        if (step === 1) {
            return (
                <div>
                    <div className="flex justify-center mb-4">
                        <Users className="w-12 h-12 text-[#e85c51]" />
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">{`Welcome, ${'Creator'}!`}</h1>
                    <p className="text-gray-600 text-center mb-6">
                        Just a few more details to set up your profile and get you started on Goheza.
                    </p>

                    {/* Conditional fields for Creator vs. Brand */}
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
                            className="px-4 py-3 text-sm w-full border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51] focus:border-transparent placeholder-gray-400 transition-all duration-200"
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
                        onClick={() => setStep(2)}
                        disabled={!onboardingData.phone || !onboardingData.country}
                        className={`w-full py-3 px-4 mt-6 rounded-2xl text-sm font-medium transition-all duration-200 ${
                            onboardingData.phone && onboardingData.country
                                ? 'bg-[#e85c51] hover:bg-[#f3867e] text-white '
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Next Step
                    </button>
                </div>
            )
        }

        // Step 2: Creator-specific final fields
        if (step === 2) {
            return (
                <div>
                    <button
                        onClick={handleSubmit}
                        disabled={!onboardingData.paymentMethod || loading}
                        className={`w-full py-3 px-4 mt-6 rounded-2xl text-sm font-medium transition-all duration-200 ${
                            onboardingData.paymentMethod
                                ? 'bg-[#e85c51] hover:bg-[#f3867e] text-white '
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {loading ? 'Saving...' : 'Finish Setup'}
                    </button>
                </div>
            )
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center py-8">
            <div className="w-full max-w-md p-8 bg-white rounded-3xl ">
                <div className="text-center mb-8">
                    <span className="text-3xl font-bold text-neutral-800">
                        <div className=" flex items-center justify-center">
                            <Image
                                src={logo.src}
                                width={100}
                                height={30}
                                alt="Goheza Logo"
                                className=" p-0 m-0 object-contain"
                            />
                        </div>
                    </span>
                </div>
                {/* The main form container */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {renderContent()}
                </form>
            </div>
        </div>
    )
}
