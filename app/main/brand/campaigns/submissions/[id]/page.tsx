'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'

const supabase = supabaseClient

interface DisplaySubmission {
    id: string
    creator_name: string
    video_url: string
    status: 'pending' | 'approved' | 'rejected'
    submitted_at: string
}

export default function SubmissionsView() {
    const { id } = useParams() as { id: string } // 👈 grab param
    const [submissions, setSubmissions] = useState<DisplaySubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoading(true)
            try {
                baseLogger('BRAND-OPERATIONS', `WillFetchBrandSubmissionFrom:${id}`)
                const { data, error } = await supabase
                    .from('campaign_submissions')
                    .select(
                        ` id,
    campaign_id,
    video_url,
    caption,
    file_name,
    file_size,
    status,
    submitted_at,
    campaigns (
      name
    ),
    creator_profiles (
      full_name,
      email
    )`
                    )
                    .eq('campaign_id', id) // 👈 filter by campaignId
                    .order('submitted_at', { ascending: false })

                baseLogger('BRAND-OPERATIONS', `DidGetBrandSubmission:${data}`)

                if (error) {
                    baseLogger('BRAND-OPERATIONS', `DidFailToGetBrandSubmission:${data}`)

                    console.error('Error fetching submissions:', error)
                    setError('Failed to fetch submissions.')
                    return
                }

                const transformedData: DisplaySubmission[] = (data || []).map((s: any) => ({
                    id: s.id,
                    creator_name: s.creator_profiles?.full_name || s.creator_profiles?.email || 'Unknown Creator',
                    video_url: s.video_url,
                    status: s.status,
                    submitted_at: s.submitted_at,
                }))
                baseLogger('BRAND-OPERATIONS', `WillSetBrandSubmissions`)

                setSubmissions(transformedData)
                baseLogger('BRAND-OPERATIONS', `DidSetBrandSubmissionData`)
            } catch (err) {
                console.error('Unexpected error:', err)
                setError('An unexpected error occurred.')
            } finally {
                setLoading(false)
            }
        }

        console.log(id)
        if (id) {
            baseLogger('BRAND-OPERATIONS', 'WillFetchBrandSubmission--Start')
            fetchSubmissions()
        } else {
            baseLogger('BRAND-OPERATIONS', 'DidFailToFetchBrandSubmission--Start')
        }
    }, [id])

    const handleItemClick = (submissionId: string) => {
        router.push(`/main/brand/campaigns/submissions/review/${submissionId}`)
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-700'
            case 'rejected':
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-yellow-100 text-yellow-700'
        }
    }

    if (loading) return <div className="p-8 text-center">Loading submissions...</div>
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold mb-6">Submissions for Campaign</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.length > 0 ? (
                    submissions.map((submission) => (
                        <div
                            key={submission.id}
                            onClick={() => handleItemClick(submission.id)}
                            className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition"
                        >
                            <div className="relative w-full h-48 bg-gray-200 flex items-center justify-center">
                                <video
                                    src={submission.video_url}
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                    controls={false}
                                />
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-600">By {submission.creator_name}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(submission.submitted_at).toLocaleDateString()}
                                </p>
                                <span
                                    className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded ${getStatusStyle(
                                        submission.status
                                    )}`}
                                >
                                    {submission.status}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No submissions found for this campaign.</p>
                )}
            </div>
        </div>
    )
}
