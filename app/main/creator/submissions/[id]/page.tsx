'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { XCircle, CheckCircle2, AlertCircle } from 'lucide-react'

type CommonStatusType = 'pending' | 'approved' | 'rejected'

const StatusBanner: React.FC<{ status: CommonStatusType }> = ({ status }) => {
    const getStatusStyles = (status: CommonStatusType) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
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
            case 'pending':
                return <AlertCircle className="w-5 h-5" />
            case 'rejected':
                return <XCircle className="w-5 h-5" />
            case 'approved':
                return <CheckCircle2 className="w-5 h-5" />
        }
    }

    return (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${getStatusStyles(status)}`}>
            {getIcon(status)}
            <span className="text-sm font-medium capitalize">{status}</span>
        </div>
    )
}

export default function SubmissionViewPage() {
    const router = useRouter()
    const params = useParams()
    const submissionId = params.id as string

    const [submission, setSubmission] = useState<any>(null)
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

                if (fetchError) {
                    throw new Error(fetchError.message)
                }

                if (!data) {
                    setError('Submission not found.')
                    return
                }

                setSubmission(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load submission details.')
                toast.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchSubmission()
    }, [submissionId, error])

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading submission details...</div>
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Error: {error}</div>
    }

    if (!submission) {
        return <div className="p-8 text-center text-gray-500">Submission details are not available.</div>
    }

    const isRejected = submission.status === 'rejected'

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">Submission Details</h1>
                <Button onClick={() => router.back()} className="mt-4 sm:mt-0 bg-gray-200 text-gray-800 hover:bg-gray-300">
                    Go Back
                </Button>
            </div>

            <div className="bg-white rounded-3xl  p-6 md:p-10 border border-gray-200">
                <div className="space-y-8">
                    {/* Header and Status Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <h2 className="text-2xl font-bold text-gray-900">{submission.campaign_name}</h2>
                        <div className="mt-4 sm:mt-0">
                            <StatusBanner status={submission.status as CommonStatusType} />
                        </div>
                    </div>

                    {/* Video Player Section */}
                    {submission.video_url && (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-300 ">
                            <video
                                src={submission.video_url}
                                controls
                                className="w-full h-full object-cover"
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}

                    {/* Details Cards Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700">Submitted On:</h3>
                            <p className="text-gray-900 mt-1">{new Date(submission.submitted_at).toLocaleDateString()}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700">Caption:</h3>
                            <p className="text-gray-900 mt-1 leading-relaxed">{submission.caption || 'No caption provided.'}</p>
                        </div>

                        {isRejected && submission.rejection_reason && (
                            <div className="bg-red-50 rounded-xl p-5 border border-red-200 md:col-span-2">
                                <h3 className="text-lg font-semibold text-red-700">Rejection Reason:</h3>
                                <p className="text-red-900 mt-1">{submission.rejection_reason}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}