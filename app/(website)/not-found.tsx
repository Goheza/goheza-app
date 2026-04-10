import React from 'react'
import Link from 'next/link' // Assuming you are using Next.js for routing
import Image from 'next/image' // Assuming you are using Next.js Image component
import logo from '@/assets/GOHEZA-02.png' // Using your existing logo import

export default function Custom404() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-8">
                {/* Logo at the top */}
                <div className="flex items-center justify-center mb-6">
                    <Image
                        src={logo.src}
                        width={120} // Slightly larger for prominence
                        height={40}
                        alt="Goheza Logo"
                        className="p-0 m-0 object-contain"
                    />
                </div>

                {/* 404 Title */}
                <h1 className="text-7xl md:text-8xl font-extrabold text-[#e85c51] mb-4 tracking-tight">404</h1>

                {/* Message */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Page Not Found</h2>

                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    Oops! It looks like the page you&apos;re looking for doesn&apos;t exist. It might have been moved,
                    deleted, or you might have mistyped the address.
                </p>

                {/* Call to action buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a href="/" className="w-full  sm:w-auto px-8 py-3 rounded-xl text-lg font-semibold text-white bg-[#e85c51] hover:bg-[#f3867e] transition-colors duration-300 shadow-md">
                            Go to Homepage
                        </a>

                    {/* Optional: Add a contact link or back button */}
                        <a href="/#contactus"  className="w-full sm:w-auto px-8 py-3 rounded-xl text-lg font-semibold text-[#e85c51] border-2 border-[#e85c51] hover:bg-[#e85c51] hover:text-white transition-colors duration-300">
                            Contact Support
                        </a>
                </div>

                {/* Optional: Illustration */}
                <div className="mt-8">
                    {/* You could add an SVG illustration here, for example: */}
                    {/* <Image src="/path/to/404-illustration.svg" alt="404 Illustration" width={200} height={200} /> */}
                    {/* Or dynamically generate one if your setup allows */}
                </div>
            </div>
        </div>
    )
}
