'use client'

import SearchItem from '@/components/components/creator/search-item'
import CampaignCard, { ICampaignCard } from '@/components/components/creator/opportunities-card'
import { useEffect, useState } from 'react'
import { ISubmissionItem } from '@/components/components/creator/submissions/submission-item'
import { supabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { baseLogger } from '@/lib/logger'
import NoCampaignsBanner from '@/components/components/creator/no-campaign'

export default function CreatorCampaigns() {
    const [allCampaigns, setAllCampaigns] = useState<ICampaignCard[]>([])
    const [campaigns, setCampaigns] = useState<ICampaignCard[]>([])
    const [submissions, setSubmissions] = useState<ISubmissionItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const router = useRouter()

    const handleUserSearchRequest = (userInputValue: string) => {
        setSearchQuery(userInputValue)
        filterCampaigns(userInputValue)
    }

    const filterCampaigns = (query: string) => {
        if (!query.trim()) {
            setCampaigns(allCampaigns)
            return
        }

        const filteredCampaigns = allCampaigns.filter((campaign) =>
            campaign.campaignName.toLowerCase().includes(query.toLowerCase())
        )
        setCampaigns(filteredCampaigns)
    }

 

    /**
     * Load Available Campaigns (UPDATED FOR LOGO)
     */
    const onWillLoadCampaigns = async () => {
        try {
            baseLogger('CREATOR-OPERATIONS', `WillRetrieveApprovedCampaigns`)

            const { data: campaignsData, error: campaignsError } = await supabaseClient
                .from('campaigns')
                .select(
                    `
                    *,
                    brand_profiles(logo_url)  
                    `
                    // Assuming 'campaigns' has a foreign key to 'brand_profiles' 
                    // named 'brand_profile_id' or automatically linked via 'created_by' to 'user_id'
                )
                .eq('status', 'approved')
                .order('created_at', { ascending: false })

            if (campaignsError) throw new Error(campaignsError.message)

            baseLogger("CREATOR-OPERATIONS", `DidRetrieveApprovedCampaigns`)

            const mappedCampaigns: ICampaignCard[] = campaignsData.map((campaign: any) => {
                
                // Logic to prioritize image_url, then brand_profiles.logo_url, then default
                const imageSource = 
                    campaign.image_url || 
                    campaign.brand_profiles?.logo_url || 
                    null

                return {
                    campaignSourceID: campaign.id,
                    campaignImageSource: imageSource,
                    campaignName: campaign.name,
                    campaignPayoutRange: campaign.payout,
                    campaignTimeline: campaign.timeline || 'Flexible',
                };
            })

            setAllCampaigns(mappedCampaigns)
            setCampaigns(mappedCampaigns)
        } catch (err) {
            console.error('Error loading campaigns:', err)
            setError(err instanceof Error ? err.message : 'Failed to load campaigns')
        }
    }

    useEffect(() => {
        const init = async () => {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (!user) {
                router.replace('/main/auth/signin')
                return
            }

            setLoading(true)
            // Removed onWillLoadSubmission from Promise.all to simplify for this task, 
            // but you should include it if you still need submission data on this page.
            await Promise.all([onWillLoadCampaigns()]) 
            setLoading(false)
        }

        init()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <p className="text-lg text-gray-600">Loading Campaigns...</p>
            </div>
        )
    }

    if (error) {
        // ... (Error UI remains the same)
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-[#e85c51]">Error: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-[#e85c51] text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold text-gray-900 mb-2">New Campaigns</h1>
                        <p className="text-gray-600">Explore new campaigns from brands</p>
                    </div>

                    <SearchItem onDidEnterUserInput={handleUserSearchRequest} />

                    {/* Campaigns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                        {campaigns.length > 0 ? (
                            campaigns.map((val) => <CampaignCard key={val.campaignSourceID} {...val} />)
                        ) : (
                            <div className="col-span-full">
                                {searchQuery ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">
                                            No campaigns found matching your search.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setCampaigns(allCampaigns);
                                            }}
                                            className="mt-2 text-blue-600 hover:text-blue-700"
                                        >
                                            Clear search
                                        </button>
                                    </div>
                                ) : (
                                    <NoCampaignsBanner />
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}