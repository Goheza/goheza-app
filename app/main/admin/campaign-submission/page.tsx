'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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

type Submission = {
    id: string
    video_url: string
    caption: string
    status: 'pending' | 'approved' | 'rejected' // Added 'posted' to the type
    submitted_at: string
    creator_name: string
    campaign_name: string
    brand_name: string
}

export default function CampaignSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('approved')
    const [viewSubmissionModal, setViewSubmissionModal] = useState(false)
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

    useEffect(() => {
        fetchSubmissions()
    }, [filter])

    const fetchSubmissions = async () => {
        setLoading(true)
        try {
            // Corrected the Supabase query to correctly get the brand name
            const { data, error } = await supabaseClient
                .from('campaign_submissions')
                .select(
                    `
                    *,
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

            const formattedSubmissions = data.map((s: any) => ({
                ...s,
                creator_name: s.creator_profiles?.full_name || 'N/A',
                campaign_name: s.campaigns?.name || 'N/A',
                brand_name: s.campaigns?.brand_profiles?.brand_name || 'N/A',
            }))

            setSubmissions(formattedSubmissions)
        } finally {
            setLoading(false)
        }
    }

    const handleSchedulePost = async () => {
        if (!selectedSubmission) return

        // This would be your API call to schedule the post
        toast.info('Scheduling post...')
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Update the status in the database to 'posted'
        const { error } = await supabaseClient
            .from('campaign_submissions')
            .update({ status: 'posted' })
            .eq('id', selectedSubmission.id)

        if (error) {
            console.error('Error scheduling post:', error)
            toast.error('Failed to schedule post.')
        } else {
            toast.success('Post scheduled successfully!')
            fetchSubmissions()
            setViewSubmissionModal(false)
        }
    }

    const handleViewSubmission = (submission: Submission) => {
        setSelectedSubmission(submission)
        setViewSubmissionModal(true)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500/10 text-green-500">Approved</Badge>
            case 'pending':
                return <Badge className="bg-yellow-500/10 text-yellow-500">Pending</Badge>
            case 'rejected':
                return <Badge className="bg-red-500/10 text-red-500">Rejected</Badge>
            case 'posted':
                return <Badge className="bg-blue-500/10 text-blue-500">Posted</Badge>
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
            <h1 className="text-3xl font-bold">Campaign Submissions</h1>
            <div className="flex justify-start">
                <Tabs
                    value={filter}
                    onValueChange={(value) => setFilter(value as 'approved' | 'pending' | 'rejected' | 'posted')}
                >
                    <TabsList>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
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
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-neutral-500">
                                    No submissions found with this status.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {selectedSubmission && (
                <Dialog open={viewSubmissionModal} onOpenChange={setViewSubmissionModal}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Submission for {selectedSubmission.campaign_name}</DialogTitle>
                            <DialogDescription>
                                Submitted by {selectedSubmission.creator_name} for {selectedSubmission.brand_name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="my-4 space-y-4">
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                <video
                                    key={selectedSubmission.video_url}
                                    controls
                                    src={selectedSubmission.video_url}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Creator's Caption</h3>
                                <p className="text-sm text-neutral-600">{selectedSubmission.caption}</p>
                            </div>
                            <p className="text-sm text-neutral-500">
                                Submitted: {format(parseISO(selectedSubmission.submitted_at), 'PPP')}
                            </p>
                        </div>
                        <DialogFooter>
                            {selectedSubmission.status === 'approved' && (
                                <Button
                                    onClick={handleSchedulePost}
                                    className="bg-[#e85c51] hover:bg-[#f3867e] text-white"
                                >
                                    Schedule Post
                                </Button>
                            )}
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
