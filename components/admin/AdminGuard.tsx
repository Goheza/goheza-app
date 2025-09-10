'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const run = async () => {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()
            if (!user) {
                router.replace('/auth/signin?redirect=' + encodeURIComponent(pathname || '/admin'))
                return
            }

            // Check via admin_users table (preferred)
            const { data: adminRow } = await supabaseClient
                .from('admin_users')
                .select('user_id')
                .eq('user_id', user.id)
                .single()

            const fromMetadata = (user.user_metadata as any)?.role === 'admin'
            const isAdmin = !!adminRow || fromMetadata

            if (!isAdmin) {
                router.replace('/') // or your dashboard
                return
            }

            setChecking(false)
        }
        run()
    }, [router, pathname])

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">Checking admin access…</p>
            </div>
        )
    }

    return <>{children}</>
}
