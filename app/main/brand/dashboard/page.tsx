'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'
import NotificationsDialog from '@/components/components/brand/notifications'

interface Campaign {
    id: string
    name: string
    status: "approved" | "inreview" | "cancelled"
    budget: string
    createdAt: string
    submissionsCount: number
    approvedSubmissions: number
}

interface BrandProfile {
    id: string
    brandName: string
    email: string
}

export default function Dashboard() {
    const router = useRouter()
    const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
    const [activeCampaigns, setActiveCampaigns] = useState<number>(0)
    const [completedCampaigns, setCompletedCampaigns] = useState<number>(0)
    const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        const fetchBrandData = async () => {
            try {
                baseLogger('BRAND-OPERATIONS', 'WillGetAuthenticatedBrandUser')

                const {
                    data: { user },
                    error: userError,
                } = await supabaseClient.auth.getUser()

                if (userError || !user) {
                    throw new Error('Brand not authenticated')
                }

                baseLogger('BRAND-OPERATIONS', 'DidGetAuthenticatedBrandUser')
                baseLogger('BRAND-OPERATIONS', 'WillFetchBrandProfile')

                // Fetch brand profile
                const { data: profileData, error: profileError } = await supabaseClient
                    .from('brand_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (profileError) {
                    // If no brand profile exists, fallback to user data
                    setBrandProfile({
                        id: user.id,
                        brandName: user.user_metadata?.brand_name || user.email?.split('@')[0] || 'Brand',
                        email: user.email || '',
                    })
                } else {
                    baseLogger('BRAND-OPERATIONS', `DidFetchBrandProfile:${profileData}`)
                    baseLogger('BRAND-OPERATIONS', 'WillSetBrandProfile')

                    setBrandProfile({
                        id: profileData.id,
                        brandName: profileData.brand_name,
                        email: profileData.email || user.email || '',
                    })

                    baseLogger('BRAND-OPERATIONS', 'DidSetBrandProfile')
                }

                baseLogger('BRAND-OPERATIONS', 'WillFetchBrandCamapignsAndSubmission')

                // Fetch brand's campaigns with submission + approved counts
                const { data: campaignsData, error: campaignsError } = await supabaseClient
                    .from('campaigns')
                    .select(
                        `
                            id,
                            name,
                            status,
                            budget,
                            payout,
                            created_at,
                            campaign_submissions(count),
                            approved:campaign_submissions(count)
                            .eq(status, 'approved')
                        `
                    )
                    .eq('created_by', user.id)
                    .order('created_at', { ascending: false })

                if (campaignsError) {
                    throw new Error(campaignsError.message)
                }

                baseLogger('BRAND-OPERATIONS', `DidFetchBrandCampaigns:${campaignsData}`)

                const campaigns: Campaign[] = (campaignsData || []).map((campaign: any) => ({
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    budget: campaign.budget || campaign.payout || '-',
                    createdAt: new Date(campaign.created_at).toLocaleDateString(),
                    submissionsCount: campaign.campaign_submissions?.[0]?.count || 0,
                    approvedSubmissions: campaign.approved?.[0]?.count || 0,
                }))
                
                baseLogger('BRAND-OPERATIONS', 'WillSetBrandCampaigns')
                setRecentCampaigns(campaigns)
                baseLogger('BRAND-OPERATIONS', 'DidSetBrandCampaigns')


                /**
                 * Set the Active Campaigns as only the ones that have been approved
                 */

            

                let _approvedCampaigns = campaigns.filter((v)=>{
                    return v.status == "approved"
                });

                

                //@ts-ignore
                setActiveCampaigns(_approvedCampaigns.length)
            } catch (err) {
                console.error('Error fetching brand data:', err)
                setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }

        fetchBrandData()
    }, [])

    useEffect(() => {
        const init = async () => {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (!user) {
                router.replace('/main/auth/signin')
                return
            }
        }

        init()
    }, [router])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800'
            case 'cancelled':
                return 'bg-yellow-100 text-yellow-800'
            case 'completed':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const gotoCampaigns = () =>{
        router.push("/main/brand/campaigns")
    }

    const handleCreateCampaign = () => {
        router.push('/main/brand/campaigns/new')
    }

    const handleViewCampaignDetails = (campaignId: string) => {
        router.push(`/main/brand/campaigns/${campaignId}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto p-5">
                    {/* Skeleton shimmer */}
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="h-24 bg-gray-200 rounded"></div>
                            <div className="h-24 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto p-5">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-default">Error: {error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 px-4 py-2 bg-default text-white rounded hover:bg-hover"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="font-sans p-5 max-w-6xl mx-auto bg-white">
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome, {brandProfile?.brandName || 'Brand'}!</h1>
                <p className="text-gray-600">Here's an overview of your campaigns and performance.</p>
            </div>

            {/* New Campaign Button */}
            <div className="mb-8 flex justify-end w-full">
                <button
                    onClick={handleCreateCampaign}
                    className="bg-[#e93838] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#ff8080] transition-colors"
                >
                    New Campaign
                </button>
            </div>

            {/* Campaign Stats: Active Campaigns and Completed Campaigns UI elements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {/* Active Campaigns */}
                <div className="p-6 rounded-lg border transition-all bg-neutral-100 shadow-sm cursor-pointer hover:border-[#e93838]" onClick={gotoCampaigns}>
                    <h2 className="text-xl font-semibold text-gray-700">Active Campaigns</h2>
                    <p className="text-4xl font-bold text-[#e93838] mt-2">{activeCampaigns}</p>
                </div>
                {/* Completed Campaigns */}
                <div className="bg-neutral-100 p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-700">Completed Campaigns</h2>
                    <p className="text-4xl font-bold text-[#0a755e] mt-2">{completedCampaigns}</p>
                </div>
            </div>

            {/* Recent Campaigns Table */}
            <div className="bg-white p-6 rounded-lg border border-[#ee9d9d] shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Recent Campaigns</h2>
                {recentCampaigns.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                        Campaign Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                        Budget
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                        Submissions
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#e93838] uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentCampaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {campaign.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#e93838]">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                                    campaign.status
                                                )}`}
                                            >
                                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {campaign.budget}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="font-medium">{campaign.submissionsCount}</span>
                                            <span className="text-green-600 ml-1">
                                                ({campaign.approvedSubmissions} approved)
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {campaign.createdAt}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[#e93838] text-sm font-medium">
                                            <Link
                                                href={`/main/brand/campaigns/${campaign.id}`}
                                                className="text- hover:text-gray-900"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">You haven't created any campaigns yet.</p>
                        <button
                            onClick={handleCreateCampaign}
                            className="bg-[#e85c51] text-white px-6 py-2 rounded-lg hover:bg-[#e85c51]"
                        >
                            Create Your First Campaign
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}