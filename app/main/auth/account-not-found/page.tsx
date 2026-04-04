'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function AccountNotFound() {
    return (
        <main className="min-h-screen bg-[#0a0f1e] flex flex-col">
            {/* Navbar */}
            <nav className="w-full px-6 md:px-16 py-5 flex items-center justify-between border-b border-white/5">
                <Link href="/">
                    {/* Replace src with your actual logo path */}
                    <img
                        src="https://goheza.com/_next/static/media/GOHEZA-02.6c292dee.png"
                        alt="Goheza Logo"
                        width={120}
                        height={36}
                        className="h-9 w-auto object-contain"
                    />
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm text-white/60 font-medium">
                    <Link href="#how-it-works" className="hover:text-white transition-colors">
                        How It Works
                    </Link>
                    <Link href="#features" className="hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="#contactus" className="hover:text-white transition-colors">
                        Contact Us
                    </Link>
                    <Link href="#faq" className="hover:text-white transition-colors">
                        FAQ
                    </Link>
                </div>

                <Link
                    href="/main/auth/signin"
                    className="text-sm font-semibold text-white border border-white/20 px-5 py-2 rounded-full hover:border-[#00c87a] hover:text-[#00c87a] transition-all duration-200"
                >
                    Log In
                </Link>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-20">
                <div className="relative max-w-lg w-full text-center">
                    {/* Ambient glow */}
                    <div className="absolute inset-0 -z-10 flex items-center justify-center">
                        <div className="w-96 h-96 rounded-full bg-[#00c87a]/10 blur-[100px]" />
                    </div>

                    {/* Icon */}
                    <div className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Google "G" simplified icon */}
                            <circle cx="18" cy="13" r="7" stroke="#ffffff40" strokeWidth="1.5" />
                            <path
                                d="M18 6a7 7 0 1 0 5.5 11.3H18v-2.8h7.6c.1.5.2 1 .2 1.5A10 10 0 1 1 18 8"
                                stroke="white"
                                strokeWidth="0"
                                fill="none"
                            />
                            {/* Simple person icon */}
                            <circle cx="18" cy="12" r="5" stroke="white" strokeWidth="1.8" fill="none" />
                            <path
                                d="M8 28c0-5.523 4.477-10 10-10s10 4.477 10 10"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                fill="none"
                            />
                            {/* X mark */}
                            <circle cx="27" cy="9" r="6" fill="#0a0f1e" />
                            <circle cx="27" cy="9" r="5.5" fill="#ff4d4d" />
                            <path
                                d="M24.5 6.5l5 5M29.5 6.5l-5 5"
                                stroke="white"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
                        No account found for
                        <br />
                        <span className="text-[#00c87a]">this Google profile</span>
                    </h1>

                    {/* Subtext */}
                    <p className="text-white/50 text-base leading-relaxed mb-10 max-w-sm mx-auto">
                        We couldn&apos;t find a Goheza account linked to your Google account. Create one now to start
                        connecting with brands and creators.
                    </p>

                    {/* Sign Up CTA */}
                    <Link
                        href="/main/auth/signup"
                        className="inline-flex items-center gap-3 bg-[#00c87a] hover:bg-[#00b36d] text-[#0a0f1e] font-bold text-sm px-8 py-4 rounded-full transition-all duration-200 shadow-lg shadow-[#00c87a]/20 hover:shadow-[#00c87a]/30 hover:scale-105 active:scale-100"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path
                                d="M9 3.75v10.5M3.75 9h10.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                        Create an Account
                    </Link>

                    {/* Already have account */}
                    <p className="mt-6 text-sm text-white/30">
                        Already have an account?{' '}
                        <Link
                            href="/main/auth/signin"
                            className="text-white/60 hover:text-[#00c87a] underline underline-offset-2 transition-colors"
                        >
                            Log in here
                        </Link>
                    </p>

                    {/* Divider line */}
                    <div className="mt-14 pt-8 border-t border-white/5">
                        <p className="text-xs text-white/20">
                            Need help?{' '}
                            <a
                                href="mailto:info@goheza.com"
                                className="hover:text-white/40 transition-colors underline underline-offset-2"
                            >
                                Contact support
                            </a>
                        </p>
                    </div>
                </div>
            </div>

           
        </main>
    )
}
