'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import Image from 'next/image'

// Define the structure for an individual asset object in the JSONB array
type Asset = {
    url: string
    name: string
    type: string // e.g., 'image', 'video', 'pdf'
}

// Campaign type aligned with the provided SQL schema
type Campaign = {
    id: string
    name: string
    description: string | null
    requirements: string[] | null // Text array
    payout: string
    budget: string | null
    objectives: string[] | null // Array of text
    timeline: string | null
    quality_standard: string | null
    estimated_views: number | null
    additional_information: string | null
    dos: string | null // Text (assuming multi-line input)
    donts: string | null // Text (assuming multi-line input)
    target_countries: string[] | null // Text array
    num_creators: number | null
    max_pay: string | null
    flat_fee: string | null
    status: 'inreview' | 'approved' | 'cancelled'
    created_at: string
    cover_image_url: string | null
    // brand_profiles already joined, add logo_url to it:
    brand_logo_url?: string | null // we'll map this from brand_profiles.logo_url
    created_by: string // Auth user ID (the creator)
    brand_name: string // From joined brand_profiles
    // ⭐ INCLUDED: The assets column (JSONB in SQL)
    assets: Asset[] | null
}

// Helper function to format list items (requirements, objectives, countries, etc.)
const formatListItems = (data: string | string[] | null | undefined): string[] => {
    if (!data) return []
    // If it's a string (e.g., multi-line input for Do's/Don'ts), split by newline
    if (typeof data === 'string') {
        return data
            .split('\n')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
    }
    // If it's an array (e.g., requirements, objectives, target_countries)
    if (Array.isArray(data)) {
        return data.map((item) => item.trim()).filter((item) => item.length > 0)
    }
    return []
}

interface ICampaignDetailsModel {
    campaign: Campaign
    isOpen: boolean
    onWillDeleteCampaign: (campaignID: string, campaignName: string) => void
    onClose: () => void
    onAction: (id: string, status: 'approved' | 'cancelled') => void
    //@ts-ignore
    getStatusBadge: (status: string) => JSX.Element
}

