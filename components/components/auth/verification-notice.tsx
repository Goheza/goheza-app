'use client'

import { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client' // make sure you have this set up
import { toast } from 'sonner'

const supabase = supabaseClient

export default function VerificationNotice({ email }: { email?: string }) {
    const [loading, setLoading] = useState(false)

    const handleResend = async () => {
        if (!email) {
            toast.error('No email provided')
            return
        }

        try {
            setLoading(true)

            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            })

            if (error) {
                console.error(error)
                toast.error(error.message || 'Failed to resend verification email')
            } else {
                toast.success('Verification email resent!')
            }
        } catch (err: any) {
            console.error(err)
            toast.error('Unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-[#e85c51] p-4 rounded-full">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-black mb-3">Verify Your Email</h1>

                {/* Message */}
                <p className="text-gray-600 text-sm mb-6">
                    {email
                        ? `A verification link has been sent to ${email}. Please check your inbox and follow the instructions to activate your account.`
                        : 'A verification link has been sent to your email address. Please check your inbox and follow the instructions to activate your account.'}
                </p>

                {/* Resend + Back to Login */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full py-3 px-4 text-sm font-medium text-white rounded-2xl bg-[#e85c51] transition-all duration-200 shadow-md disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Resend Verification Email'}
                    </button>

                    <Link
                        href="/main/auth/signin"
                        className="block w-full py-3 px-4 text-sm font-medium text-[#e85c51] border border-purple-200 rounded-2xl hover:bg-purple-50 transition-all duration-200"
                    >
                        Back to Sign In
                    </Link>
                </div>

                {/* Success Hint */}
                <div className="mt-6 flex items-center justify-center text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Once verified, you can sign in.</span>
                </div>
            </div>
        </div>
    )
}
