// src/app/main/brand/campaigns/[id]/submissions/SubmissionsView.tsx

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, UploadCloud, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

type SubmissionStatus = 'pending' | 'approved' | 'rejected'
type CampaignStatus = 'inreview' | 'active' | 'approved' | 'closed' 

interface Submission {
    id: string
    user_id: string
    campaign_id: string
    status: SubmissionStatus
    // We only need basic display data here. The review page fetches full details.
    submitted_at: string // Maps to DB's 'submitted_at'
    creator_name: string
}

interface CampaignMeta {
    name: string
    max_submissions: number | null
    status: CampaignStatus
}

const SubmissionsView: React.FC = () => {
    const params = useParams()
    const router = useRouter()
    const campaignId = params.id as string

    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [campaignMeta, setCampaignMeta] = useState<CampaignMeta | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [approvedCount, setApprovedCount] = useState(0)

    // NOTE: The Campaign Close logic has been moved to the approval flow 
    // on the ContentReviewPage, but the utility remains here just in case 
    // a separate close action is added later.
    const closeCampaign = async () => {
        if (campaignMeta && (campaignMeta.status === 'active' || campaignMeta.status === 'approved')) {
            const { error } = await supabaseClient
                .from('campaigns')
                .update({ status: 'closed' })
                .eq('id', campaignId)
                .select()

            if (error) {
                toast.error('Campaign Closure Failed', {
                    description: 'Could not automatically close campaign: ' + error.message,
                })
            } else {
                setCampaignMeta((prev) => (prev ? { ...prev, status: 'closed' } : null))
            }
        }
    }

    const fetchSubmissionsAndMeta = useCallback(async () => {
        setLoading(true)
        setError(null)

        // 1. Fetch Campaign Meta
        const { data: metaData, error: metaError } = await supabaseClient
            .from('campaigns')
            .select('name, max_submissions, status')
            .eq('id', campaignId)
            .single()

        if (metaError) {
            setError('Failed to load campaign metadata: ' + metaError.message)
            setLoading(false)
            return
        }
        setCampaignMeta(metaData as CampaignMeta)

        // 2. Fetch Submissions and calculate count
        // FIX: Explicitly use the foreign key constraint name (campaign_submissions_creator_fkey)
        // to resolve the PostgREST relationship error.
        const { data: subsData, error: subsError } = await supabaseClient
            .from('campaign_submissions')
            .select(`
                id, user_id, campaign_id, status, submitted_at,
                creator_profiles!campaign_submissions_creator_fkey(full_name) 
            `)
            .eq('campaign_id', campaignId)
            .order('submitted_at', { ascending: false })


        if (subsError) {
            setError('Failed to load submissions: ' + subsError.message)
        } else {
            const formattedSubmissions: Submission[] = subsData.map((sub: any) => ({
                id: sub.id,
                user_id: sub.user_id,
                campaign_id: sub.campaign_id,
                status: sub.status,
                submitted_at: sub.submitted_at,
                creator_name: sub.creator_profiles?.full_name || 'Unknown Creator',
            }))

            const currentApprovedCount = formattedSubmissions.filter((sub) => sub.status === 'approved').length
            setApprovedCount(currentApprovedCount)
            setSubmissions(formattedSubmissions)
        }
        setLoading(false)
    }, [campaignId])

    useEffect(() => {
        fetchSubmissionsAndMeta()
        
        // Optional: Re-check campaign closure status if max_submissions is hit
        if (campaignMeta && campaignMeta.max_submissions && approvedCount >= campaignMeta.max_submissions) {
             closeCampaign()
        }

    }, [fetchSubmissionsAndMeta])

    const handleNavigateToReview = (submissionId: string) => {
        router.push(`/main/brand/campaigns/submissions/review/${submissionId}`)
    }

    if (loading) return <div className="text-center p-8">Loading submissions...</div>
    if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>
    if (!campaignMeta) return <div className="text-center p-8 text-red-600">Campaign details missing.</div>

    const maxSubmissions = campaignMeta.max_submissions
    const isLimited = maxSubmissions !== null && maxSubmissions > 0
    const submissionsClosed = campaignMeta.status === 'closed'
    const quotaMet = isLimited && approvedCount >= maxSubmissions
    const remainingSlots = isLimited ? maxSubmissions - approvedCount : null

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submissions for "{campaignMeta.name}"</h1>
            <p className="text-gray-600 mb-6">Review, approve, or reject content submitted by your creators.</p>

            {/* Submissions Status Panel */}
            <div
                className={`p-4 mb-6 rounded-lg flex justify-between items-center ${
                    submissionsClosed
                        ? 'bg-red-100 border border-red-400'
                        : quotaMet
                        ? 'bg-orange-100 border border-orange-400'
                        : 'bg-green-100 border border-green-400'
                }`}
            >
                <div className="flex items-center">
                    <AlertTriangle
                        className={`w-6 h-6 mr-3 ${submissionsClosed || quotaMet ? 'text-red-600' : 'text-green-600'}`}
                    />
                    <div>
                        <p className="font-semibold text-lg">
                            Approved Submissions: <span className="text-2xl font-bold">{approvedCount}</span>
                            {isLimited && <span className="text-gray-700 ml-2"> / {maxSubmissions}</span>}
                        </p>
                        <p className="text-sm">
                            {submissionsClosed
                                ? 'The campaign status is CLOSED. No further approvals or new submissions are allowed.'
                                : quotaMet
                                ? "Approval quota met. Approving any new submission requires rejecting an existing one. The campaign will remain OPEN until the status is 'closed'."
                                : isLimited
                                ? `You can approve ${remainingSlots} more submission(s). The campaign status will update upon final approval.`
                                : 'No submission limit is currently set for this campaign.'}
                        </p>
                    </div>
                </div>
                {submissionsClosed && (
                    <span className="font-bold text-red-800 bg-white px-3 py-1 rounded-full shadow-md">
                        CAMPAIGN CLOSED
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {submissions.length === 0 ? (
                    <div className="text-center p-10 bg-gray-50 rounded-lg border border-dashed">
                        <UploadCloud className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                        <p className="text-lg text-gray-500">No submissions have been received yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
                        {submissions.map((submission) => (
                            <div
                                key={submission.id}
                                className="p-4 bg-white hover:bg-gray-50 flex justify-between items-center transition-colors"
                            >
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-900">{submission.creator_name}</p>
                                    <p className="text-sm text-gray-500">
                                        Submitted: {format(new Date(submission.submitted_at), 'PPP')}
                                    </p>
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                                            submission.status === 'approved'
                                                ? 'bg-green-100 text-green-800'
                                                : submission.status === 'rejected'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                        {submission.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-3">
                                    {/* Link to the dedicated ContentReviewPage */}
                                    <button
                                        onClick={() => handleNavigateToReview(submission.id)}
                                        className="text-blue-600 hover:text-blue-800 transition-colors flex items-center text-sm font-semibold p-2 rounded-lg bg-blue-50 hover:bg-blue-100"
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> Review Content
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SubmissionsView