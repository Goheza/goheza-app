'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { BrandProfile, Campaign, fetchBrandProfile, getBrandCampaigns } from '@/lib/appServiceData/brand/brandHelpers'

export default function BrandWorkspace() {

    
    const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
    const [activeCampaigns, setActiveCampaigns] = useState<number>(0)
    const [completedCampaigns, setCompletedCampaigns] = useState<number>(0)
    const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const router = useRouter()

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

    const gotoCampaigns = () => {
        router.push('/app/accounts/brand/campaigns')
    }

    const handleCreateCampaign = () => {
        router.push('/app/accounts/brand/campaigns/new')
    }

    useEffect(() => {
        const initalizeBrandWorkspace = async () => {
            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabaseClient.auth.getUser()

                if (!user) {
                    toast.error('Brand User Not Found...')
                    router.replace('/app/auth/signin')
                    return
                }

                /**
                 * Set the current data of the brand to be appropiate
                 */

                const brandData = await fetchBrandProfile(user.id)
                setBrandProfile({
                    id: brandData.id,
                    brandName: brandData.brandName,
                    email: brandData.email,
                })

                /**
                 * Get the current brand Campaigns
                 */

                const campaigns = await getBrandCampaigns(user.id)
                setRecentCampaigns(campaigns)

                /**
                 * Active Campaigns are approved Campaigns
                 */

                let approvedCampaigns = campaigns.filter((v) => {
                    return v.status == 'approved'
                })
                /**
                 * Set the current active campaigns
                 */
                setActiveCampaigns(approvedCampaigns.length)
            } catch (err) {
                console.error('Error fetching brand data:', err)
                setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }
        initalizeBrandWorkspace()
    }, [router])

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
                <div
                    className="p-6 rounded-lg border transition-all bg-neutral-100 shadow-sm cursor-pointer hover:border-[#e93838]"
                    onClick={gotoCampaigns}
                >
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
                                                href={`/app/accounts/brand/campaigns/${campaign.id}`}
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
