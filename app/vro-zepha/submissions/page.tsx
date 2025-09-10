'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { confirmAction } from '@/components/admin/Confirm'

type Submission = {
    id: string
    campaign_id: string
    creator_id: string
    status: string
    content: { name: string; url: string; type: string; size: number }[]
    note: string | null
    created_at: string
}

export default function AdminSubmissions() {
    const [rows, setRows] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        const { data } = await supabaseClient
            .from('campaign_submissions')
            .select('*')
            .in('status', ['pending_review'])
            .order('created_at', { ascending: false })
        setRows((data as Submission[]) || [])
        setLoading(false)
    }

    useEffect(() => {
        load()
    }, [])

    const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
        const ok = await confirmAction(`Mark submission as ${status}?`)
        if (!ok) return
        await supabaseClient.from('campaign_submissions').update({ status }).eq('id', id)
        await load()
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Submissions (pre-brand review)</h1>
            {loading ? (
                <p className="text-gray-600">Loading…</p>
            ) : rows.length === 0 ? (
                <p className="text-gray-600">No pending submissions.</p>
            ) : (
                <div className="grid gap-4">
                    {rows.map((s) => (
                        <div key={s.id} className="bg-white rounded-xl border p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-semibold">Submission #{s.id.slice(0, 8)}</div>
                                    <div className="text-sm text-gray-600">Campaign: {s.campaign_id}</div>
                                    <div className="text-sm text-gray-600">Creator: {s.creator_id}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateStatus(s.id, 'approved')}
                                        className="px-3 py-2 rounded-lg text-white"
                                        style={{ backgroundColor: '#1f9d55' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => updateStatus(s.id, 'rejected')}
                                        className="px-3 py-2 rounded-lg border"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {s.content?.map((c, i) => (
                                    <a
                                        key={i}
                                        href={c.url}
                                        target="_blank"
                                        className="block border rounded-lg p-3 hover:bg-gray-50"
                                    >
                                        <div className="text-sm font-medium truncate">{c.name}</div>
                                        <div className="text-xs text-gray-600">{c.type}</div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