// Helper component for the Campaign Details Modal
const CampaignDetailsModal = ({
    campaign,
    isOpen,
    onClose,
    onAction,
    onWillDeleteCampaign,
    getStatusBadge,
}: ICampaignDetailsModel) => {
    const requirementsList = formatListItems(campaign.requirements)
    const objectivesList = formatListItems(campaign.objectives)
    const dosList = formatListItems(campaign.dos)
    const dontsList = formatListItems(campaign.donts)
    const targetCountriesList = formatListItems(campaign.target_countries)
    // The assets array is directly available as campaign.assets

    useEffect(() => {}, [])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{campaign.name}</DialogTitle>
                    <DialogDescription>Details for the campaign by **{campaign.brand_name}**</DialogDescription>
                </DialogHeader>

                {/* General Info and Financials */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4 text-sm">
                    <div className="md:col-span-1">
                        <h4 className="font-semibold text-neutral-700">Brand Name:</h4>
                        <p className="text-[#e85c51] font-medium">{campaign.brand_name}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-700">Creator User ID:</h4>
                        <p className="text-xs break-all">{campaign.created_by}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-700">Status:</h4>
                        {getStatusBadge(campaign.status)}
                    </div>
                    <Separator className="col-span-3 my-1" />
                    <div>
                        <h4 className="font-semibold text-neutral-700">Total Budget:</h4>
                        <p className="text-base font-bold">{campaign.budget || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-700">Payout per Creator:</h4>
                        <p className="text-base font-bold text-green-600">{campaign.payout}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-700">Max/Flat Fee:</h4>
                        <p className="text-base">{campaign.max_pay || campaign.flat_fee || 'N/A'}</p>
                    </div>
                </div>

                <Separator />

                {/* Campaign Brief Details */}
                <div className="space-y-6">
                    {/* Objectives */}
                    {objectivesList.length > 0 && (
                        <div className="p-3 bg-neutral-50 rounded-lg">
                            <h3 className="text-lg font-bold mb-2 text-[#e85c51]">Campaign Objectives</h3>
                            <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                                {objectivesList.map((obj, index) => (
                                    <li key={index}>{obj}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Description */}
                    {campaign.description && (
                        <div>
                            <h3 className="text-lg font-bold mb-2 text-[#e85c51]">Campaign Description</h3>
                            <p className="text-sm text-neutral-600">{campaign.description}</p>
                        </div>
                    )}

                    {/* Requirements / Deliverables */}
                    {requirementsList.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold mb-2 text-[#e85c51]">Key Requirements / Deliverables</h3>
                            <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                                {requirementsList.map((req, index) => (
                                    <li key={index}>{req}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ⭐ ASSETS SECTION: Added download attribute */}
                    {campaign.assets && campaign.assets.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold mb-2 text-[#e85c51]">Brand Assets/Files 📎</h3>
                            <div className="flex flex-wrap gap-3">
                                {campaign.assets.map((asset, index) => (
                                    <a
                                        key={index}
                                        href={asset.url}
                                        target="_blank"
                                        download={asset.name}
                                        className="block cursor-pointer items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors p-2 border rounded-md bg-white shadow-sm"
                                    >
                                        {/* Icon for file link */}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0014.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span>{asset.name || `Asset ${index + 1}`}</span>
                                        {/* Optional: Add file type badge */}
                                        {asset.type && (
                                            <Badge variant="outline" className="text-xs">
                                                {asset.type}
                                            </Badge>
                                        )}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* END ASSETS SECTION */}

                    {/* Do's and Don'ts */}
                    {(dosList.length > 0 || dontsList.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dosList.length > 0 && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <h4 className="font-semibold text-green-700 mb-2">Do's ✅</h4>
                                    <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                                        {dosList.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {dontsList.length > 0 && (
                                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                    <h4 className="font-semibold text-red-700 mb-2">Don'ts 🚫</h4>
                                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                                        {dontsList.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Other Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <h4 className="font-semibold text-neutral-700">Timeline:</h4>
                            <p className="text-sm text-neutral-600">{campaign.timeline || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-neutral-700">Quality Standard:</h4>
                            <p className="text-sm text-neutral-600">{campaign.quality_standard || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-neutral-700">Estimated Views:</h4>
                            <p className="text-sm text-neutral-600">
                                {campaign.estimated_views?.toLocaleString() || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-neutral-700">Number of Creators:</h4>
                            <p className="text-sm text-neutral-600">{campaign.num_creators || 'N/A'}</p>
                        </div>
                        {targetCountriesList.length > 0 && (
                            <div className="md:col-span-2">
                                <h4 className="font-semibold text-neutral-700">Target Countries:</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {targetCountriesList.map((country, index) => (
                                        <Badge key={index} variant="secondary">
                                            {country}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Additional Information */}
                    {campaign.additional_information && (
                        <div>
                            <h3 className="text-lg font-bold mb-2 text-[#e85c51]">Additional Information</h3>
                            <p className="text-sm text-neutral-600 italic">{campaign.additional_information}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4 flex flex-col sm:flex-row justify-end gap-2 pt-4">
                    {campaign.status === 'inreview' && (
                        <>
                            <Button
                                onClick={() => onAction(campaign.id, 'cancelled')}
                                variant="outline"
                                className="order-2 sm:order-1"
                            >
                                Reject
                            </Button>
                            <Button
                                onClick={() => onAction(campaign.id, 'approved')}
                                className="bg-[#e85c51] hover:bg-[#f3867e] text-white order-1 sm:order-2"
                            >
                                Approve
                            </Button>
                        </>
                    )}
                    <Button onClick={onClose} variant="default" className="order-3">
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            onClose()
                            onWillDeleteCampaign(campaign.id, campaign.name)
                        }}
                        variant="secondary"
                        className="order-3"
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

//================================================================================
//Delete Dialog For Campaign

// Fix 1: Accept a refresh callback, Fix 2: Capture and dismiss by toast ID
function confirmDeleteToast(
    campaignId: string,
    campaignName: string,
    onDeleted: () => void // ← new param
) {
    const toastId = toast(
        // ← capture the ID
        <div className="flex flex-col space-y-2">
            <p>
                Are you sure you want to delete <strong>{campaignName}</strong>? This action is irreversible.
            </p>
            <div className="flex space-x-2 mt-2">
                <button
                    className="px-3 py-1 bg-[#e85c51] text-white rounded"
                    onClick={async (e) => {
                        e.stopPropagation()
                        const { error } = await supabaseClient.from('campaigns').delete().eq('id', campaignId)

                        toast.dismiss(toastId) // ← dismiss by ID

                        if (error) {
                            console.log(`[ERROR-ADMIN]:${error.name}ErrorMessage${error.message}`)
                            toast.error('Failed to delete campaign')
                        } else {
                            toast.success('Campaign deleted successfully')
                            onDeleted() // ← refresh the list
                        }
                    }}
                >
                    Yes, delete
                </button>
                <button
                    className="px-3 py-1 bg-gray-300 rounded"
                    onClick={() => toast.dismiss(toastId)} // ← dismiss by ID
                >
                    Cancel
                </button>
            </div>
        </div>,
        { duration: Infinity }
    )
}

// =================================================================================================
// MAIN COMPONENT
// =================================================================================================
// =================================================================================================
// MAIN COMPONENT
// =================================================================================================
export default function CampaignManagementPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
    const [viewCampaignModal, setViewCampaignModal] = useState(false)
    const [filter, setFilter] = useState('inreview')

    useEffect(() => {
        fetchCampaigns()
    }, [filter])

    // ← Reset selected campaign when filter/tab changes
    useEffect(() => {
        setSelectedCampaign(null)
    }, [filter])

    const fetchCampaigns = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabaseClient
                .from('campaigns')
                .select(`*, brand_profiles(brand_name, logo_url)`)
                .eq('status', filter)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching campaigns:', error)
                toast.error('Failed to load campaigns.')
                return
            }

            const formattedCampaigns = data.map((c: any) => ({
                ...c,
                brand_name: c.brand_profiles?.brand_name || 'N/A',
                brand_logo_url: c.brand_profiles?.logo_url || null,
                estimated_views: c.estimated_views ? Number(c.estimated_views) : null,
                num_creators: c.num_creators ? Number(c.num_creators) : null,
            }))

            setCampaigns(formattedCampaigns as Campaign[])
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (campaignId: string, status: 'approved' | 'cancelled') => {
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()
        if (!user) {
            toast.error('Authentication error. Please sign in again.')
            return
        }

        const { error } = await supabaseClient
            .from('campaigns')
            .update({
                status: status,
                reviewed_by: user.id,
                approved_by: status === 'approved' ? user.id : null,
            })
            .eq('id', campaignId)

        if (error) {
            console.error('Error updating campaign status:', error)
            toast.error(`Failed to ${status} campaign.`)
        } else {
            toast.success(`Campaign ${status} successfully!`)
            fetchCampaigns()
            setViewCampaignModal(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500/10 text-green-500">Approved</Badge>
            case 'inreview':
                return <Badge className="bg-yellow-500/10 text-yellow-500">In Review</Badge>
            case 'cancelled':
                return <Badge className="bg-red-500/10 text-red-500">Cancelled</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Campaign Management</h1>

            {/* Tabs stay exactly as before */}
            <div className="flex justify-start">
                <Tabs
                    value={filter}
                    onValueChange={(value) => setFilter(value as 'inreview' | 'approved' | 'cancelled')}
                >
                    <TabsList>
                        <TabsTrigger value="inreview">Awaiting Review</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Dropdown */}
            <div className="max-w-md">
                <label className="text-sm font-medium text-neutral-600 mb-1 block">
                    Select a campaign ({campaigns.length} found)
                </label>
                <select
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e85c51]"
                    value={selectedCampaign?.id ?? ''}
                    onChange={(e) => {
                        const found = campaigns.find((c) => c.id === e.target.value) || null
                        setSelectedCampaign(found)
                    }}
                >
                    <option value="">-- Choose a campaign --</option>
                    {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name} — {c.brand_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* ← Full page detail view, no modal, no card */}
            {selectedCampaign ? (
                <div className="space-y-8">
                    {/* Cover Image */}
                    <div className="w-full aspect-[21/9] relative rounded-xl overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
                        <Image
                            src={
                                selectedCampaign.cover_image_url ||
                                selectedCampaign.brand_logo_url ||
                                `https://placehold.co/1200x400/e85c51/ffffff?text=${encodeURIComponent(
                                    selectedCampaign.name?.charAt(0) ?? 'C'
                                )}`
                            }
                            alt={selectedCampaign.name}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                            className="object-cover transition-transform duration-500 hover:scale-105"
                        />
                        {/* Gradient overlay so the title text below reads well against any image */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                        {/* Campaign name + brand overlaid at the bottom of the image */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                            <p className="text-xs uppercase tracking-widest text-white/70 mb-1">
                                {selectedCampaign.brand_name}
                            </p>
                            <h2 className="text-2xl md:text-3xl font-bold drop-shadow">{selectedCampaign.name}</h2>
                        </div>
                    </div>

                    {/* Title + Meta */}
                    {/* Actions row — status badge + buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {getStatusBadge(selectedCampaign.status)}
                            <span className="text-sm text-neutral-400">
                                Created {format(new Date(selectedCampaign.created_at), 'PPP')} at{' '}
                                {format(new Date(selectedCampaign.created_at), 'h:mm a')}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedCampaign.status === 'inreview' && (
                                <>
                                    <Button
                                        onClick={() => handleAction(selectedCampaign.id, 'cancelled')}
                                        variant="outline"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleAction(selectedCampaign.id, 'approved')}
                                        className="bg-[#e85c51] hover:bg-[#f3867e] text-white"
                                    >
                                        Approve
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    confirmDeleteToast(selectedCampaign.id, selectedCampaign.name, fetchCampaigns)
                                }
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                    <Separator />

                    {/* Financials */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-neutral-50 rounded-lg p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Total Budget</p>
                            <p className="text-xl font-bold mt-1">{selectedCampaign.budget || 'N/A'}</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Payout per Creator</p>
                            <p className="text-xl font-bold mt-1 text-green-600">{selectedCampaign.payout}</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Max / Flat Fee</p>
                            <p className="text-xl font-bold mt-1">
                                {selectedCampaign.max_pay || selectedCampaign.flat_fee || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Estimated Views</p>
                            <p className="text-xl font-bold mt-1">
                                {selectedCampaign.estimated_views?.toLocaleString() || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Objectives */}
                    {formatListItems(selectedCampaign.objectives).length > 0 && (
                        <div className="p-5 bg-neutral-50 rounded-xl">
                            <h3 className="text-lg font-bold mb-3 text-[#e85c51]">Campaign Objectives</h3>
                            <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                                {formatListItems(selectedCampaign.objectives).map((obj, i) => (
                                    <li key={i}>{obj}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Description */}
                    {selectedCampaign.description && (
                        <div>
                            <h3 className="text-lg font-bold mb-2 text-[#e85c51]">Campaign Description</h3>
                            <p className="text-sm text-neutral-600 leading-relaxed">{selectedCampaign.description}</p>
                        </div>
                    )}

                    {/* Requirements */}
                    {formatListItems(selectedCampaign.requirements).length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold mb-2 text-[#e85c51]">Key Requirements / Deliverables</h3>
                            <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                                {formatListItems(selectedCampaign.requirements).map((req, i) => (
                                    <li key={i}>{req}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Assets */}
                    {selectedCampaign.assets && selectedCampaign.assets.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold mb-3 text-[#e85c51]">Brand Assets / Files 📎</h3>
                            <div className="flex flex-wrap gap-3">
                                {selectedCampaign.assets.map((asset, i) => (
                                    <a
                                        key={i}
                                        href={asset.url}
                                        target="_blank"
                                        download={asset.name}
                                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline p-2 border rounded-md bg-white shadow-sm"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0014.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span>{asset.name || `Asset ${i + 1}`}</span>
                                        {asset.type && (
                                            <Badge variant="outline" className="text-xs">
                                                {asset.type}
                                            </Badge>
                                        )}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Do's and Don'ts */}
                    {(formatListItems(selectedCampaign.dos).length > 0 ||
                        formatListItems(selectedCampaign.donts).length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {formatListItems(selectedCampaign.dos).length > 0 && (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                    <h4 className="font-semibold text-green-700 mb-2">Do's ✅</h4>
                                    <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                                        {formatListItems(selectedCampaign.dos).map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {formatListItems(selectedCampaign.donts).length > 0 && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                    <h4 className="font-semibold text-red-700 mb-2">Don'ts 🚫</h4>
                                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                                        {formatListItems(selectedCampaign.donts).map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Other Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Timeline</p>
                            <p className="text-sm font-medium mt-1">{selectedCampaign.timeline || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Quality Standard</p>
                            <p className="text-sm font-medium mt-1">{selectedCampaign.quality_standard || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Number of Creators</p>
                            <p className="text-sm font-medium mt-1">{selectedCampaign.num_creators || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-wide">Creator User ID</p>
                            <p className="text-xs break-all mt-1 text-neutral-500">{selectedCampaign.created_by}</p>
                        </div>
                    </div>

                    {/* Target Countries */}
                    {formatListItems(selectedCampaign.target_countries).length > 0 && (
                        <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Target Countries</p>
                            <div className="flex flex-wrap gap-2">
                                {formatListItems(selectedCampaign.target_countries).map((country, i) => (
                                    <Badge key={i} variant="secondary">
                                        {country}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional Information */}
                    {selectedCampaign.additional_information && (
                        <div>
                            <h3 className="text-lg font-bold mb-2 text-[#e85c51]">Additional Information</h3>
                            <p className="text-sm text-neutral-600 italic">{selectedCampaign.additional_information}</p>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-neutral-500 text-sm">
                    {campaigns.length === 0
                        ? 'No campaigns found with this status.'
                        : 'Select a campaign from the dropdown above to view its details.'}
                </p>
            )}
        </div>
    )
}
