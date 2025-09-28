// src/app/main/brand/campaigns/[id]/submissions/SubmissionsView.tsx

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, X, Eye, UploadCloud, AlertTriangle } from 'lucide-react'

type SubmissionStatus = 'pending' | 'approved' | 'rejected'
type CampaignStatus = 'inreview' | 'active' | 'approved' | 'closed' // Added 'approved' for consistency

interface Submission {
    id: string
    creator_id: string
    campaign_id: string
    status: SubmissionStatus
    content_url: string
    notes: string | null
    created_at: string
    creator_name: string
}

interface CampaignMeta {
    name: string
    max_submissions: number | null 
    status: CampaignStatus 
}

const SubmissionsView: React.FC = () => {
    const params = useParams()
    const campaignId = params.id as string

    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [campaignMeta, setCampaignMeta] = useState<CampaignMeta | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // State to track the number of currently approved submissions
    const [approvedCount, setApprovedCount] = useState(0) 

    // ------------------------------------------
    // 1. Core Logic to Close Campaign in Supabase
    // ------------------------------------------
    const closeCampaign = async () => {
        // Only attempt to close if the campaign is currently open (active or approved)
        if (campaignMeta && (campaignMeta.status === 'active' || campaignMeta.status === 'approved')) {
            const { error } = await supabaseClient
                .from('campaigns')
                .update({ status: 'closed' })
                .eq('id', campaignId)
                .select() // Use select() to get the updated row or simply check for error

            if (error) {
                toast.error('Campaign Closure Failed', { description: 'Could not automatically close campaign: ' + error.message });
            } else {
                // Update local state to reflect the closure
                setCampaignMeta(prev => prev ? { ...prev, status: 'closed' } : null);
                toast.success('Campaign Auto-Closed! 🎉', { description: 'The max submission quota has been met. The campaign is now closed to new creator submissions.' });
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
        const { data: subsData, error: subsError } = await supabaseClient
            .from('submissions')
            .select(`
                id, creator_id, campaign_id, status, content_url, notes, created_at,
                profiles(name) 
            `)
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false })
            .returns<Array<Omit<Submission, 'creator_name'> & { profiles: { name: string } | null }>>()

        if (subsError) {
            setError('Failed to load submissions: ' + subsError.message)
        } else {
            const formattedSubmissions: Submission[] = subsData.map(sub => ({
                ...sub,
                creator_name: sub.profiles?.name || 'Unknown Creator',
            }))
            
            // Calculate the current approved count from the fetched submissions
            const currentApprovedCount = formattedSubmissions.filter(sub => sub.status === 'approved').length;
            setApprovedCount(currentApprovedCount);
            setSubmissions(formattedSubmissions);
        }
        setLoading(false)
    }, [campaignId])

    useEffect(() => {
        fetchSubmissionsAndMeta()
    }, [fetchSubmissionsAndMeta])


    // ------------------------------------------
    // 2. Logic to Handle Status Change (Approve/Reject)
    // ------------------------------------------
    const handleStatusChange = async (submissionId: string, newStatus: SubmissionStatus) => {
        
        const submissionToUpdate = submissions.find(s => s.id === submissionId);
        if (!submissionToUpdate || !campaignMeta) return;
        
        const oldStatus = submissionToUpdate.status;
        const maxSubmissions = campaignMeta.max_submissions;
        const isLimited = maxSubmissions !== null && maxSubmissions > 0;
        let newApprovedCount = approvedCount;
        
        // If the campaign is already closed by status, prevent changes
        if (campaignMeta.status === 'closed') {
             toast.warning("Campaign is closed.", { description: "Cannot change submission status for a closed campaign." });
             return;
        }

        // CORE LOGIC: CHECK LIMIT BEFORE APPROVAL
        if (newStatus === 'approved' && oldStatus !== 'approved' && isLimited) {
            if (approvedCount >= maxSubmissions) {
                toast.error("Limit Reached", {
                    description: `You have already approved ${approvedCount} submissions, which meets the campaign limit of ${maxSubmissions}. Please reject an existing approved submission first.`
                });
                return; // Stop the action
            }
            newApprovedCount = approvedCount + 1; // Pre-calculate new count
        } else if (oldStatus === 'approved' && newStatus !== 'approved') {
            // Decrement if an approved submission is now being rejected/set pending
            newApprovedCount = approvedCount - 1;
        }
        
        // Optimistic update of local state
        setSubmissions(prev => 
            prev.map(sub => sub.id === submissionId ? { ...sub, status: newStatus } : sub)
        );
        setApprovedCount(newApprovedCount); 

        // Update status in Supabase
        const { error } = await supabaseClient
            .from('submissions')
            .update({ status: newStatus })
            .eq('id', submissionId)

        if (error) {
            toast.error('Update Failed', { description: error.message })
            // Revert local state on failure
            fetchSubmissionsAndMeta(); 
        } else {
            toast.success(`Submission ${newStatus}!`, { description: `Content status updated to ${newStatus}.` })

            // CORE LOGIC: CLOSE CAMPAIGN AFTER APPROVAL IF LIMIT IS MET
            if (newStatus === 'approved' && isLimited && newApprovedCount >= maxSubmissions) {
                closeCampaign();
            }
        }
    }

    if (loading) return <div className="text-center p-8">Loading submissions...</div>
    if (error) return <div className="text-center p-8 text-red-600">{error}</div>
    if (!campaignMeta) return <div className="text-center p-8 text-red-600">Campaign details missing.</div>

    const maxSubmissions = campaignMeta.max_submissions;
    const isLimited = maxSubmissions !== null && maxSubmissions > 0;
    const submissionsClosed = campaignMeta.status === 'closed';
    const quotaMet = isLimited && approvedCount >= maxSubmissions;
    const remainingSlots = isLimited ? maxSubmissions - approvedCount : null;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submissions for "{campaignMeta.name}"</h1>
            <p className="text-gray-600 mb-6">Review, approve, or reject content submitted by your creators.</p>
            
            {/* Submissions Status Panel */}
            <div className={`p-4 mb-6 rounded-lg flex justify-between items-center ${
                submissionsClosed 
                    ? 'bg-red-100 border border-red-400' 
                    : quotaMet ? 'bg-orange-100 border border-orange-400' : 'bg-green-100 border border-green-400'
            }`}>
                <div className="flex items-center">
                    <AlertTriangle className={`w-6 h-6 mr-3 ${submissionsClosed || quotaMet ? 'text-red-600' : 'text-green-600'}`} />
                    <div>
                        <p className="font-semibold text-lg">
                            Approved Submissions: <span className="text-2xl font-bold">{approvedCount}</span>
                            {isLimited && (
                                <span className="text-gray-700 ml-2"> / {maxSubmissions}</span>
                            )}
                        </p>
                        <p className="text-sm">
                            {submissionsClosed
                                ? "The campaign status is CLOSED. No further approvals or new submissions are allowed."
                                : quotaMet
                                    ? "Approval quota met. Approving any new submission requires rejecting an existing one. The campaign will remain OPEN until the status is 'closed'."
                                    : isLimited
                                        ? `You can approve ${remainingSlots} more submission(s). Approving the final one will automatically close the campaign.`
                                        : "No submission limit is currently set for this campaign."
                            }
                        </p>
                    </div>
                </div>
                {submissionsClosed && (
                    <span className="font-bold text-red-800 bg-white px-3 py-1 rounded-full shadow-md">CAMPAIGN CLOSED</span>
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
                            <div key={submission.id} className="p-4 bg-white hover:bg-gray-50 flex justify-between items-center transition-colors">
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-900">{submission.creator_name}</p>
                                    <p className="text-sm text-gray-500">Submitted: {new Date(submission.created_at).toLocaleDateString()}</p>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                                        submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {submission.status.toUpperCase()}
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <a 
                                        href={submission.content_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 transition-colors flex items-center text-sm"
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> View Content
                                    </a>
                                    
                                    {/* Action Buttons */}
                                    <button
                                        onClick={() => handleStatusChange(submission.id, 'approved')}
                                        // Disable if campaign is globally closed OR if already approved
                                        disabled={submissionsClosed || submission.status === 'approved'}
                                        className={`p-2 rounded-full transition-colors ${
                                            submission.status === 'approved'
                                                ? 'bg-green-500 text-white'
                                                : submissionsClosed 
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                        title={submissionsClosed ? "Campaign is closed" : submission.status === 'approved' ? 'Approved' : "Approve Content"}
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(submission.id, 'rejected')}
                                        disabled={submissionsClosed || submission.status === 'rejected'}
                                        className={`p-2 rounded-full transition-colors ${
                                            submission.status === 'rejected'
                                                ? 'bg-red-500 text-white'
                                                : submissionsClosed
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                    >
                                        <X className="w-5 h-5" />
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