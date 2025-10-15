'use client'

import { useState, useEffect } from 'react'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = supabaseClient

export default function VerificationNotice({ email,role }: { email?: string ,role?:string}) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Automatically resend email on mount and set up listener
    useEffect(() => {
        if (!email) {
            toast.error('No email provided')
            return
        }

        const sendInitialEmail = async () => {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            })
            if (error) {
                console.error(error)
                toast.error(error.message || 'Failed to resend verification email')
            } else {
                toast.success('Verification email sent! Check your inbox.')
            }
        }

        sendInitialEmail()

        // Listen for email confirmation
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user?.email_confirmed_at) {
                toast.success('Verification successful! Redirecting...');
                
              
            }
        })

        return () => {
            authListener?.subscription?.unsubscribe?.()
        }
    }, [email, router])

    // Manual resend handler
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
                toast.success('Verification email resent! Check your inbox.')
            }
        } catch (err) {
            console.error(err)
            toast.error('Unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-[#e85c51] p-4 rounded-full shadow-lg">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Check Your Inbox</h1>

                {/* Message */}
                <p className="text-gray-600 text-base mb-6">
                    {email
                        ? `A verification link has been sent to ${email}. Please follow the link to confirm your account.`
                        : 'A verification link has been sent to your email address. Please follow the instructions in the email to activate your account.'}
                </p>

                {/* Resend + Back */}
                <div className="space-y-3">
                    

                    <Link
                        href="/main/auth/signin"
                        className="block w-full py-3 px-4 text-sm font-semibold text-[#e85c51] border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                    >
                        Back to Sign In
                    </Link>
                </div>

                {/* Auto redirect hint */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center justify-center text-green-700 text-sm border border-green-200">
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>
                        <strong>Action Required:</strong> After verifying your email, this page will automatically
                        redirect you to the main dashboard.
                    </span>
                </div>
            </div>
        </div>
    )
}
