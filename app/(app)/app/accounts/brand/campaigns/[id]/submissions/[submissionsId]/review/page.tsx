'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    DisplaySubmission,
    fetchSubmissionById,
    mappedSubmissionsData,
    RawSubmissionRow,
} from '@/lib/appServiceData/brand/brandHelpers'
import { getAuthUser } from '@/lib/supabase/auth/authHelpers'
import { sendFeedbackToCreator } from '@/lib/appServiceData/sendFeedbackToCreator'
import PostConfirmDialog from '@/components/workspace/pages/brand/PostConfiriming/PostConfirmingDialog'
import { publishTikTokVideo } from '@/lib/appServiceData/social-media/tiktok/publish-video-tk'
import { getTitktokURL } from '@/lib/appServiceData/social-media/tiktok/get-titkurl'

const supabase = supabaseClient

interface IPublishableDataToPlatform {
    videoURL: string
    campaignId: string
    caption: string
    creatorId: string
    isReel: boolean
}

export default function ContentReviewWorkspace() {
    const params = useParams()
    const router = useRouter()
    const submissionId = params?.submissionsId as string | undefined
    const [submission, setSubmission] = useState<DisplaySubmission | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [feedback, setFeedback] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [showPostDialog, setShowPostDialog] = useState(false)
    const [postLoading, setPostLoading] = useState(false)
    const [tiktokUrl, setTiktokUrl] = useState<string | null>(null) // ← NEW
    const [campaignsDataBatch, setCampaignsDataBatch] = useState({
        campaign_brand: '',
        creator_profiles_email: '',
        campaigns_name: '',
    })

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800'
            case 'rejected':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-yellow-100 text-yellow-800'
        }
    }

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'approved':
                return 'Approved'
            case 'rejected':
                return 'Rejected'
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

    const handlePostToTikTok = async () => {
        if (!submissionId || !submission) return
        setPostLoading(true)
        try {
            const user = await getAuthUser()

            const updateData = {
                status: 'approved',
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                feedback: feedback.trim() || null,
            }

            const { error: updateError } = await supabase
                .from('campaign_submissions')
                .update(updateData)
                .eq('id', submissionId)

            if (updateError) {
                console.error('Error updating submission status:', updateError)
                toast.error('Failed to update submission status')
                return
            }

            const dataToBeSubmitted: IPublishableDataToPlatform = {
                videoURL: submission.video_url,
                campaignId: submission.campaign_id,
                caption: submission.caption ?? '',
                creatorId: submission.user_id,
                isReel: false,
            }

            const returnArgs = await publishTikTokVideo({
                campaignId: dataToBeSubmitted.campaignId,
                caption: dataToBeSubmitted.caption,
                creatorUserId: dataToBeSubmitted.creatorId,
                videoUrl: dataToBeSubmitted.videoURL,
            })

            if (returnArgs.success) {
                let currentTiktokURL = await getTitktokURL(returnArgs.publishId)

                // ← NEW: Save TikTok URL back to the submission row
                await supabase
                    .from('campaign_submissions')
                    .update({ tiktok_url: currentTiktokURL })
                    .eq('id', submissionId)

                // ← NEW: Update local state so the button appears immediately
                setTiktokUrl(currentTiktokURL)

                const tiktokSuccessPageData = {
                    videoURL: currentTiktokURL,
                    campaignID: dataToBeSubmitted.campaignId,
                }

                toast.success('Video successfully posted to TikTok!')
                setShowPostDialog(false)
                router.push(
                    `/app/accounts/brand/campaigns/post-success?videoUrl=${encodeURIComponent(
                        tiktokSuccessPageData.videoURL
                    )}&campaignId=${tiktokSuccessPageData.campaignID}`
                )
                router.push(`/app/accounts/brand/campaigns/${submission.campaign_id}/submissions`)
            } else {
                toast.error('Error Posting Video to Tiktok')
            }
        } catch (err) {
            console.error('Unexpected error posting to TikTok:', err)
            toast.error('An unexpected error occurred while posting to TikTok')
        } finally {
            setPostLoading(false)
        }
    }

    const handleDecisionConflict = async (decision: 'approved' | 'rejected') => {
        if (!submissionId || !submission) return
        if (decision === 'rejected' && !feedback.trim()) {
            toast.error('Feedback is required when rejecting a submission.')
            return
        }
        setActionLoading(true)
        try {
            const user = await getAuthUser()
            const updateData: any = {
                status: decision,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                feedback: feedback.trim() || null,
            }

            if (decision === 'approved') {
                const { error } = await supabase
                    .from('campaign_submissions')
                    .update(updateData)
                    .eq('id', submissionId)
                if (error) {
                    console.error('Error approving submission:', error)
                    toast.error('Failed to approve submission')
                    return
                }
            } else {
                const { error } = await supabase
                    .from('campaign_submissions')
                    .update(updateData)
                    .eq('id', submissionId)
                if (error) {
                    console.error('Error rejecting submission:', error)
                    toast.error('Failed to reject submission')
                    return
                }
                toast.success('Submission rejected and assets deleted. Creator notified.')
                router.push(`/app/accounts/brand/campaigns/${submission.campaign_id}/submissions`)
            }
        } catch (err) {
            console.error('Unexpected error:', err)
            toast.error('An unexpected error occurred')
        } finally {
            setActionLoading(false)
        }
    }

    useEffect(() => {
        const intializeReviewWorkspacePage = async () => {
            if (!submissionId) {
                setError('No submission id provided')
                setLoading(false)
                return
            }
            setLoading(false)
            setError(null)
            try {
                const submissionsData = await fetchSubmissionById(submissionId)
                if (!submissionsData.data) {
                    setError('Failed to Fetch Submissions Data')
                    return
                }
                const row = submissionsData.data as unknown as RawSubmissionRow
                const mappedAndTransformedData = mappedSubmissionsData(row)

                if (row.feedback) {
                    setFeedback(row.feedback)
                }

                // ← NEW: Hydrate tiktok_url from DB if it exists
                if ((row as any).tiktok_url) {
                    setTiktokUrl((row as any).tiktok_url)
                }

                setCampaignsDataBatch({
                    campaign_brand: '',
                    campaigns_name: row.campaigns?.name ?? '',
                    creator_profiles_email: row.creator_profiles?.email ?? '',
                })
                setSubmission(mappedAndTransformedData)
            } catch (err) {
                console.error('Unexpected error:', err)
                setError('An unexpected error occurred.')
            }
        }
        intializeReviewWorkspacePage()
    }, [submissionId])

    if (loading) return <div className="p-8">Loading...</div>
    if (error) return <div className="p-8 text-red-500">{error}</div>
    if (!submission) return <div className="p-8">Submission not found</div>

    return (
        <div className="p-8 max-w-7xl mx-auto bg-gray-50">
            <PostConfirmDialog
                isOpen={showPostDialog}
                creatorName={submission.creator_name}
                onConfirm={handlePostToTikTok}
                onCancel={() => setShowPostDialog(false)}
                isLoading={postLoading}
            />

            <div className="mb-6">
                <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 mb-4">
                    ← Back to submissions
                </button>
                <div className="ml-6">
                    <h1 className="text-3xl font-bold">Content Review</h1>
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
                            onError={() => console.error('Error loading video:', submission.video_url)}
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
                            placeholder="Detailed Feedback (Required for Rejection)"
                            disabled={submission.status !== 'pending'}
                        />
                        {submission.status === 'pending' && (
                            <p className="text-xs text-gray-500 mt-1">
                                Feedback is required if you choose to <strong>Reject</strong> the submission. Approving
                                with text here will save the feedback for administrative review.
                            </p>
                        )}
                        {submission.status !== 'pending' && submission.feedback && (
                            <p className="text-sm text-gray-600 mt-2">
                                Review Note: Submission status is <strong>{submission.status}</strong>. The saved
                                feedback is displayed above.
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
                                <span
                                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusStyles(
                                        submission.status
                                    )}`}
                                >
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

                    {submission.caption && (
                        <div className="mt-4">
                            <h3 className="text-gray-400 font-medium mb-2">Caption:</h3>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded">{submission.caption}</p>
                        </div>
                    )}

                    {submission.status === 'pending' && (
                        <div className="flex space-y-4 flex-col">
                            <span className="font-bold text-xl mb-4">Actions</span>
                            <button
                                onClick={() => handleDecisionConflict('approved')}
                                disabled={actionLoading || postLoading}
                                className="flex-1 bg-[#f06262] text-white py-2 px-2 w-[290px] rounded-lg hover:bg-[#a55959] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {actionLoading ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                                onClick={() => setShowPostDialog(true)}
                                disabled={actionLoading || postLoading}
                                className="flex-1 bg-black text-white py-2 px-2 w-[290px] rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="w-4 h-4 flex-shrink-0"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.22 8.22 0 004.79 1.52V6.81a4.85 4.85 0 01-1.02-.12z" />
                                </svg>
                                {postLoading ? 'Posting...' : 'Post to TikTok'}
                            </button>
                            <button
                                onClick={() => handleDecisionConflict('rejected')}
                                disabled={actionLoading || postLoading}
                                className="flex-1 bg-transparent border border-[#e75353] text-[#e85c51] py-2 px-2 w-[290px] rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {actionLoading ? 'Processing...' : 'Reject'}
                            </button>
                            <p className="text-xs text-red-500 mt-1 font-semibold">
                                NOTE: Rejecting a submission is a permanent action that will delete the submission video
                                and the database record.
                            </p>
                        </div>
                    )}

                    {/* ← UPDATED: Already reviewed state */}
                    {submission.status !== 'pending' && (
                        <div className="p-4 bg-gray-100 rounded-lg space-y-3">
                            <p className="text-gray-600 text-sm">
                                This submission has already been <strong>{submission.status}</strong>.
                            </p>
                            {tiktokUrl && (
                                <button
                                    onClick={() => window.open(tiktokUrl, '_blank')}
                                    className="flex items-center gap-2 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="white"
                                        className="w-4 h-4 flex-shrink-0"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.22 8.22 0 004.79 1.52V6.81a4.85 4.85 0 01-1.02-.12z" />
                                    </svg>
                                    View on TikTok
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}