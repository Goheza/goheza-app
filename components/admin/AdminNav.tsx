'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
    { href: '/vro-zepha', label: 'Overview' },
    { href: '/vro-zepha/campaigns', label: 'Campaigns' },
    { href: '/vro-zepha/submissions', label: 'Submissions' },
    { href: '/vro-zepha/users', label: 'Users' },
    { href: '/vro-zepha/payments', label: 'Payments' },
]

export default function AdminNav() {
    const pathname = usePathname()
    return (
        <nav className="border-b bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    <div className="font-bold" style={{ color: '#E66262' }}>
                        Goheza Admin
                    </div>
                    <div className="flex gap-6">
                        {links.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className={`text-sm ${
                                    pathname === l.href ? 'font-semibold' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    )
}
