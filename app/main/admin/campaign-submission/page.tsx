'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, parseISO } from 'date-fns'

// NEW: Updated status type to reflect the full workflow
type SubmissionStatus = 'draft' | 'admin_reject' | 'pending' | 'approved' | 'rejected' | 'posted'

// UPDATED: Added feedback field
type Submission = {
    id: string
    video_url: string
    caption: string
    status: SubmissionStatus
    submitted_at: string
    creator_name: string
    campaign_name: string
    brand_name: string
    feedback: string | null // Feedback field
}

export default function CampaignSubmissionsPage() {
    const [filter, setFilter] = useState<SubmissionStatus>('draft')
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)
    const [viewSubmissionModal, setViewSubmissionModal] = useState(false)
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
    const [adminFeedback, setAdminFeedback] = useState<string>('')
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    useEffect(() => {
        fetchSubmissions()
    }, [filter])

    const fetchSubmissions = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabaseClient
                .from('campaign_submissions')
                // UPDATED: Select the 'feedback' column
                .select(
                    `
                    id, video_url, caption, status, submitted_at, campaign_name, feedback,
                    creator_profiles(full_name),
                    campaigns(name, brand_profiles(brand_name))
                    `
                )
                .eq('status', filter)
                .order('submitted_at', { ascending: false })

            if (error) {
                console.error('Error fetching submissions:', error)
                toast.error('Failed to load submissions.')
                return
            }

            const formattedSubmissions: Submission[] = data.map((s: any) => ({
                ...s,
                creator_name: s.creator_profiles?.full_name || 'N/A',
                campaign_name: s.campaigns?.name || s.campaign_name || 'N/A',
                brand_name: s.campaigns?.brand_profiles?.brand_name || 'N/A',
                feedback: s.feedback || null,
            }))

            setSubmissions(formattedSubmissions)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (newStatus: SubmissionStatus) => {
        if (!selectedSubmission) return

        // 🔥 ENFORCEMENT: Check for feedback if rejecting
        if ((newStatus === 'admin_reject' || newStatus === 'rejected') && !adminFeedback.trim()) {
            toast.error('Feedback is required to reject a submission.')
            return
        }

        setIsUpdatingStatus(true)

        // Get Admin ID
        const { data: userData } = await supabaseClient.auth.getUser()
        const adminId = userData.user?.id

        if (!adminId) {
            toast.error('Authentication error. Admin user not found.')
            setIsUpdatingStatus(false)
            return
        }

        const toastMessage =
            newStatus === 'pending'
                ? 'Approving submission for Brand review...'
                : 'Rejecting submission and sending feedback...'

        toast.info(toastMessage)

        // UPDATED: Prepare the update object
        const updateObject: {
            status: SubmissionStatus
            reviewed_by: string
            reviewed_at: string
            feedback?: string | null
        } = {
            status: newStatus,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
        }

        // Logic for handling the feedback field
        if (newStatus === 'admin_reject' || newStatus === 'rejected') {
            // If rejecting, use the admin's input feedback
            updateObject.feedback = adminFeedback.trim()
        } else if (selectedSubmission.feedback) {
            // If moving to a non-rejected state (e.g., 'pending') and there was old feedback, clear it.
            updateObject.feedback = null
        }
        // Note: If approved/posted, we don't need to send feedback unless we're explicitly clearing old feedback (handled above).

        const { error } = await supabaseClient
            .from('campaign_submissions')
            .update(updateObject)
            .eq('id', selectedSubmission.id)

        if (error) {
            console.error('Error updating status:', error)
            toast.error(`Failed to update status to ${newStatus}.`)
        } else {
            const successMessage =
                newStatus === 'pending'
                    ? 'Submission approved and moved to Brand review (Pending).'
                    : `Submission rejected. Feedback sent to Creator.`
            toast.success(successMessage)
            fetchSubmissions()
            setViewSubmissionModal(false)
        }
        setIsUpdatingStatus(false)
    }

    const handleFinalPost = async () => {
        if (!selectedSubmission || selectedSubmission.status !== 'approved') return

        toast.info('Scheduling post...')
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // PRODUCTION NOTE: Uncomment the real Supabase update here:
        /*
        // const { error } = await supabaseClient
        //    .from('campaign_submissions')
        //    .update({ status: 'posted' })
        //    .eq('id', selectedSubmission.id)

        // if (error) {
        //    console.error('Error scheduling post:', error)
        //    toast.error('Failed to schedule post.')
        // } else {
        //    toast.success('Post scheduled successfully!')
        //    fetchSubmissions()
        //    setViewSubmissionModal(false)
        // }
        */
        toast.success('Post scheduled successfully! (Simulated)')
        fetchSubmissions()
        setViewSubmissionModal(false)
    }

    const handleViewSubmission = (submission: Submission) => {
        setSelectedSubmission(submission)
        // Set the feedback input field to the existing feedback or empty string for editing
        setAdminFeedback(submission.feedback || '')
        setViewSubmissionModal(true)
    }

    const getStatusBadge = (status: SubmissionStatus) => {
        switch (status) {
            case 'draft':
                return <Badge className="bg-orange-500/10 text-orange-600 border-orange-300">New Draft</Badge>
            case 'pending':
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-300">Pending (Brand Review)</Badge>
                )
            case 'approved':
                return <Badge className="bg-green-500/10 text-green-600 border-green-300">Brand Approved</Badge>
            case 'rejected':
                return <Badge className="bg-red-500/10 text-red-600 border-red-300">Brand Rejected</Badge>
            case 'admin_reject':
                return <Badge className="bg-gray-500/10 text-gray-600 border-gray-300">Admin Rejected</Badge>
            case 'posted':
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-300">Posted</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Campaign Submissions (Admin Review)</h1>
            <div className="flex justify-start">
                <Tabs value={filter} onValueChange={(value) => setFilter(value as SubmissionStatus)}>
                    <TabsList>
                        <TabsTrigger value="draft">New Submissions (Draft)</TabsTrigger>
                        <TabsTrigger value="pending">Brand Review (Pending)</TabsTrigger>
                        <TabsTrigger value="approved">Brand Approved</TabsTrigger>
                        <TabsTrigger value="admin_reject">Admin Rejected</TabsTrigger>
                        <TabsTrigger value="rejected">Brand Rejected</TabsTrigger>
                        <TabsTrigger value="posted">Posted</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Creator</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.length > 0 ? (
                            submissions.map((submission) => (
                                <TableRow key={submission.id}>
                                    <TableCell className="font-medium">{submission.campaign_name}</TableCell>
                                    <TableCell>{submission.creator_name}</TableCell>
                                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                                    <TableCell>{format(parseISO(submission.submitted_at), 'PPP')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            onClick={() => handleViewSubmission(submission)}
                                            variant="ghost"
                                            className="bg-[#e85c51]/10 text-[#e85c51] hover:bg-[#e85c51]/20"
                                        >
                                            Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-neutral-500 py-10">
                                    No submissions found with this status.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Submission Review Modal */}
            {selectedSubmission && (
                <Dialog open={viewSubmissionModal} onOpenChange={setViewSubmissionModal}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Submission for {selectedSubmission.campaign_name}</DialogTitle>
                            <DialogDescription>
                                Submitted by {selectedSubmission.creator_name} for {selectedSubmission.brand_name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="my-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Video Player */}
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                <video
                                    key={selectedSubmission.video_url}
                                    controls
                                    src={selectedSubmission.video_url}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            {/* Creator's Caption */}
                            <div>
                                <h3 className="text-lg font-bold mb-1">Creator's Caption</h3>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                    {selectedSubmission.caption || 'No caption provided.'}
                                </p>
                            </div>
                            {/* Submitted Date */}
                            <p className="text-sm text-neutral-500">
                                Submitted: {format(parseISO(selectedSubmission.submitted_at), 'PPP')}
                            </p>
                            {/* Current Status */}
                            <div className="mt-4">
                                <h3 className="text-lg font-bold mb-1">Current Status</h3>
                                {getStatusBadge(selectedSubmission.status)}
                            </div>

                            {/* Conditional Display of Existing Feedback */}
                            {(selectedSubmission.status === 'admin_reject' ||
                                selectedSubmission.status === 'rejected') &&
                                selectedSubmission.feedback && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <h3 className="text-md font-semibold text-red-700 mb-1">
                                            Existing Rejection Feedback:
                                        </h3>
                                        <p className="text-sm text-red-800 whitespace-pre-wrap">
                                            {selectedSubmission.feedback}
                                        </p>
                                    </div>
                                )}

                            {/* Admin Feedback Input Area - visible for relevant statuses */}
                            {selectedSubmission.status !== 'approved' && selectedSubmission.status !== 'posted' && (
                                <div>
                                    <h3 className="text-lg font-bold mb-2">Reviewer Feedback</h3>
                                    <Textarea
                                        placeholder="Enter detailed feedback for the creator (required for rejection)..."
                                        value={adminFeedback}
                                        onChange={(e) => setAdminFeedback(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            )}
                        </div>
                        <DialogFooter className="flex justify-between sm:justify-between">
                            {/* Admin Review Actions - visible only for 'draft' submissions */}
                            {selectedSubmission.status === 'draft' && (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleUpdateStatus('admin_reject')}
                                        variant="destructive"
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={isUpdatingStatus}
                                    >
                                        Reject (Admin)
                                    </Button>
                                    <Button
                                        onClick={() => handleUpdateStatus('pending')}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        disabled={isUpdatingStatus}
                                    >
                                        Approve (Move to Brand)
                                    </Button>
                                </div>
                            )}

                            {/* Existing action for Brand-approved submissions */}
                            {selectedSubmission.status === 'approved' && (
                                <Button
                                    onClick={handleFinalPost}
                                    className="bg-[#e85c51] hover:bg-[#f3867e] text-white"
                                    disabled={isUpdatingStatus}
                                >
                                    Schedule Post
                                </Button>
                            )}

                            {/* Close Button */}
                            <Button onClick={() => setViewSubmissionModal(false)} variant="secondary">
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
