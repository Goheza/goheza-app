'use client'

import SearchItem from '@/components/components/creator/search-item'
import CampaignCard, { ICampaignCard } from '@/components/components/creator/opportunities-card'
import SubmissionsContainer from '@/components/components/creator/submissions/submissions-container'
import { useEffect, useState } from 'react'
import { ISubmissionItem } from '@/components/components/creator/submissions/submission-item'
import { supabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { baseLogger } from '@/lib/logger'

export default function CreatorDashboard() {
    const [allCampaigns, setAllCampaigns] = useState<ICampaignCard[]>([])
    const [campaigns, setCampaigns] = useState<ICampaignCard[]>([])
    const [submissions, setSubmissions] = useState<ISubmissionItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')

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
     * Load Submissions for current user
     */
    const onWillLoadSubmission = async () => {
        try {
            baseLogger('CREATOR-OPERATIONS', 'WillLookForLoggedInUSer')
            const {
                data: { user },
                error: userError,
            } = await supabaseClient.auth.getUser()

            if (userError || !user) throw new Error('User not authenticated')

            baseLogger('CREATOR-OPERATIONS', 'didFindLoggedInUser')
            baseLogger('CREATOR-OPERATIONS', 'WillSearchForCampaignSubmissions')

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

            if (submissionsError) throw new Error(submissionsError.message)

            baseLogger('CREATOR-OPERATIONS', `DidFindUserSubmission:${submissionsData}`)

            const mappedSubmissions: ISubmissionItem[] = submissionsData.map((submission) => ({
                campaignTitle: submission.campaign_name ?? submission.campaigns?.name,
                status:
                    submission.status === 'pending'
                        ? 'inreview'
                        : submission.status === 'approved'
                        ? 'approved'
                        : 'rejected',
                submissionDate: new Date(submission.submitted_at).toLocaleDateString(),
                submissionDetailsLink: `/main/creator/submissions/${submission.id}`,
            }))

            setSubmissions(mappedSubmissions)
            baseLogger('CREATOR-OPERATIONS', `DIdSetRetrievedSubmissions`)
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
            baseLogger('CREATOR-OPERATIONS', `WillRetrieveApprovedCampaigns`)

            const { data: campaignsData, error: campaignsError } = await supabaseClient
                .from('campaigns')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false })

            if (campaignsError) throw new Error(campaignsError.message)

            baseLogger("CREATOR-OPERATIONS",`DidRetrieveApprovedCampaigns`)


            const mappedCampaigns: ICampaignCard[] = campaignsData.map((campaign) => ({
                campaignSourceID: campaign.id,
                campaignImageSource: campaign.image_url || '/images/default-campaign.png',
                campaignName: campaign.name,
                campaignPayoutRange: campaign.payout,
                campaignTimeline: campaign.timeline || 'Flexible',
            }))

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
            await Promise.all([onWillLoadCampaigns(), onWillLoadSubmission()])
            setLoading(false)
        }

        init()
    }, [])

    const router = useRouter()

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <p className="text-lg text-gray-600">Loading dashboard...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
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
                                            setCampaigns(allCampaigns)
                                        }}
                                        className="mt-2 text-blue-600 hover:text-blue-700"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submissions */}
                    <SubmissionsContainer areSubmissionAvailable={submissions.length > 0} submissions={submissions} />
                </div>
            </main>
        </div>
    )
}
