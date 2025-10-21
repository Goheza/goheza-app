'use client'

import { resetPassword } from '@/lib/auth/forgot-password'
import { baseURL } from '@/lib/env'
import React, { useState } from 'react'
import { toast } from 'sonner'

export default function ForgotPasswordComponent() {
    const [email, setEmail] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        toast.success('Authentication', {
            className:'text-black',
            description: 'Processing Reset...',
        })

        resetPassword({
            email: email,
            redirectLink: `${baseURL}/main/auth/reset-password`,
        }).then(() => {
            toast.success('Authenticaton', {
                 className:'text-black',
                description: 'A Password reset link has been sent to your Email',
            })
        })
    }

    return (
        <div className=" flex items-center justify-center bg-white  min-h-screen ">
            <div className="w-full max-w-md bg-white rounded-lg  p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-light text-gray-900 mb-2 ">Forgot your password?</h2>
                    <p className="text-gray-600 font-light">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-light text-gray-700 mb-2">
                            Email address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 font-light border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full font-light bg-[#e85c51] hover:bg-[#e85c51] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
                    >
                        Send Reset Link
                    </button>
                </form>
            </div>
        </div>
    )
}
