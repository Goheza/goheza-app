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
import { publishTikTokVideo } from '@/lib/appServiceData/social-media/tiktok/publish-video-tk'
import { getTitktokURL } from '@/lib/appServiceData/social-media/tiktok/get-titkurl'
import PostConfirmDialog from '@/components/workspace/pages/brand/PostConfiriming/PostConfirmingDialog'

const supabase = supabaseClient

interface IPublishableDataToPlatform {
    videoURL: string
    campaignId: string
    caption: string
    creatorId: string
    isReel: boolean
}

interface SubmissionUpdateData {
    status: 'approved' | 'rejected'
    reviewed_by: string
    reviewed_at: string
    feedback: string | null
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
    const [tiktokUrl, setTiktokUrl] = useState<string | null>(null)

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

        // Close dialog immediately to prevent double-submit
        setShowPostDialog(false)
        setPostLoading(true)

        try {
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
                const currentTiktokURL = await getTitktokURL(returnArgs.publishId)

                if (!currentTiktokURL) {
                    toast.error('Failed to retrieve TikTok URL after posting')
                    return
                }

                const { error: tiktokUrlError } = await supabase
                    .from('campaign_submissions')
                    .update({ tiktok_url: currentTiktokURL })
                    .eq('id', submissionId)

                if (tiktokUrlError) {
                    console.error('Error saving TikTok URL:', tiktokUrlError)
                    toast.error('Video posted but failed to save TikTok URL')
                    return
                }

                setTiktokUrl(currentTiktokURL)
                toast.success('Video successfully posted to TikTok!')
                router.push(
                    `/app/accounts/brand/campaigns/post-success?videoUrl=${encodeURIComponent(
                        currentTiktokURL
                    )}&campaignId=${dataToBeSubmitted.campaignId}`
                )
            } else {
                toast.error('Error posting video to TikTok')
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
            const updateData: SubmissionUpdateData = {
                status: decision,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                feedback: feedback.trim() || null,
            }

            if (decision === 'approved') {
                const { error } = await supabase.from('campaign_submissions').update(updateData).eq('id', submissionId)

                if (error) {
                    toast.error('Failed to approve submission')
                    return
                }

                setSubmission((prev) => (prev ? { ...prev, status: 'approved' } : prev))
                toast.success('Submission approved!')
            } else {
                const { error } = await supabase.from('campaign_submissions').update(updateData).eq('id', submissionId)

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
        const initializeReviewWorkspacePage = async () => {
            if (!submissionId) {
                setError('No submission id provided')
                setLoading(false)
                return
            }

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

                if ((row as any).tiktok_url) {
                    setTiktokUrl((row as any).tiktok_url)
                }

                setSubmission(mappedAndTransformedData)
            } catch (err) {
                console.error('Unexpected error:', err)
                setError('An unexpected error occurred.')
            } finally {
                setLoading(false)
            }
        }

        initializeReviewWorkspacePage()
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
                            value={feedback}
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
                        {submission.status !== 'pending' && feedback && (
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

                    {/* Pending Actions */}
                    {submission.status === 'pending' && (
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => handleDecisionConflict('approved')}
                                disabled={actionLoading}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                {actionLoading ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                                onClick={() => handleDecisionConflict('rejected')}
                                disabled={actionLoading}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                {actionLoading ? 'Processing...' : 'Reject'}
                            </button>
                        </div>
                    )}

                    {/* Already Reviewed State */}
                    {submission.status !== 'pending' && (
                        <div className="p-4 bg-gray-100 rounded-lg space-y-3">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                                        submission.status === 'approved'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {submission.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs">
                                This submission has already been reviewed and cannot be modified.
                            </p>

                            {submission.status === 'approved' && !tiktokUrl && (
                                <button
                                    onClick={() => setShowPostDialog(true)}
                                    disabled={postLoading}
                                    className="flex items-center gap-2 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
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
                            )}

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
