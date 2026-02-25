'use client'

import { baseURL } from '@/lib/env'
import { signInUser, signInWithGoogle } from '@/lib/supabase/auth/signin'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {  useState } from 'react'
import { toast } from 'sonner'
import logo from '@/assets/GOHEZA-02.png'
import { getProfileBasedOnUser } from '@/lib/supabase/auth/new/getProfiletype'

export default function SigninPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const onWillSubmitForNormalAuthentication = async () => {
        setIsLoading(true)
        try {
            const { isErrorTrue, data, errorMessage } = await signInUser({ email, password })

            if (isErrorTrue) {
                toast.error('Error Signing In', {
                    description: errorMessage,
                })
            }

            toast.success('Succefully Signed In')

            if (data?.user) {
                let currentProfile = await getProfileBasedOnUser(data.user)
                if (currentProfile?.profileType == 'brand') {
                    router.push('/main/brand/')
                } else {
                    router.push('/main/creator/dashboard')
                }
            }
        } catch (err) {
            toast.error('Sign In Failed')
        } finally {
            setIsLoading(false)
        }
    }

    const onWillUseGoogleAuth = async () => {
        setIsLoading(true)
        try {
            await signInWithGoogle({
                redirectURL: `${baseURL}/main/creator/dashboard?profilecheck=no`,
            })

            toast.success('Redirecting....')
        } catch (error) {
            toast.success('Google Signin Failed....', {
                className: 'text-black',
                description: 'Please try again',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex justify-center py-8">
            <div className="w-full max-w-md p-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-2">
                        <div className="text-neutral-800">
                            <span className="text-2xl font-bold">
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
                    </div>
                    <h1 className="text-2xl font-light text-black bg-clip-text mb-2">Sign in or Login in</h1>
                    <p className="text-gray-600 text-sm leading-relaxed">Connecting Brands to Creators...</p>
                </div>

                <div className="space-y-4">
                    {/* Email */}
                    <div>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51] focus:border-transparent placeholder-gray-400 transition-all duration-200"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 text-sm pr-12 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e85c51] focus:border-transparent placeholder-gray-400 transition-all duration-200"
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            disabled={isLoading}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {/* Forgot Password link */}
                    <div className="mt-2 text-right">
                        <Link
                            href="/main/auth/forgot-password"
                            className="text-xs font-medium text-[#e85c51] hover:text-[#c94c4c] transition-colors duration-200"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="button"
                        onClick={onWillSubmitForNormalAuthentication}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                            !isLoading
                                ? ' bg-[#e85c51] text-white font-bold shadow-lg hover:shadow-xl'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? (
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 
                     0 0 5.373 0 12h4zm2 
                     5.291A7.962 7.962 0 014 
                     12H0c0 3.042 1.135 
                     5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        ) : null}
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </div>

                {/* Divider */}
                <div className="my-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-gray-500">OR</span>
                        </div>
                    </div>
                </div>

                {/* Google Sign In */}
                <button
                    onClick={onWillUseGoogleAuth}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-200 rounded-2xl transition-all duration-200 group ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 
                 1.37-1.04 2.53-2.21 
                 3.31v2.77h3.57c2.08-1.92 
                 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 
                 7.28-2.66l-3.57-2.77c-.98.66-2.23 
                 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 
                 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 
                 8.55 1 10.22 1 12s.43 3.45 1.18 
                 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 
                 4.21 1.64l3.15-3.15C17.45 
                 2.09 14.97 1 12 1 7.7 1 
                 3.99 3.47 2.18 7.07l3.66 
                 2.84c.87-2.6 3.3-4.53 
                 6.16-4.53z"
                        />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                </button>

                {/* Sign Up Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don’t have an account?{' '}
                        <a
                            href="/main/auth/signup"
                            className="font-medium text-[#e85c51] transition-colors duration-200"
                        >
                            Sign up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
