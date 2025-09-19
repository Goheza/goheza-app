'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { confirmAction } from '@/components/admin/Confirm'

type Asset = {
    name: string
    url: string
    type: string
    size: number
    category: 'brand_asset' | 'reference_image' | 'brand_guidelines'
}
type Campaign = {
    id: string
    name: string
    description: string
    status: string
    timeline: string
    budget: string
    payout: string
    objectives: string[]
    requirements: string[]
    estimated_views: number
    quality_standard: string
    assets: Asset[]
    created_at: string
    reviewed_by?: string | null
    reviewed_at?: string | null
    review_note?: string | null
}

export default function AdminCampaignDetail() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [data, setData] = useState<Campaign | null>(null)
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const run = async () => {
            const { data, error } = await supabaseClient.from('campaigns').select('*').eq('id', id).single()
            if (error) {
                router.replace('/admin/campaigns')
                return
            }
            setData(data as Campaign)
            setLoading(false)
        }
        run()
    }, [id, router])

    const transition = async (status: 'active' | 'rejected' | 'paused' | 'completed') => {
        if (!data) return
        const ok = await confirmAction(
            status === 'active'
                ? 'Approve this campaign to go live?'
                : status === 'rejected'
                ? 'Reject this campaign?'
                : `Set status to ${status}?`
        )
        if (!ok) return

        setSaving(true)
        const { data: me } = await supabaseClient.auth.getUser()
        await supabaseClient
            .from('campaigns')
            .update({
                status,
                reviewed_by: me?.user?.id ?? null,
                reviewed_at: new Date().toISOString(),
                review_note: note || null,
            })
            .eq('id', data.id)

        setSaving(false)
        router.refresh()
        router.replace('/admin/campaigns')
    }

    if (loading) return <p className="text-gray-600">Loading…</p>
    if (!data) return <p className="text-[#e85c51]">Not found</p>

    const assetsBy = (cat: Asset['category']) => data.assets?.filter((a) => a.category === cat) || []

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{data.name}</h1>
                    <p className="text-gray-600">
                        Status: <span className="capitalize">{data.status.replace('_', ' ')}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => transition('active')}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: '#E66262' }}
                    >
                        {saving ? 'Saving…' : 'Approve & Go Live'}
                    </button>
                    <button
                        onClick={() => transition('rejected')}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg border"
                    >
                        Reject
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-gray-800">{data.description}</p>
            </div>

            <div className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold mb-3">Assets</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm font-medium mb-1">Reference Images</div>
                        <ul className="list-disc list-inside">
                            {assetsBy('reference_image').map((a) => (
                                <li key={a.url}>
                                    <a className="text-blue-600" href={a.url} target="_blank">
                                        {a.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <div className="text-sm font-medium mb-1">Brand Assets</div>
                        <ul className="list-disc list-inside">
                            {assetsBy('brand_asset').map((a) => (
                                <li key={a.url}>
                                    <a className="text-blue-600" href={a.url} target="_blank">
                                        {a.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
                <h2 className="font-semibold mb-2">Review Note</h2>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    placeholder="Optional note visible to brand (e.g., fix title length, clarify payout, etc.)"
                    rows={4}
                />
            </div>

            <div className="flex gap-3">
                <button onClick={() => transition('paused')} className="px-4 py-2 rounded-lg border">
                    Pause
                </button>
                <button onClick={() => transition('completed')} className="px-4 py-2 rounded-lg border">
                    Complete
                </button>
            </div>
        </div>
    )
}
