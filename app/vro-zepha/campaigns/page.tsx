'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'

type Row = {
    id: string
    name: string
    status: string
    created_at: string
    brand_name?: string
}

export default function AdminCampaigns() {
    const [rows, setRows] = useState<Row[]>([])
    const [status, setStatus] = useState<
        'pending_review' | 'active' | 'paused' | 'completed' | 'cancelled' | 'rejected' | 'all'
    >('pending_review')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const run = async () => {
            let q = supabaseClient
                .from('campaigns')
                .select('id,name,status,created_at')
                .order('created_at', { ascending: false })

            if (status !== 'all') q = q.eq('status', status)

            const { data } = await q
            setRows((data as Row[]) || [])
            setLoading(false)
        }
        run()
    }, [status])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Campaigns</h1>
                <select
                    className="border rounded-lg px-3 py-2 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                >
                    <option value="pending_review">Pending Review</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All</option>
                </select>
            </div>

            {loading ? (
                <p className="text-gray-600">Loading…</p>
            ) : rows.length === 0 ? (
                <p className="text-gray-600">No campaigns.</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded-xl border">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Created</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t">
                                    <td className="px-4 py-3">{r.name}</td>
                                    <td className="px-4 py-3 capitalize">{r.status.replace('_', ' ')}</td>
                                    <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/admin/campaigns/${r.id}`}
                                            className="text-sm font-medium"
                                            style={{ color: '#E66262' }}
                                        >
                                            Review / Manage →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
