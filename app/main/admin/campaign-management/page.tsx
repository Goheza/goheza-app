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

// Define the structure for an individual asset object in the JSONB array
type Asset = {
    file_url: string
    file_name: string
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

// Helper component for the Campaign Details Modal
const CampaignDetailsModal = ({
    campaign,
    isOpen,
    onClose,
    onAction,
    getStatusBadge,
}: {
    campaign: Campaign
    isOpen: boolean
    onClose: () => void
    onAction: (id: string, status: 'approved' | 'cancelled') => void
    //@ts-ignore
    getStatusBadge: (status: string) => JSX.Element
}) => {
    const requirementsList = formatListItems(campaign.requirements)
    const objectivesList = formatListItems(campaign.objectives)
    const dosList = formatListItems(campaign.dos)
    const dontsList = formatListItems(campaign.donts)
    const targetCountriesList = formatListItems(campaign.target_countries)
    // The assets array is directly available as campaign.assets

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
                                        href={asset.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        // ⭐ ENSURES DOWNLOAD: Forces the browser to download the file
                                        // This was already implemented in your code.
                                        download={asset.file_name} 
                                        className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors p-2 border rounded-md bg-white shadow-sm"
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
                                        <span>{asset.file_name || `Asset ${index + 1}`}</span>
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
                    <Button onClick={onClose} variant="secondary" className="order-3">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

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

    const fetchCampaigns = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabaseClient
                .from('campaigns')
                .select(
                    `
                    *,
                    brand_profiles(brand_name)
                    `
                )
                .eq('status', filter)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching campaigns:', error)
                toast.error('Failed to load campaigns.')
                return
            }

            console.log('received-campaign', data)

            // CRITICAL: Ensure `brand_name` is correctly mapped from the nested object
            const formattedCampaigns = data.map((c: any) => ({
                ...c,
                // Check if brand_profiles exists AND has a brand_name property
                brand_name: c.brand_profiles?.brand_name || 'N/A',
                // Assets are included here automatically by the spread operator `...c`
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

    const handleViewCampaign = (campaign: Campaign) => {
        setSelectedCampaign(campaign)
        setViewCampaignModal(true)
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                        <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-xl">{campaign.name}</CardTitle>
                                <div className="text-sm text-neutral-500">
                                    <p>
                                        By: <span className="font-medium text-neutral-700">{campaign.brand_name}</span>
                                    </p>
                                    <p>Created: {format(new Date(campaign.created_at), 'PPP')}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>{getStatusBadge(campaign.status)}</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-600 font-medium">Payout:</span>
                                    <span className="font-bold text-lg text-[#e85c51]">{campaign.payout}</span>
                                </div>
                                <Button
                                    onClick={() => handleViewCampaign(campaign)}
                                    className="w-full bg-[#e85c51] hover:bg-[#f3867e] text-white"
                                >
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p className="text-center text-neutral-500 col-span-full">No campaigns found with this status.</p>
                )}
            </div>

            {selectedCampaign && (
                <CampaignDetailsModal
                    campaign={selectedCampaign}
                    isOpen={viewCampaignModal}
                    onClose={() => setViewCampaignModal(false)}
                    onAction={handleAction}
                    getStatusBadge={getStatusBadge}
                />
            )}
        </div>
    )
}
