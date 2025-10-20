'use client'

import { Facebook, Users } from 'lucide-react'
import { FaXTwitter } from 'react-icons/fa6'
import { FaTiktok } from 'react-icons/fa'
import { FaInstagram } from "react-icons/fa6";
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function FooterComponent() {
    const [isVisible, setVisible] = useState(false)
    const router = useRouter()
    const currentPath = usePathname()

    useEffect(() => {
        /**
         *
         */
        const initial = () => {
            if (currentPath.startsWith('/main')) {
                setVisible(false)
            } else {
                setVisible(true)
            }
        }
        initial()
    })

    return (
        <div>
            {/* Footer */}
            <footer
                className="bg-gray-900 text-white"
                style={{
                    display: isVisible ? 'block' : 'none',
                }}
            >
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-2xl font-bold mb-4">Goheza</div>
                            <p className="text-gray-300 mb-6">
                                Empowering creators and elevating brands through performance-based marketing. We make it
                                easy for anyone to earn from their creativity and passion.
                            </p>
                            <div className="flex space-x-4">
                                <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                                    <Facebook className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer transform-gpu transition-all hover:scale-110" />
                                </a>
                                <a href="https://x.com/goheza_official?s=11" target="_blank" rel="noopener noreferrer">
                                    <FaXTwitter className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer transform-gpu transition-all hover:scale-110" />
                                </a>
                                <a
                                    href="https://www.tiktok.com/@goheza?_t=ZM-90LRVAxN3bI&_r=1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FaTiktok className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer transform-gpu transition-all hover:scale-110" />
                                </a>
                                 <a
                                    href="https://www.instagram.com/goheza_official_?igsh=ZnRveTI2emt3bWth"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FaInstagram className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer transform-gpu transition-all hover:scale-110" />
                                </a>
                                {/* Add other social media icons here */}
                            </div>
                        </div>

                        {/* Quick Links Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>
                                    <Link href="#how-it-works" className="hover:text-white transition-colors">
                                        How It Works
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#features" className="hover:text-white transition-colors">
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#faq" className="hover:text-white transition-colors">
                                        FAQ
                                    </Link>
                                </li>
                                <li>
                                    <Link href="mailto:info@goheza.com" className="hover:text-white transition-colors">
                                        Contact Us
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>
                                    <Link
                                        target="_blank"
                                        href="/privacy-policy"
                                        className="hover:text-white transition-colors"
                                    >
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link target="_blank" href="/terms" className="hover:text-white transition-colors">
                                        Terms & Conditions
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Info Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Contact</h3>
                            <ul className="space-y-2 text-gray-300">
                                <li>
                                    Email:{' '}
                                    <a href="mailto:info@goheza.com" className="hover:text-white transition-colors">
                                        info@goheza.com
                                    </a>
                                </li>
                                <li>
                                    Phone:{' '}
                                    <a href="tel:+256776007962" className="hover:text-white transition-colors">
                                        +256792641638
                                    </a>
                                </li>
                                <li>Address: National ICT Hub P.O. BOX 7817, Kampala, Uganda</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 mt-10 pt-8 text-center text-gray-400 text-sm">
                        <p>&copy; {new Date().getFullYear()} Goheza. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
