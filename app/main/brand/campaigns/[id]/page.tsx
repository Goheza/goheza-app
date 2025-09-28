'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'

// Assuming a standard Button component is available from your UI library
import { Button } from '@/components/ui/button'

// --- UPDATED INTERFACES ---

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
    assets: CampaignAsset[] | null // Made null|undefined safe
    status: string
    // ⭐ ADDED MISSING MISSION DETAILS (Based on typical schema design)
    dos: string | null
    donts: string | null
    additional_information: string | null
    target_countries: string[] | null // Assuming this is also part of mission details
}

// --- COMPONENT START ---

export default function CampaignDetails() {
    const router = useRouter()
    const params = useParams()
    const { id } = params

    const [campaign, setCampaign] = useState<CampaignData | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)
    // ⭐ NEW STATE: Controls the visibility of the confirmation dialog
    const [showConfirmModal, setShowConfirmModal] = useState(false)

    useEffect(() => {
        const fetchCampaign = async () => {
            // ⭐ UPDATED QUERY: Select all fields including dos, donts, etc.
            const { data, error } = await supabaseClient
                .from('campaigns')
                .select('*, dos, donts, additional_information, target_countries')
                .eq('id', id)
                .single()

            if (error) {
                console.error('Error fetching campaign:', error)
                // Use a general alert for error visibility
                alert('Campaign not found or an error occurred.')
                router.push('/main/brand/dashboard')
            } else {
                setCampaign(data as CampaignData)
            }
            setLoading(false)
        }

        if (id) fetchCampaign()
    }, [id, router])

    const handleConfirmCancel = () => {
        setShowConfirmModal(true) // Open the custom confirmation modal
    }

    // ⭐ MODIFIED: Actual cancellation logic, called only after modal confirmation
    const cancelCampaign = async () => {
        if (!campaign) return

        setCancelling(true)
        setShowConfirmModal(false) // Close modal immediately

        const { error } = await supabaseClient.from('campaigns').update({ status: 'cancelled' }).eq('id', campaign.id)

        if (error) {
            alert('Error cancelling campaign: ' + error.message)
        } else {
            alert('Campaign discarded successfully.')
            // Redirect or update the status in local state for immediate feedback
            setCampaign((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
            router.push('/main/brand/campaigns') // Redirect to list page
        }
        setCancelling(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
                <p className="ml-3 text-gray-600">Loading campaign details...</p>
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-[#e85c51] font-semibold">Campaign not found.</p>
            </div>
        )
    }

    const getAssetsByCategory = (category: CampaignAsset['category']) =>
        campaign.assets?.filter((asset) => asset.category === category) || []

    const formatViews = (views: number) => views?.toLocaleString() || 'N/A'
    const formatCurrency = (value: string) => {
        const num = parseFloat(value.replace(/[$,]/g, ''))
        return isNaN(num) ? 'N/A' : `$${num.toLocaleString()}`
    }

    // Calculates Cost Per 1K Views, handles division by zero/invalid numbers
    const calculateCpm = (budget: string, views: number) => {
        const budgetNum = parseFloat(budget.replace(/[$,]/g, ''))
        if (isNaN(budgetNum) || views <= 0) return 'N/A'
        return `$${((budgetNum / views) * 1000).toFixed(3)}`
    }

    const gotoSubmission = () => {
        router.push(`/main/brand/campaigns/submissions/${id}`)
    }

    return (
        <div className="font-sans p-5 max-w-6xl mx-auto mt-5 static">
            <div className="mb-8 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="mb-4 text-[#e93838] hover:text-blue-700 flex items-center font-medium"
                >
                    &larr; Back to Campaigns
                </button>
                <div className="space-x-4">
                    <Button
                        onClick={gotoSubmission}
                        variant="outline"
                        className="border-[#e93838] text-[#e93838] hover:bg-red-50"
                    >
                        View Submissions
                    </Button>
                    {campaign.status !== 'cancelled' && (
                        <Button
                            onClick={handleConfirmCancel} // ⭐ CALLS CONFIRMATION HANDLER
                            disabled={cancelling}
                            className="bg-[#e85c51] hover:bg-black text-white disabled:opacity-50"
                        >
                            {cancelling ? 'Discarding...' : 'Discard Campaign'}
                        </Button>
                    )}
                </div>
            </div>
            <h1 className="text-3xl font-bold mb-1 text-[#e93838]">{campaign.name}</h1>
            <p className="text-gray-600 mb-6 flex items-center space-x-2">
                <span>Current Status:</span>
                <span
                    className={`font-semibold ${campaign.status === 'cancelled' ? 'text-red-500' : 'text-green-500'}`}
                >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
            </p>
            {/* --- Mission Details (Combined Section) --- */}
            <div className="bg-white p-6 rounded-lg space-y-8 border mb-6">
                <h2 className="text-2xl font-bold text-[#e85c51]">Mission Details</h2>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b pb-6">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Budget</p>
                        <p className="text-lg text-gray-900 font-bold">{formatCurrency(campaign.budget)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Payout (Per Creator)</p>
                        <p className="text-lg text-gray-900 font-bold">{formatCurrency(campaign.payout)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Timeline</p>
                        <p className="text-lg text-gray-900">{campaign.timeline}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Quality Standard</p>
                        <p className="text-lg text-gray-900 capitalize">{campaign.quality_standard}</p>
                    </div>
                    {campaign.target_countries && campaign.target_countries.length > 0 && (
                        <div className="col-span-2">
                            <p className="text-sm font-medium text-gray-700">Target Countries</p>
                            <p className="text-lg text-gray-900">{campaign.target_countries.join(', ')}</p>
                        </div>
                    )}
                </div>

                {/* Description and Objectives */}
                <div className="space-y-6 border-b pb-6">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Campaign Description</p>
                        <p className="text-lg text-gray-900 whitespace-pre-wrap">{campaign.description}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Key Objectives</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            {campaign.objectives.map((obj, i) => (
                                <li key={i} className="text-gray-900">
                                    {obj}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Requirements and Additional Info */}
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Creator Requirements</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            {campaign.requirements.map((req, i) => (
                                <li key={i} className="text-gray-900">
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {campaign.additional_information && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Additional Information</p>
                            <p className="text-lg text-gray-900 whitespace-pre-wrap">
                                {campaign.additional_information}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {/* --- DOs and DON'Ts --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* DOs */}
                <div className="bg-white p-6 rounded-lg border">
                    <h2 className="text-xl font-bold text-green-600 mb-4">✅ DOs</h2>
                    <p className="text-gray-900 whitespace-pre-wrap">{campaign.dos || 'No specific DOs provided.'}</p>
                </div>
                {/* DON'Ts */}
                <div className="bg-white p-6 rounded-lg border">
                    <h2 className="text-xl font-bold text-red-600 mb-4">❌ DON'Ts</h2>
                    <p className="text-gray-900 whitespace-pre-wrap">
                        {campaign.donts || "No specific DON'Ts provided."}
                    </p>
                </div>
            </div>
            {/* --- Media & Guidelines --- */}
            <div className="bg-white p-6 rounded-lg border mb-6">
                <h2 className="text-xl font-bold mb-4 text-[#e93838]">Media & Guidelines</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Reference Images */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Reference Images</p>
                        {getAssetsByCategory('reference_image').map((asset, i) => (
                            <Link
                                key={i}
                                href={asset.url}
                                target="_blank"
                                className="block text-blue-600 hover:underline text-sm truncate"
                            >
                                {asset.name} ({asset.type})
                            </Link>
                        ))}
                        {getAssetsByCategory('reference_image').length === 0 && (
                            <p className="text-gray-500 text-sm">None uploaded.</p>
                        )}
                    </div>
                    {/* Brand Assets */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Brand Assets</p>
                        {getAssetsByCategory('brand_asset').map((asset, i) => (
                            <Link
                                key={i}
                                href={asset.url}
                                target="_blank"
                                className="block text-blue-600 hover:underline text-sm truncate"
                            >
                                {asset.name} ({asset.type})
                            </Link>
                        ))}
                        {getAssetsByCategory('brand_asset').length === 0 && (
                            <p className="text-gray-500 text-sm">None uploaded.</p>
                        )}
                    </div>
                    {/* Brand Guidelines */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Brand Guidelines</p>
                        {getAssetsByCategory('brand_guidelines').map((asset, i) => (
                            <Link
                                key={i}
                                href={asset.url}
                                target="_blank"
                                className="block text-blue-600 hover:underline text-sm truncate"
                            >
                                {asset.name} ({asset.type})
                            </Link>
                        ))}
                        {getAssetsByCategory('brand_guidelines').length === 0 && (
                            <p className="text-gray-500 text-sm">None uploaded.</p>
                        )}
                    </div>
                </div>
            </div>
            {/* --- Analytics (Optional but good to keep) --- */}
            {/* <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h2 className="text-xl font-bold mb-4 text-[#e93838]">Performance & Budget</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Estimated Views</p>
                        <p className="text-lg font-bold text-gray-900">{formatViews(campaign.estimated_views)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Total Budget</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(campaign.budget)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Cost Per 1K Views (eCPM)</p>
                        <p className="text-lg font-semibold text-blue-600">{calculateCpm(campaign.budget, campaign.estimated_views)}</p>
                    </div>
                </div>
            </div> */}
            {/* ⭐ CONFIRMATION MODAL (Using a simple overlay div) */}
            {showConfirmModal && (
                // REMOVED '-top-6' and used 'inset-0' to correctly fill the screen
                <div className="absolute bg-black/50 w-full left-0  -top-20 h-[850px] z-50 flex items-center justify-center ">
                    {/* The inner content box remains centered and styled */}
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-[#e85c51]">Confirm Discard</h3>
                        <p className="mb-6 text-gray-700">
                            Are you absolutely sure you want to **discard** this campaign? This action cannot be easily
                            undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button
                                onClick={() => setShowConfirmModal(false)}
                                variant="outline"
                                className="hover:bg-gray-100"
                            >
                                No, Keep It
                            </Button>
                            <Button
                                onClick={cancelCampaign}
                                className="bg-[#e85c51] hover:bg-black text-white"
                                disabled={cancelling}
                            >
                                {cancelling ? 'Discarding...' : 'Yes, Discard'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
