'use client'

import { updateUserPassword } from '@/lib/auth/forgot-password'
import { checkCurrentUserSession } from '@/lib/auth//session-manager'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function ResetPasswordFormComponent() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
    const [isLoading, setLoading] = useState(false)

    const validatePasswords = () => {
        const newErrors: { password?: string; confirmPassword?: string } = {}

        if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long'
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    useEffect(() => {
        const checkForAvailableUserSession = () => {
            checkCurrentUserSession().then((v) => {
                console.log('Available User Session', v)
            })
        }

        checkForAvailableUserSession()
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validatePasswords()) {
            updateUserPassword({
                password: password,
            }).then(() => {
                toast.success('Authentication', {
                    description: 'Your Password has been Updated!.',
                })

                setTimeout(() => {
                    router.push('/main/auth/signin')
                }, 2500)
            })
        }
    }

    return (
        <div className="flex items-center justify-center  min-h-screen bg-white ">
            <div className="w-full max-w-md bg-white rounded-lg  p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-light text-gray-900 mb-2">Set New Password</h2>
                    <p className="text-gray-600 font-light">
                        Enter your new password below to reset your account password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-light text-gray-700 mb-2">
                            New password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-3 pr-12 border font-light ${
                                    errors.password ? 'border-red-300' : 'border-gray-300'
                                } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors`}
                                placeholder="Enter new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                        />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-[#e85c51]">{errors.password}</p>}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-light text-gray-700 mb-2">
                            Confirm new password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 font-light py-3 pr-12 border ${
                                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors`}
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                        />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-[#e85c51]">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#e85c51] hover:bg-[#e85c51] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        {isLoading ? 'Updating...' : 'Update password'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
                </div>
            </div>
        </div>
    )
}
