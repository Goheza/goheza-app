// components/layout/Header.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import logo from '@/assets/GOHEZA-02.png'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export default function Header() {
    const router = useRouter()
    const currentPath = usePathname()
    const [isVisible, setVisible] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navigate = (link: string) => {
        setMobileMenuOpen(false)
        router.push(link)
    }

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
        <motion.header
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{
                display: isVisible ? 'block' : 'none',
            }}
            className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm"
        >
            <div className="container mx-auto px-3 py-3 flex items-center justify-between">
                <Link href="/">
                    <Image src={logo} width={100} height={30} alt="Goheza Logo" className="object-contain" />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex space-x-6 font-semibold ml-4">
                    <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900">
                        How It Works
                    </Link>
                    <Link href="#features" className="text-gray-600 hover:text-gray-900">
                        Features
                    </Link>
                    <Link href="#contactus" className="text-gray-600 hover:text-gray-900">
                        Contact us
                    </Link>
                    <Link href="#faq" className="text-gray-600 hover:text-gray-900">
                        FAQ
                    </Link>
                </nav>

                {/* Desktop actions */}
                <div className="hidden md:flex items-center space-x-4 font-semibold">
                    <Link href="/main/auth/signin">
                        <Button variant="ghost">Log In</Button>
                    </Link>
                    <Link href="/main/auth/signup">
                        <Button className="bg-[#e85c51] hover:bg-[#df4848]">Sign Up</Button>
                    </Link>
                </div>

                {/* Mobile */}
                <div className="md:hidden flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/main/auth/signin')}
                        className="p-2 min-w-[44px] h-10 rounded-md bg-[#e85c51] border border-[#e85c51] text-white hover:text-black hover:bg-transparent "
                    >
                        Log In
                    </Button>

                    <button
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        onClick={() => setMobileMenuOpen((s) => !s)}
                        className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={mobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="md:hidden overflow-hidden border-t border-gray-200"
            >
                <div className="px-4 py-4 flex flex-col gap-3">
                    <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-gray-700">
                        How It Works
                    </Link>
                    <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="text-gray-700">
                        Features
                    </Link>
                    <Link href="#contactus" onClick={() => setMobileMenuOpen(false)} className="text-gray-700">
                        Contact us
                    </Link>
                    <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-gray-700">
                        FAQ
                    </Link>

                    <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                        <Button variant="ghost" onClick={() => navigate('/main/auth/signin')}>
                            Log In
                        </Button>
                        <Button
                            className="bg-[#e85c51] hover:bg-[#df4848]"
                            onClick={() => navigate('/main/auth/signup')}
                        >
                            Sign Up
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.header>
    )
}
