'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'

type Brand = { id: string; user_id: string; brand_name: string; email: string | null; created_at: string }
type Creator = { id: string; user_id: string; display_name: string | null; email: string | null; created_at: string }

export default function AdminUsers() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [creators, setCreators] = useState<Creator[]>([])
    const [query, setQuery] = useState('')

    useEffect(() => {
        const run = async () => {
            const { data: b } = await supabaseClient
                .from('brand_profiles')
                .select('id,user_id,brand_name,email,created_at')
                .order('created_at', { ascending: false })
            const { data: c } = await supabaseClient
                .from('creator_profiles')
                .select('id,user_id,display_name,email,created_at')
                .order('created_at', { ascending: false })
            setBrands((b as Brand[]) || [])
            setCreators((c as Creator[]) || [])
        }
        run()
    }, [])

    const filteredBrands = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return brands
        return brands.filter(
            (b) => (b.brand_name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q)
        )
    }, [brands, query])

    const filteredCreators = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return creators
        return creators.filter(
            (c) => (c.display_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
        )
    }, [creators, query])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Users</h1>
                <input
                    placeholder="Search users…"
                    className="border rounded-lg px-3 py-2 text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border">
                    <div className="p-4 border-b font-semibold">Brands</div>
                    <ul>
                        {filteredBrands.map((b) => (
                            <li key={b.id} className="p-4 border-t">
                                <div className="font-medium">{b.brand_name}</div>
                                <div className="text-sm text-gray-600">{b.email}</div>
                                <div className="text-xs text-gray-500">UserId: {b.user_id}</div>
                            </li>
                        ))}
                        {filteredBrands.length === 0 && <li className="p-4 text-gray-600">No brands.</li>}
                    </ul>
                </div>

                <div className="bg-white rounded-xl border">
                    <div className="p-4 border-b font-semibold">Creators</div>
                    <ul>
                        {filteredCreators.map((c) => (
                            <li key={c.id} className="p-4 border-t">
                                <div className="font-medium">{c.display_name || '(No name)'}</div>
                                <div className="text-sm text-gray-600">{c.email}</div>
                                <div className="text-xs text-gray-500">UserId: {c.user_id}</div>
                            </li>
                        ))}
                        {filteredCreators.length === 0 && <li className="p-4 text-gray-600">No creators.</li>}
                    </ul>
                </div>
            </div>
        </div>
    )
}
