'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'

const supabase = supabaseClient

interface Campaign {
    id: string
    name: string
    status: 'approved' | 'cancelled' | 'inreview'
    image_url: string | null
    created_at: string
}

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchCampaigns = async () => {
            baseLogger('BRAND-OPERATIONS', 'WillFetchCampaignsForCampaignsPage')
            setLoading(true)
            const { data, error } = await supabase
                .from('campaigns')
                .select('id, name, status, image_url, created_at')
                .order('created_at', { ascending: false })

            if (error) {
                baseLogger('BRAND-OPERATIONS', 'DidFailToFetchCampaignsForCampaignsPage')

                console.error('Error fetching campaigns:', error)
                setError('Failed to fetch campaigns.')
            } else {
                baseLogger('BRAND-OPERATIONS', 'DidFetchCampaignsForCampaignsPage')

                setCampaigns(data as Campaign[])
            }
            setLoading(false)
        }

        fetchCampaigns()
    }, [])

    const handleCampaignClick = (campaignId: string) => {
            baseLogger("BRAND-OPERATIONS","WillNavigateToCampaignsPage")

        router.push(`/main/brand/campaigns/${campaignId}`) // 👈 sends param
    }

    if (loading) {
        return <div className="p-8 text-center">Loading campaigns...</div>
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold mb-6">Campaigns</h1>
            <p className="text-gray-500 mb-8">View and manage all your campaigns.</p>

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
                                    src={campaign.image_url || 'https://placehold.co/400x225?text=Zepha'}
                                    alt={campaign.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-lg font-semibold">{campaign.name}</h2>
                                    <span
                                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                                            campaign.status === 'approved'
                                                ? 'bg-green-100 text-green-800'
                                                : campaign.status === 'inreview'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {campaign.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Created: {new Date(campaign.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No campaigns found.</p>
                )}
            </div>
        </div>
    )
}
