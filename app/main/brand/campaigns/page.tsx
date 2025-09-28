'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'
import { fetchBrandProfile } from '@/lib/supabase/common/getProfile'

// ⭐ NEW IMPORTS FOR SELECT DROPDOWN
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
// Assuming you have a standard Button component, though it's not used for the filter now
import { Button } from '@/components/ui/button' 

const supabase = supabaseClient

type CampaignStatus = 'all' | 'approved' | 'cancelled' | 'inreview' // 'all' is for no filter

interface Campaign {
    id: string
    name: string
    status: 'approved' | 'cancelled' | 'inreview'
    image_url: string | null
    created_at: string
}

// Define the filter options for mapping in the UI
const filterOptions: { value: CampaignStatus; label: string }[] = [
    { value: 'all', label: 'All Campaigns' },
    { value: 'inreview', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'cancelled', label: 'Rejected / Cancelled' },
]

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [campaignBrandLogo, setCampaignBrandLogo] = useState<string | undefined>('')
    // Default to 'all' to show all campaigns initially
    const [filterStatus, setFilterStatus] = useState<CampaignStatus>('all') 
    const router = useRouter()

    useEffect(() => {
        const fetchCurrentBrandProfile = async () => {
            const data = await fetchBrandProfile()
            let logo = data.logo_url! as string
            if (logo && logo.charAt(0)) {
                setCampaignBrandLogo(logo)
            }
        }
        fetchCurrentBrandProfile()
    }, [])
    
    // Wrapped in useCallback: Ensures stability for useEffect dependency
    const fetchCampaigns = useCallback(async () => {
        baseLogger('BRAND-OPERATIONS', `WillFetchCampaignsForCampaignsPage with status: ${filterStatus}`)
        setLoading(true)
        setError(null)
        
        let query = supabase
            .from('campaigns')
            .select('id, name, status, image_url, created_at')
            
        // CONDITIONAL FILTERING LOGIC
        if (filterStatus !== 'all') {
            query = query.eq('status', filterStatus) as any 
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
            baseLogger('BRAND-OPERATIONS', 'DidFailToFetchCampaignsForCampaignsPage')
            console.error('Error fetching campaigns:', error)
            setError('Failed to fetch campaigns.')
        } else {
            baseLogger('BRAND-OPERATIONS', 'DidFetchCampaignsForCampaignsPage')
            setCampaigns(data as Campaign[])
        }
        setLoading(false)
    }, [filterStatus]) // DEPENDENCY: Refetches campaigns when filterStatus changes

    // NEW useEffect: Calls fetchCampaigns whenever the filterStatus changes
    useEffect(() => {
        fetchCampaigns()
    }, [fetchCampaigns])


    const handleCampaignClick = (campaignId: string) => {
        baseLogger('BRAND-OPERATIONS', 'WillNavigateToCampaignsPage')
        router.push(`/main/brand/campaigns/${campaignId}`) 
    }
    
    // Helper to get the correct Tailwind classes for the status badge
    const getStatusClasses = (status: Campaign['status']) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800'
            case 'inreview':
                return 'bg-yellow-100 text-yellow-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800' 
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Loading campaigns...</div>
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
            <p className="text-gray-500 mb-6">View and manage all your campaigns.</p>

            {/* ⭐ DROPDOWN FILTER UI */}
            <div className="mb-8 flex justify-end">
                <Select
                    value={filterStatus}
                    // Casting to CampaignStatus is necessary here since Select's value is always a string
                    onValueChange={(value) => setFilterStatus(value as CampaignStatus)} 
                >
                    <SelectTrigger className="w-[200px] bg-white border">
                        {/* Display the currently selected filter label */}
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Map over the filter options to create the dropdown items */}
                        {filterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {/* END DROPDOWN FILTER UI */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            onClick={() => handleCampaignClick(campaign.id)}
                            className="bg-white rounded-lg border overflow-hidden cursor-pointer hover:shadow-lg transition"
                        >
                            <div className="relative w-full h-48 bg-gray-200">
                                <Image
                                    src={
                                        campaignBrandLogo || `https://placehold.co/400x225?text=${campaign.name.at(0)}`
                                    }
                                    alt={campaign.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-lg font-semibold">{campaign.name}</h2>
                                    <span
                                        className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusClasses(campaign.status)}`}
                                    >
                                        {/* Display 'Rejected' if status is 'cancelled' for better UX */}
                                        {campaign.status === 'cancelled' ? 'Rejected' : campaign.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Created: {new Date(campaign.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">
                        No campaigns found for the **
                        {filterOptions.find(opt => opt.value === filterStatus)?.label.toLowerCase() || 'selected'}** status.
                    </p>
                )}
            </div>
        </div>
    )
}