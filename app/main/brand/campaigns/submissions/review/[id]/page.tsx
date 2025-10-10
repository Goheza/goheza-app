'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'
import { toast } from 'sonner'
import { sendFeedbackToCreator } from '@/lib/ats/sendFeedbackToCreator'
import { removeStorageObject } from '@/lib/supabase/common/deleteStorageItems'

const supabase = supabaseClient

// SQL schema-aligned interfaces
interface RawSubmissionRow {
    id: string
    user_id: string
    campaign_id: string
    video_url: string
    caption: string | null
    file_name: string
    file_size: number
    status: 'pending' | 'approved' | 'rejected' | string
    submitted_at: string
    reviewed_by: string | null
    reviewed_at: string | null
    feedback: string | null 
    campaigns?: { name?: string; description?: string; payout?: string; requirements?: string[]; status?: string }
    creator_profiles?: { full_name?: string | null; email?: string | null }
}

interface DisplaySubmission {
    id: string
    campaign_id: string
    creator_name: string
    submission_date: string
    campaign_title: string
    campaign_description?: string
    status: 'pending' | 'approved' | 'rejected' | string
    video_url: string
    caption: string | null
    file_name: string
    file_size: number
    feedback: string | null
}

export default function ContentReviewPage() {
    const params = useParams()
    const router = useRouter()
    const submissionId = params?.id as string | undefined

    const [submission, setSubmission] = useState<DisplaySubmission | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState('') 
    const [actionLoading, setActionLoading] = useState(false)
    const [apsData, setApsData] = useState({
        campaign_brand: '',
        creator_profiles_email: '',
        campaigns_name: '',
    })

    useEffect(() => {
        if (!submissionId) {
            setError('No submission id provided')
            setLoading(false)
            return
        }

        const fetchSubmission = async () => {
            baseLogger('BRAND-OPERATIONS', `WillFetchCampaignSubmissionForReview:${submissionId}`)
            setLoading(true)
            setError(null)

            try {
                const { data, error } = await supabase
                    .from('campaign_submissions')
                    .select(
                        `
                            id,
                            user_id,
                            campaign_id,
                            video_url,
                            caption,
                            file_name,
                            file_size,
                            status,
                            submitted_at,
                            reviewed_by,
                            reviewed_at,
                            feedback, 
                            campaigns (
                                name,
                                description
                            ),
                            creator_profiles!campaign_submissions_creator_fkey ( 
                                full_name,
                                email
                            )
                        `
                    )
                    .eq('id', submissionId)
                    .single()

                if (error || !data) {
                    baseLogger('BRAND-OPERATIONS', `DidFailToFetchCampaignSubmissionForReview:${submissionId}`)
                    console.error('Error fetching submission:', error)
                    setError('Submission not found.')
                    return
                }

                baseLogger('BRAND-OPERATIONS', `DidFetchCampaignSubmissionForReview:${submissionId}`)

                const row = data as unknown as RawSubmissionRow

                const transformed: DisplaySubmission = {
                    id: row.id,
                    campaign_id: row.campaign_id,
                    creator_name:
                        row.creator_profiles?.full_name?.trim() || row.creator_profiles?.email || 'Unknown Creator',
                    submission_date: row.submitted_at,
                    campaign_title: row.campaigns?.name || 'Unknown Campaign',
                    campaign_description: row.campaigns?.description || undefined,
                    status: row.status,
                    video_url: row.video_url,
                    caption: row.caption,
                    file_name: row.file_name,
                    file_size: row.file_size,
                    feedback: row.feedback,
                }
                
                // Set existing feedback into the input state if it exists
                if (row.feedback) {
                    setFeedback(row.feedback);
                }

                setApsData({
                    campaign_brand: '',
                    campaigns_name: row.campaigns!.name!,
                    creator_profiles_email: row!.creator_profiles!.email!,
                })

                baseLogger('BRAND-OPERATIONS', `WillSetCampaignSubmissionForReview:${submissionId}`)
                setSubmission(transformed)
                baseLogger('BRAND-OPERATIONS', `DidSetCampaignSubmissionForReview:${submissionId}`)
            } catch (err) {
                console.error('Unexpected error:', err)
                setError('An unexpected error occurred.')
            } finally {
                setLoading(false)
            }
        }

        fetchSubmission()
    }, [submissionId])

    const handleDecision = async (decision: 'approved' | 'rejected') => {
        if (!submissionId || !submission) return
        
        // Check for feedback if rejecting
        if (decision === 'rejected' && !feedback.trim()) {
            toast.error('Feedback is required when rejecting a submission.')
            return
        }
        
        baseLogger('BRAND-OPERATIONS', `WillApproveOrRejectCampaignSubmissionForReview:${submissionId}`)
        setActionLoading(true)

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                toast.error('You must be logged in to review submissions')
                setActionLoading(false)
                return
            }

            // Prepare update data for the database
            const updateData: any = {
                status: decision,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                // Include feedback for both decisions. Will be null if approved and no feedback is provided.
                feedback: feedback.trim() || null, 
            }

            if (decision === 'approved') {
                // Update status + reviewer metadata + feedback
                const { error } = await supabase.from('campaign_submissions').update(updateData).eq('id', submissionId)

                if (error) {
                    baseLogger('BRAND-OPERATIONS', `FailedToApproveCampaignSubmissionForReview:${submissionId}`)
                    console.error('Error approving submission:', error)
                    toast.error('Failed to approve submission')
                    return
                }

                baseLogger(
                    'BRAND-OPERATIONS',
                    `ApprovedCampaignSubmissionForReview:${submissionId} reviewer:${user.id}`
                )

                // Send Approval notification to creator (includes optional feedback)
                sendFeedbackToCreator({
                    decision: decision,
                    campaignBrand: '',
                    creatorEmail: apsData.creator_profiles_email,
                    campaignName: apsData.campaigns_name,
                    feedback: feedback.trim(), 
                    message: '',
                })

                toast.success(`Submission approved successfully!`)

                // Redirect back to the campaign submissions list for this campaign
                router.push(`/main/brand/campaigns/${submission.campaign_id}`)
            } else {
                /**
                 * The Brand Rejected the Submission (This path currently deletes the entire submission)
                 */
                
                // 1. Send rejection notification to creator (Must be done before deletion)
                sendFeedbackToCreator({
                    decision: decision,
                    campaignBrand: '',
                    creatorEmail: apsData.creator_profiles_email,
                    campaignName: apsData.campaigns_name,
                    feedback: feedback.trim(), 
                    message: '',
                })
                
                // 2. Log status and feedback briefly before deletion (important for logging/history, though row will be removed)
                const { error: updateErr } = await supabase.from('campaign_submissions').update(updateData).eq('id', submissionId)
                if (updateErr) {
                    console.warn('Warning: Failed to log rejection status before deletion:', updateErr);
                }


                // 3. Attempt to remove storage objects
                baseLogger('BRAND-OPERATIONS', `WillDeleteRejectedSubmissionAssets:${submissionId}`)
                const removeResult = await removeStorageObject(submission.video_url, submission.file_name)
                baseLogger('BRAND-OPERATIONS', `RemoveStorageAttempt:${submissionId} , ${JSON.stringify(removeResult)}`)

                // 4. Delete the campaign_submissions row entirely
                try {
                    const { error: deleteErr } = await supabase
                        .from('campaign_submissions')
                        .delete()
                        .eq('id', submissionId)
                    if (deleteErr) {
                        baseLogger('BRAND-OPERATIONS', `FailedToDeleteCampaignSubmissionRow:${submissionId}`)
                        console.error('Error deleting submission row:', deleteErr)
                        toast.error('Failed to delete submission row from database')
                        // Do not return, continue to redirect
                    } else {
                        baseLogger('BRAND-OPERATIONS', `DeletedCampaignSubmissionRow:${submissionId}`)
                    }
                } catch (err) {
                    console.error('Unexpected error deleting submission row:', err)
                    toast.error('Unexpected error deleting submission row from database')
                }

                toast.success('Submission rejected and assets deleted. Creator notified.')

                // Redirect back to campaign list
                router.push(`/main/brand/campaigns/${submission.campaign_id}`)
            }
        } catch (err) {
            console.error('Unexpected error:', err)
            toast.error('An unexpected error occurred')
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'approved':
                return 'Approved'
            case 'rejected':
                return 'Rejected'
            case 'pending':
            default:
                return 'Pending Approval'
        }
    }

    const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (!bytes) return '0 Bytes'
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString()
        } catch {
            return dateString
        }
    }

    if (loading) return <div className="p-8">Loading...</div>
    if (error) return <div className="p-8 text-red-500">{error}</div>
    if (!submission) return <div className="p-8">Submission not found</div>

    return (
        <div className="p-8 max-w-7xl mx-auto bg-gray-50">
            <div className="mb-6">
                <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 mb-4">
                    ← Back to submissions
                </button>
                <div className="ml-6">
                    <h1 className="text-3xl font-bold ">Content Review</h1>
                    <p className="text-neutral-400 mt-4">Review and approve content submissions for the campaign</p>
                </div>
            </div>

            <div className="bg-white rounded-lg p-8 grid grid-cols-1 lg:grid-cols-2 gap-20">
                {/* Video Preview Section */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Submission Preview</h2>
                    <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden">
                        <video
                            controls
                            src={submission.video_url}
                            className="w-full h-full object-contain"
                            onError={() => {
                                console.error('Error loading video:', submission.video_url)
                            }}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>

                    <div className="mt-8">
                        <label htmlFor="feedback" className="block font-bold text-xl text-black mb-2">
                            Provide Feedback
                        </label>
                        <textarea
                            id="feedback"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            value={submission.status === 'pending' ? feedback : submission.feedback || ''}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder={"Detailed Feedback (Required for Rejection)"}
                            // Only allow editing when the status is 'pending'
                            disabled={submission.status !== 'pending'} 
                        />
                        {submission.status === 'pending' && (
                            <p className="text-xs text-gray-500 mt-1">
                                Feedback is required if you choose to **Reject** the submission. Approving with text here will save the feedback for administrative review.
                            </p>
                        )}
                        {submission.status !== 'pending' && submission.feedback && (
                             <p className="text-sm text-gray-600 mt-2">
                                Review Note: Submission status is **{submission.status}**. The saved feedback is displayed above.
                            </p>
                        )}
                    </div>
                </div>

                {/* Details and Actions Section */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-8">Submission Details</h2>
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <strong className="text-gray-400 font-medium">Creator:</strong>
                                <p className="text-gray-600">{submission.creator_name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <strong className="text-gray-400 font-medium">Campaign:</strong>
                                <p className="text-gray-600">{submission.campaign_title}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <strong className="text-gray-400 font-medium">Status:</strong>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium `}>
                                    {getStatusDisplay(submission.status)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <strong className="text-gray-400 font-medium">Submission Date:</strong>
                                <p className="text-gray-600">{formatDate(submission.submission_date)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <strong className="text-gray-400 font-medium">File Name:</strong>
                                <p className="text-gray-600">{submission.file_name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <strong className="text-gray-400 font-medium">File Size:</strong>
                                <p className="text-gray-600">{formatFileSize(submission.file_size)}</p>
                            </div>
                        </div>
                    </div>
                    {/* Caption Section */}
                    {submission.caption && (
                        <div className="mt-4">
                            <h3 className="f text-gray-400 font-medium mb-2">Caption:</h3>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded">{submission.caption}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {submission.status === 'pending' && (
                        <div className="flex space-y-4 flex-col">
                            <span className=" font-bold text-xl mb-4">Actions</span>
                            <button
                                onClick={() => handleDecision('approved')}
                                disabled={actionLoading}
                                className="flex-1 bg-[#f06262] text-white py-2 px-2 w-[290px] rounded-lg hover:bg-[#a55959] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {actionLoading ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                                onClick={() => handleDecision('rejected')}
                                disabled={actionLoading}
                                className="flex-1 bg-transparent border border-[#e75353] text-[#e85c51] py-2 px-2 w-[290px] rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {actionLoading ? 'Processing...' : 'Reject'}
                            </button>
                            <p className="text-xs text-red-500 mt-1 font-semibold">
                                NOTE: Rejecting a submission is a permanent action that will delete the submission video and the database record.
                            </p>
                        </div>
                    )}

                    {submission.status !== 'pending' && (
                        <div className="text-center p-4 bg-gray-100 rounded-lg">
                            <p className="text-gray-600">This submission has already been {submission.status}.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}