'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import SubmissionsContainer from '@/components/components/creator/submissions/submissions-container'
import { ISubmissionItem } from '@/components/components/creator/submissions/submission-item'
import { toast } from 'sonner'
import { baseLogger } from '@/lib/logger'
import { useRouter } from 'next/navigation'

export default function SubmissionsPage() {
    const router = useRouter()
    const [submissions, setSubmissions] = useState<ISubmissionItem[]>([])
    const [loading, setLoading] = useState(true)
    const [areSubmissionsAvailable, setAreSubmissionsAvailable] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const itemsPerPage = 10

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoading(true)
            const {
                data: { user },
                error: userError,
            } = await supabaseClient.auth.getUser()

            if (userError || !user) {
                setLoading(false)
                toast.error('You must be logged in to view submissions.')
                baseLogger("CREATOR-OPERATIONS", "No user is authenticated")
                router.push('/auth/login')
                return
            }

            try {
                baseLogger("CREATOR-OPERATIONS", "Fetching submissions for authenticated user")
                const { data, error } = await supabaseClient
                    .from('campaign_submissions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('submitted_at', { ascending: false })

                if (error) {
                    throw new Error(error.message)
                }

                if (data && data.length > 0) {
                    setAreSubmissionsAvailable(true)
                    const formattedSubmissions: ISubmissionItem[] = data.map((item) => ({
                        id: item.id,
                        campaignTitle: item.campaign_name,
                        status: item.status as ISubmissionItem['status'],
                        submissionDate: new Date(item.submitted_at).toLocaleDateString(),
                        videoUrl: item.video_url,
                        caption: item.caption,
                        rejectionReason: item.rejection_reason,
                        submissionDetailsLink:`/main/creator/submissions/${item.id}`
                    }))
                    setSubmissions(formattedSubmissions)
                } else {
                    setAreSubmissionsAvailable(false)
                }
            } catch (err) {
                console.error("Error fetching submissions:", err)
                toast.error("Failed to load submissions.")
            } finally {
                setLoading(false)
            }
        }

        fetchSubmissions()
    }, [router])

    const totalPages = Math.ceil(submissions.length / itemsPerPage)
    const startIndex = currentPage * itemsPerPage
    const currentSubmissions = submissions.slice(startIndex, startIndex + itemsPerPage)

    const handlePageChange = (pageIndex: number) => {
        setCurrentPage(pageIndex)
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading submissions...</div>
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <SubmissionsContainer
                submissions={currentSubmissions}
                areSubmissionAvailable={areSubmissionsAvailable}
            />

            {areSubmissionsAvailable && totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-4 py-2 border rounded-md disabled:opacity-50"
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index}
                            onClick={() => handlePageChange(index)}
                            className={`px-4 py-2 border rounded-md ${currentPage === index ? 'bg-blue-500 text-white' : 'bg-white'}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="px-4 py-2 border rounded-md disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}