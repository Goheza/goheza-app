'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { XCircle, CheckCircle2, AlertCircle, MessageSquare, ExternalLink } from 'lucide-react'
import { getTikTokVideoId } from '@/lib/appServiceData/social-media/tiktok/extract-video-id'


type CommonStatusType = 'draft' | 'admin_reject' | 'pending' | 'approved' | 'rejected'
const StatusBanner: React.FC<{ status: CommonStatusType }> = ({ status }) => {
    const getStatusStyles = (status: CommonStatusType) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-700 border-gray-300'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'admin_reject':
                return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
    const getIcon = (status: CommonStatusType) => {
        switch (status) {
            case 'draft':
            case 'pending':
                return <AlertCircle className="w-5 h-5" />
            case 'admin_reject':
            case 'rejected':
                return <XCircle className="w-5 h-5" />
            case 'approved':
                return <CheckCircle2 className="w-5 h-5" />
            default:
                return <AlertCircle className="w-5 h-5" />
        }
    }
    return (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${getStatusStyles(status)}`}>
            {getIcon(status)}
            <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
        </div>
    )
}
export default function SubmissionViewPage() {
    const router = useRouter()
    const params = useParams()
    const submissionId = params.id as string
    const [tiktokInput, setTiktokInput] = useState('')
    const [isSavingUrl, setIsSavingUrl] = useState(false);

    /**
     * 
     * Handle Save Tiktok URL
     * 
     * @returns 
     */
    const handleSaveTikTokUrl = async () => {
        if (!tiktokInput.trim()) {
            toast.error('Please paste your TikTok video URL.')
            return
        }
        setIsSavingUrl(true)
        try {
            const canonicalUrl = tiktokInput.trim();

            const videoId = await getTikTokVideoId(canonicalUrl)
            if (!videoId) {
                toast.error(
                    'Invalid TikTok URL. Please paste a full video link, e.g. https://www.tiktok.com/@handle/video/...'
                )
                return
            };

            const { error: submissionError } = await supabaseClient
                .from('campaign_submissions')
                .update({ tiktok_url: canonicalUrl })
                .eq('id', submissionId)
            if (submissionError) throw new Error('Failed to save TikTok URL.')
            const { data: userData, error: userError } = await supabaseClient.auth.getUser()
            if (userError || !userData.user) throw new Error('Authentication error.')
            const { error: postError } = await supabaseClient.from('campaign_posts').upsert(
                {
                    campaign_id: submission!.campaign_id,
                    user_id: userData.user.id,
                    platform: 'tiktok',
                    media_id: videoId,
                    permalink: canonicalUrl,
                    media_type: 'VIDEO',
                    status: 'PUBLISHED',
                    posted_at: new Date().toISOString(),
                },
                { onConflict: 'campaign_id, media_id' }
            )
            if (postError) throw new Error('Failed to register post for analytics.')
            const { data: sessionData } = await supabaseClient.auth.getSession()
            if (sessionData.session) {
                await fetch('/api/tiktok/submission-insights', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionData.session.access_token}`,
                    },
                    body: JSON.stringify({ submissionId }),
                })
            }
            toast.success('TikTok link saved successfully!')
            setSubmission((prev) => (prev ? { ...prev, tiktok_url: canonicalUrl } : prev))
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Something went wrong.'
            toast.error(message)
        } finally {
            setIsSavingUrl(false)
        }
    }
    type SubmissionType = {
        status: CommonStatusType
        campaign_name: string
        video_url: string
        submitted_at: string
        caption: string | null
        feedback: string | null
        tiktok_url: string | null
        campaign_id: string
        user_id: string
    } | null
    const [submission, setSubmission] = useState<SubmissionType>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    useEffect(() => {
        if (!submissionId) {
            setError('Submission ID not found.')
            setLoading(false)
            return
        }
        const fetchSubmission = async () => {
            setLoading(true)
            try {
                const { data, error: fetchError } = await supabaseClient
                    .from('campaign_submissions')
                    .select('*')
                    .eq('id', submissionId)
                    .single()
                if (fetchError) throw new Error(fetchError.message)
                if (!data) {
                    setError('Submission not found.')
                    return
                }
                setSubmission(data as SubmissionType)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load submission details.'
                setError(errorMessage)
                toast.error(errorMessage)
            } finally {
                setLoading(false)
            }
        }
        fetchSubmission()
    }, [submissionId])
    if (loading) return <div className="p-8 text-center text-gray-500">Loading submission details...</div>
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>
    if (!submission) return <div className="p-8 text-center text-gray-500">Submission details are not available.</div>
    const hasFeedback =
        (submission.status === 'rejected' || submission.status === 'admin_reject') && submission.feedback
    const isApprovedWithTikTok = submission.status === 'approved' && !!submission.tiktok_url
    const isApprovedAwaitingPost = submission.status === 'approved' && !submission.tiktok_url
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">Submission Details</h1>
                <Button
                    onClick={() => router.back()}
                    className="mt-4 sm:mt-0 bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                    Go Back
                </Button>
            </div>
            <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-200">
                <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{submission.campaign_name}</h2>
                        <div className="mt-4 sm:mt-0">
                            <StatusBanner status={submission.status as CommonStatusType} />
                        </div>
                    </div>
                    {isApprovedWithTikTok && (
                        <div className="bg-green-50 rounded-xl p-5 border border-green-300 shadow-sm flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <CheckCircle2 className="w-6 h-6 text-green-700 flex-shrink-0" />
                                <div>
                                    <h3 className="text-base font-bold text-green-800">
                                        Your video is live on TikTok!
                                    </h3>
                                    <p className="text-sm text-green-700">
                                        Your submission was approved and you've posted it.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(submission.tiktok_url!, '_blank')}
                                className="flex items-center gap-2 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors text-sm flex-shrink-0 ml-4"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View on TikTok
                            </button>
                        </div>
                    )}
                    {isApprovedAwaitingPost && (
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-300 shadow-sm space-y-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="text-base font-bold text-blue-800">
                                        Action required: Post your video to TikTok
                                    </h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        The brand has approved your submission. Please post the video to your TikTok
                                        account and paste the link below so we can track it.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="url"
                                    value={tiktokInput}
                                    onChange={(e) => setTiktokInput(e.target.value)}
                                    placeholder="https://www.tiktok.com/@yourhandle/video/..."
                                    className="flex-1 px-4 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                />
                                <button
                                    onClick={handleSaveTikTokUrl}
                                    disabled={isSavingUrl}
                                    className="bg-black text-white px-5 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                                >
                                    {isSavingUrl ? 'Saving...' : 'Submit Link'}
                                </button>
                            </div>
                        </div>
                    )}
                    {hasFeedback && (
                        <div className="bg-orange-50 rounded-xl p-5 border border-orange-300 shadow-sm flex items-start space-x-3">
                            <MessageSquare className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-orange-700">Reviewer Feedback:</h3>
                                <p className="text-orange-900 mt-1 leading-relaxed whitespace-pre-wrap">
                                    {submission.feedback}
                                </p>
                            </div>
                        </div>
                    )}
                    {submission.video_url && (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-300">
                            <video src={submission.video_url} controls className="w-full h-full object-cover">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700">Submitted On:</h3>
                            <p className="text-gray-900 mt-1">
                                {new Date(submission.submitted_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-700">Caption:</h3>
                            <p className="text-gray-900 mt-1 leading-relaxed whitespace-pre-wrap">
                                {submission.caption || 'No caption provided.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}