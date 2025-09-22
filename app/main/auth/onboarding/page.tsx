'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { supabaseClient } from '@/lib/supabase/client'
import Image from 'next/image'
import logo from '@/assets/GOHEZA-02.png'

const supabase = supabaseClient

// Type for Creator-specific fields in our React state
type CreatorData = {
    phone: string
    country: string
    paymentMethod: string
    socialLinks: string
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
    const searchParams = useSearchParams()
    const role = searchParams.get('role') as 'creator' | 'brand' | null
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        phone: '',
        country: '',
        paymentMethod: '',
        socialLinks: '',
        brandName: '',
    })

    // On component mount, check if the user is signed in and if their profile is already complete.
    useEffect(() => {
        const checkUserProfile = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                // No user found, redirect to sign-in page
                router.push('/main/auth/signin')
                return
            }

            // Check for an existing profile in either table
            const { data: creatorProfile } = await supabase
                .from('creator_profiles')
                .select('id')
                .eq('id', user.id)
                .single()

            const { data: brandProfile } = await supabase.from('brand_profiles').select('id').eq('id', user.id).single()

            if (creatorProfile || brandProfile) {
                // Profile found, redirect to dashboard and show a message
                toast.info('Your profile is already set up!', { style: { fontSize: 14 } })
                router.push('/main/dashboard')
            }
        }
        checkUserProfile()
    }, [router])

    // Handler for all form field changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setOnboardingData((prev) => ({ ...prev, [name]: value }))
    }

    // Handles the final form submission to Supabase
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

        let error = null
        if (role === 'creator') {
            const { error: creatorError } = await supabase.from('creator_profiles').upsert(
                {
                    id: user.id,
                    phone: onboardingData.phone,
                    country: onboardingData.country,
                    payment_method: onboardingData.paymentMethod,
                    social_links: onboardingData.socialLinks,
                },
                { onConflict: 'id' }
            )
            error = creatorError
        } else if (role === 'brand') {
            const { error: brandError } = await supabase.from('brand_profiles').upsert(
                {
                    id: user.id,
                    phone: onboardingData.phone,
                    brand_name: onboardingData.brandName,
                },
                { onConflict: 'id' }
            )
            error = brandError
        }

        setLoading(false)

        if (error) {
            console.error('Onboarding update error:', error)
            toast.error('Failed to save profile. Please try again.', { style: { fontSize: 14 } })
        } else {
            toast.success('Profile created successfully! Welcome to Goheza.', { style: { fontSize: 14 } })
            router.push('/main') // Redirect to the user's dashboard
        }
    }

    // Renders the different steps of the form based on the user's role
    const renderContent = () => {
        // Step 1: Initial fields for both roles
        if (step === 1) {
            return (
                <div>
                    <div className="flex justify-center mb-4">
                        {role === 'creator' ? (
                            <Users className="w-12 h-12 text-[#e85c51]" />
                        ) : (
                            <Building2 className="w-12 h-12 text-blue-600" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">{`Welcome, ${
                        role === 'creator' ? 'Creator' : 'Brand'
                    }!`}</h1>
                    <p className="text-gray-600 text-center mb-6">
                        Just a few more details to set up your profile and get you started on Goheza.
                    </p>

                    {/* Conditional fields for Creator vs. Brand */}
                    {role === 'creator' && (
                        <div className="space-y-4">
                            <input
                                type="text"
                                name="phone"
                                placeholder="Phone Number"
                                value={onboardingData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                                required
                            />
                            <input
                                type="text"
                                name="country"
                                placeholder="Country"
                                value={onboardingData.country}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                                required
                            />
                        </div>
                    )}
                    {role === 'brand' && (
                        <div className="space-y-4">
                            <input
                                type="text"
                                name="brandName"
                                placeholder="Brand Name"
                                value={onboardingData.brandName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <input
                                type="text"
                                name="phone"
                                placeholder="Phone Number"
                                value={onboardingData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    )}
                    <button
                        onClick={() => setStep(2)}
                        disabled={
                            !onboardingData.phone ||
                            (role === 'creator' && !onboardingData.country) ||
                            (role === 'brand' && !onboardingData.brandName)
                        }
                        className={`w-full py-3 px-4 mt-6 rounded-2xl text-sm font-medium transition-all duration-200 ${
                            onboardingData.phone &&
                            (role === 'creator' ? onboardingData.country : onboardingData.brandName)
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
        if (role === 'creator' && step === 2) {
            return (
                <div>
                    <h2 className="text-xl font-bold text-center mb-2">Connect Your Channels</h2>
                    <p className="text-gray-600 text-center mb-6">This helps brands see your work and audience.</p>
                    <div className="space-y-4">
                        <textarea
                            name="socialLinks"
                            placeholder="Enter your social media links (e.g., Instagram, TikTok, YouTube)"
                            value={onboardingData.socialLinks}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                            required
                        />
                        <input
                            type="text"
                            name="paymentMethod"
                            placeholder="Preferred Payment Method"
                            value={onboardingData.paymentMethod}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                            required
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!onboardingData.socialLinks || !onboardingData.paymentMethod || loading}
                        className={`w-full py-3 px-4 mt-6 rounded-2xl text-sm font-medium transition-all duration-200 ${
                            onboardingData.socialLinks && onboardingData.paymentMethod
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

    // Final check for a valid role from the URL
    if (!role) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-gray-500">Loading or invalid role...</p>
                </div>
            </div>
        )
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
