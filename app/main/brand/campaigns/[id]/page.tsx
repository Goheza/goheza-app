'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'

interface CampaignAsset {
    name: string
    url: string
    type: string
    size: number
    category: 'brand_asset' | 'reference_image' | 'brand_guidelines'
}

interface CampaignData {
    id: string
    name: string
    description: string
    budget: string
    payout: string
    timeline: string
    requirements: string[]
    objectives: string[]
    estimated_views: number
    quality_standard: 'basic' | 'premium' | 'professional'
    assets: CampaignAsset[]
    status: string
}

export default function CampaignDetails() {
    const router = useRouter()
    const params = useParams()
    const { id } = params

    const [campaign, setCampaign] = useState<CampaignData | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)

    useEffect(() => {
        const fetchCampaign = async () => {
            const { data, error } = await supabaseClient.from('campaigns').select('*').eq('id', id).single()

            if (error) {
                console.error('Error fetching campaign:', error)
                router.push('/main/brand/dashboard')
            } else {
                setCampaign(data as CampaignData)
            }
            setLoading(false)
        }

        if (id) fetchCampaign()
    }, [id, router])

    const cancelCampaign = async () => {
        if (!campaign) return
        if (!confirm('Are you sure you want to cancel this campaign?')) return

        setCancelling(true)

        const { error } = await supabaseClient.from('campaigns').update({ status: 'cancelled' }).eq('id', campaign.id)

        if (error) {
            alert('Error cancelling campaign: ' + error.message)
        } else {
            alert('Campaign cancelled successfully')
            router.push('/main/brand/dashboard')
        }
        setCancelling(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Loading campaign details...</p>
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-600">Campaign not found.</p>
            </div>
        )
    }

    const getAssetsByCategory = (category: CampaignAsset['category']) =>
        campaign.assets?.filter((asset) => asset.category === category) || []

    const formatViews = (views: number) => views.toLocaleString()

    const gotoSubmission = () => {
        router.push(`/main/brand/campaigns/submissions/${id}`)
    }

    return (
        <div className="font-sans p-5 max-w-6xl mx-auto mt-5">
            <div className="mb-8 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="mb-4 text-[#e93838] hover:text-blue-700 flex items-center"
                >
                    ← Back
                </button>
                <div className="space-x-4">
                    <button
                        onClick={gotoSubmission}
                        className="bg-transparent text-[#e93838]  hover:bg-black hover:text-white hover:border-transparent border border-[#e93838] px-4 py-2 rounded-lg font-medium  transition disabled:opacity-50"
                    >
                        View Submissions
                    </button>
                    {campaign.status !== 'cancelled' && (
                        <button
                            onClick={cancelCampaign}
                            disabled={cancelling}
                            className="bg-red-600 hover:bg-black hover:text-white text-white px-4 py-2 rounded-lg font-medium  transition disabled:opacity-50"
                        >
                            {cancelling ? 'Cancelling...' : 'Discard Campaign'}
                        </button>
                    )}
                </div>
            </div>

            <h1 className="text-3xl font-bold mb-5 text-[#e93838]">{campaign.name}</h1>
            <p className="text-gray-600 mb-6">
                Review the details of this campaign.{' '}
                {campaign.status === 'cancelled' && <span className="text-red-600 font-semibold">(Cancelled)</span>}
            </p>

            {/* Campaign Details */}
            <div className="bg-white p-6 rounded-lg space-y-4 border mb-6">
                <h2 className="text-xl font-semibold mb-4 text-red-600">Campaign Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className='space-y-1'>
                        <p className="text-sm font-medium text-gray-700">Campaign Title</p>
                        <p className="text-lg text-gray-900 font-bold">{campaign.name}</p>
                    </div>
                    <div className='space-y-1'>
                        <p className="text-sm font-medium text-gray-700">Timeline</p>
                        <p className="text-lg text-gray-900">{campaign.timeline}</p>
                    </div>
                </div>
                <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-lg text-gray-900">{campaign.description}</p>
                </div>
            </div>

            {/* Requirements */}
            <div className="bg-white p-6 rounded-lg border mb-6">
                <h2 className="text-xl font-semibold mb-4 text-[#e93838]">Requirements</h2>
                <ul className="list-disc list-inside space-y-2">
                    {campaign.requirements.map((req, i) => (
                        <li key={i} className="text-gray-900">
                            {req}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Media */}
            <div className="bg-white p-6 rounded-lg border mb-6">
                <h2 className="text-xl font-semibold mb-4 text-[#e93838]">Media & Guidelines</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Reference Images</p>
                        {getAssetsByCategory('reference_image').map((asset, i) => (
                            <Link
                                key={i}
                                href={asset.url}
                                target="_blank"
                                className="block text-blue-600 hover:underline"
                            >
                                {asset.name}
                            </Link>
                        ))}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Brand Assets</p>
                        {getAssetsByCategory('brand_asset').map((asset, i) => (
                            <Link
                                key={i}
                                href={asset.url}
                                target="_blank"
                                className="block text-blue-600 hover:underline"
                            >
                                {asset.name}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">Brand Guidelines</p>
                    {getAssetsByCategory('brand_guidelines').map((asset, i) => (
                        <Link key={i} href={asset.url} target="_blank" className="block text-blue-600 hover:underline">
                            {asset.name}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Objectives + Quality */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div></div>
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-[#e93838]">Quality Standard</h2>
                        <p className="text-lg text-gray-900 capitalize">{campaign.quality_standard}</p>
                    </div>
                </div>
            </div>

            {/* Analytics */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h2 className="text-xl font-semibold mb-4 text-[#e93838]">Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Estimated Views</p>
                        <p className="text-lg font-bold text-gray-900">{formatViews(campaign.estimated_views)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Cost Per 1K Views</p>
                        <p className="text-lg font-semibold text-blue-600">
                            $
                            {(
                                (parseFloat(campaign.budget.replace(/[$,]/g, '')) / campaign.estimated_views) *
                                1000
                            ).toFixed(3)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
