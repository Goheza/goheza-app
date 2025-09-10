'use client'
import HeaderItemMain from '@/components/components/common/header/header'
import HeaderCreator from '@/components/components/creator/header-creator'
import SearchItem from '@/components/components/creator/search-item'
import CampaignCard, { ICampaignCard } from '@/components/components/creator/opportunities-card'
import SubmissionsContainer from '@/components/components/creator/submissions/submissions-container'
import { useEffect, useState } from 'react'
import { ISubmissionItem } from '@/components/components/creator/submissions/submission-item'
import  {supabaseClient} from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'


export default function CreatorDashboard() {
    /**
     * The Available Campaigns posted by the brands
     */
    const [campaigns, setCampaigns] = useState<ICampaignCard[]>([])
    /**
     * The current user Submissions
     */
    const [submissions, setSubmission] = useState<ISubmissionItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')

    const handleUserSearchRequest = (userInputValue: string) => {
        setSearchQuery(userInputValue)
        filterCampaigns(userInputValue)
    }

    const filterCampaigns = (query: string) => {
        if (!query.trim()) {
            // If no search query, reload all campaigns
            onWillLoadCampaigns()
            return
        }

        // Filter campaigns based on search query
        const filteredCampaigns = campaigns.filter((campaign) =>
            campaign.campaignName.toLowerCase().includes(query.toLowerCase())
        )
        setCampaigns(filteredCampaigns)
    }

    /**
     * Load Submissions for current user
     */
    const onWillLoadSubmission = async () => {
        try {
            // Get current authenticated user
            const {
                data: { user },
                error: userError,
            } = await supabaseClient.auth.getUser()

            if (userError || !user) {
                throw new Error('User not authenticated')
            }

            // Fetch user's submissions
            const { data: submissionsData, error: submissionsError } = await supabaseClient
                .from('campaign_submissions')
                .select(
                    `
                    *,
                    campaigns (
                        name,
                        payout
                    )
                `
                )
                .eq('user_id', user.id)
                .order('submitted_at', { ascending: false })

            if (submissionsError) {
                throw new Error(submissionsError.message)
            }

            // Map to ISubmissionItem format
            const mappedSubmissions: ISubmissionItem[] = submissionsData.map((submission) => ({
                campaignTitle: submission.campaign_name,
                status:
                    submission.status === 'pending'
                        ? 'inreview'
                        : submission.status === 'approved'
                        ? 'approved'
                        : 'feedback needed',
                submissionDate: new Date(submission.submitted_at).toLocaleDateString(),
                submissionDetailsLink: `/creator/submissions/${submission.id}`,
            }))

            setSubmission(mappedSubmissions)
        } catch (err) {
            console.error('Error loading submissions:', err)
            setError(err instanceof Error ? err.message : 'Failed to load submissions')
        }
    }

    /**
     * Load Available Campaigns
     */
    const onWillLoadCampaigns = async () => {
        try {
            // Fetch active campaigns
            const { data: campaignsData, error: campaignsError } = await supabaseClient
                .from('campaigns')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false })

            if (campaignsError) {
                throw new Error(campaignsError.message)
            }
            console.log("available-campaigns",campaignsData)

            // Map to ICampaignCard format (adjust based on your interface)
            const mappedCampaigns: ICampaignCard[] = campaignsData.map((campaign) => ({
                campaignSourceID: campaign.id,
                campaignImageSource: campaign.image_url || '/images/default-campaign.png', // Add image_url to campaigns table if needed
                campaignName: campaign.name,
                campaignPayoutRange: campaign.payout,
                campaignTimeline: campaign.timeline || 'Flexible', // Add timeline field if needed
                // Add any other fields your ICampaignCard interface requires
            }))

            setCampaigns(mappedCampaigns)
        } catch (err) {
            console.error('Error loading campaigns:', err)
            setError(err instanceof Error ? err.message : 'Failed to load campaigns')
        }
    }

    useEffect(() => {
        const onWillInitialize = async () => {
            setLoading(true)
            await Promise.all([onWillLoadCampaigns(), onWillLoadSubmission()])
            setLoading(false)
        }


        onWillInitialize()
    }, []) // Added dependency array

    const router = useRouter()
     useEffect(() => {
            const init = async () => {
                const {
                    data: { user },
                } = await supabaseClient.auth.getUser()
    
                if (!user) {
                    router.replace('/auth/signin')
                    return
                }
                   
            }
    
            init()
        },[router])

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-center items-center h-64">
                            <p className="text-lg text-gray-600">Loading dashboard...</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600">Error: {error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold text-gray-900 mb-2">New Opportunities</h1>
                        <p className="text-gray-600">Explore new opportunities from brands</p>
                    </div>
                    <SearchItem onDidEnterUserInput={handleUserSearchRequest} />

                    {/* Opportunities Grid Campaigns Available */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                        {campaigns.length > 0 ? (
                            campaigns.map((val, idx) => (
                                <CampaignCard
                                    key={val.campaignSourceID}
                                    campaignSourceID={val.campaignSourceID}
                                    campaignImageSource={val.campaignImageSource}
                                    campaignName={val.campaignName}
                                    campaignPayoutRange={val.campaignPayoutRange}
                                    campaignTimeline={val.campaignTimeline}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500">
                                    {searchQuery
                                        ? 'No campaigns found matching your search.'
                                        : 'No campaigns available at the moment.'}
                                </p>
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('')
                                            onWillLoadCampaigns()
                                        }}
                                        className="mt-2 text-blue-600 hover:text-blue-700"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Your Submissions Section */}
                    <SubmissionsContainer areSubmissionAvailable={submissions.length > 0} submissions={submissions} />
                </div>
            </main>
        </div>
    )
}
