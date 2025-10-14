'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { sendBrandEmailData } from '@/lib/brand/send-brand-data'
import { useRouter } from 'next/navigation'
import { baseLogger } from '@/lib/logger'

// --- Configuration ---
// Primary accent remains the same
const PRIMARY_ACCENT = '#e85c51' // Goheza Red/Orange Accent
const SECONDARY_COLOR = 'rgb(79 70 229)' // Tailwind Indigo/Blue for secondary details

// 💡 NEW LIGHT MODE COLORS
const BG_COLOR_LIGHT = 'rgb(249 250 251)' // Tailwind Gray-50 (Light background)
const CARD_COLOR_LIGHT = 'white'
const TEXT_COLOR_LIGHT = 'rgb(17 24 39)' // Tailwind Gray-900 (Dark text)
// ----------------------

export default function BrandPendingApprovalPage() {
    const params = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const initalLoad = async () => {
            baseLogger('AUTHENTICATION', 'DidReachFeedbackBasedLogin')
            let userProvider = params.get('provider')

            if (userProvider && userProvider == 'google') {
                baseLogger('AUTHENTICATION', 'DidReachGoogleFeedbackLogin')

                const {
                    data: { user },
                } = await supabaseClient.auth.getUser()
                if (user) {
                    baseLogger('AUTHENTICATION', 'DidReachGoogleFeedbackLogin(UserFound)')

                    const name =
                        user.identities![0]?.identity_data?.full_name ||
                        user.user_metadata?.full_name ||
                        user.user_metadata.fullName ||
                        'Goheza'

                    sendBrandEmailData({
                        email: user.email!,
                        name: name,
                        message: ` 
                                        
                                            name : ${name}\n
                                            phoneNumber: No Phone \n
                                            provider : (GoogleAuthentication)
                                        
                                        
                                        `,
                    }).then(() => {
                        //do nothing.
                        return;
                    })
                }
                return
            }

            if (userProvider && userProvider == 'agent') {
                //do nothing
                return
            } else {
                router.push('/main/auth/signup')
            }
        }
        initalLoad()
    }, [params])

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen p-6"
            // 💡 APPLY LIGHT MODE BACKGROUND
            style={{ backgroundColor: BG_COLOR_LIGHT }}
        >
            <div
                className="w-full max-w-2xl text-center p-8 md:p-12 rounded-xl shadow-2xl backdrop-blur-sm border"
                // 💡 APPLY LIGHT MODE CARD STYLES
                style={{ backgroundColor: CARD_COLOR_LIGHT, borderColor: 'rgb(229 231 235)' }} // gray-200 border
            >
                {/* Checkmark Icon - Visual Confirmation */}
                <div
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-5" // 💡 SMALLER ICON SIZE (h-20 w-20, was h-24 w-24)
                    style={{ backgroundColor: PRIMARY_ACCENT, boxShadow: `0 0 20px ${PRIMARY_ACCENT}33` }}
                >
                    {/* SVG for a checkmark icon */}
                    <svg
                        className="h-10 w-10 text-white" // 💡 SMALLER SVG SIZE (h-10 w-10, was h-12 w-12)
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: TEXT_COLOR_LIGHT }}>
                    {' '}
                    {/* 💡 SMALLER TEXT (text-3xl/4xl, was 4xl/5xl) */}
                    Application Received!
                </h1>

                {/* Sub-Heading/Core Message */}
                <p className="text-lg text-gray-600 mb-6 font-light">
                    {' '}
                    {/* 💡 SMALLER TEXT (text-lg, was text-xl) */}
                    Your brand's application is now under review by our team.
                </p>

                {/* Detailed Contact Message */}
                <div
                    className="p-5 rounded-lg mb-7 border" // 💡 SMALLER PADDING AND BORDER
                    style={{ backgroundColor: 'rgb(243 244 246)', borderColor: 'rgb(209 213 219)' }} // Light gray background/border
                >
                    <h2 className="text-xl font-semibold mb-2" style={{ color: SECONDARY_COLOR }}>
                        {' '}
                        {/* 💡 SMALLER TEXT (text-xl, was text-2xl) */}
                        What Happens Next?
                    </h2>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {' '}
                        {/* 💡 SMALLER TEXT (text-sm, was text-base) */}
                        We are verifying your details to ensure the best collaboration experience. We will contact you
                        directly via email or phone when your account has been reviewed and is ready for activation.
                    </p>
                    <p className="text-sm font-bold mt-2" style={{ color: PRIMARY_ACCENT }}>
                        {' '}
                        {/* 💡 SMALLER TEXT (text-sm, was text-base) */}
                        Someone from our team will be in contact with you shortly.
                    </p>
                </div>

                {/* Action Buttons (Go Back/Contact) */}
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <Link href="/" passHref>
                        <Button
                            asChild
                            className="w-full sm:w-auto px-8 py-5 text-base font-semibold border-2" // 💡 SMALLER BUTTON SIZE (px-8 py-5, text-base)
                            style={{
                                backgroundColor: PRIMARY_ACCENT,
                                borderColor: PRIMARY_ACCENT,
                                color: 'white',
                                transition: 'background-color 0.3s',
                            }}
                        >
                            <a href="/">Go Back to Homepage</a>
                        </Button>
                    </Link>

                    <Link href="mailto:info@goheza.com" passHref>
                        <Button
                            asChild
                            variant="outline"
                            className="w-full sm:w-auto px-8 py-5 text-base font-semibold border-2" // 💡 SMALLER BUTTON SIZE
                            style={{
                                borderColor: SECONDARY_COLOR,
                                color: SECONDARY_COLOR,
                                backgroundColor: 'transparent',
                                transition: 'border-color 0.3s, color 0.3s',
                            }}
                        >
                            <a href="mailto:info@goheza.com">Contact Support</a>
                        </Button>
                    </Link>
                </div>

                <p className="mt-8 text-xs text-gray-500">
                    {' '}
                    {/* 💡 SMALLER FOOTER TEXT (text-xs, was text-sm) */}
                    Thank you for choosing Goheza.
                </p>
            </div>
        </div>
    )
}
