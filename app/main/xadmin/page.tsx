'use client'
import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { baseLogger } from '@/lib/logger'
import { Clock, DollarSign, Calendar, CheckCircle, XCircle, Ban, RefreshCw, Eye, Filter } from 'lucide-react'

const supabase = supabaseClient

type Campaign = {
    id: string
    name: string
    description: string | null
    payout: string
    status: string
    created_at: string
    image_url: string | null
}

export default function AdminDashboard() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)

    async function fetchCampaigns() {
        baseLogger('ADMIN-OPERATIONS', 'WillFetchInReviewCampaigns')
        setLoading(true)
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('status', 'inreview')
            .order('created_at', { ascending: false })
        if (error) setError(error.message)
        else setCampaigns(data || [])
        baseLogger('ADMIN-OPERATIONS', 'DidFetchInReviewCampaigns')
        setLoading(false)
    }

    async function updateStatus(campaignId: string, newStatus: 'approved' | 'rejected' | 'cancelled') {
        baseLogger('ADMIN-OPERATIONS', `WillUpdateTheStatusOfACampaign:${campaignId}`)
        setProcessingId(campaignId)

        const { error } = await supabase
            .from('campaigns')
            .update({
                status: newStatus,
                reviewed_by: (await supabase.auth.getUser()).data.user?.id || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', campaignId)

        if (error) {
            setError(error.message)
        } else {
            baseLogger(
                'ADMIN-OPERATIONS',
                `DIdUpdateTheStatusOfACampaign:${campaignId} with Options of status:${newStatus}`
            )
            setCampaigns((prev) => prev.filter((c) => c.id !== campaignId)) // remove from list after action
        }
        setProcessingId(null)
    }

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-red-600 animate-spin" />
                        <span className="text-gray-600">Loading campaigns...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800 font-medium">Error loading campaigns</p>
                    </div>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
                <button
                    onClick={() => {
                        setError(null)
                        fetchCampaigns()
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">Campaign Review Dashboard</h1>
                <p className="text-gray-600">Review and manage campaigns awaiting approval</p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pending Review</p>
                            <p className="text-2xl font-semibold text-gray-900">{campaigns.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Payout Value</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                $
                                {campaigns
                                    .reduce((sum, c) => sum + parseFloat(c.payout.replace(/[^\d.-]/g, '') || '0'), 0)
                                    .toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Filter className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Filter</p>
                            <p className="text-lg font-medium text-gray-900">In Review</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">Campaign Queue</h2>
                </div>
                <button
                    onClick={fetchCampaigns}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Campaigns List */}
            {campaigns.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">No campaigns pending review at the moment.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {campaigns.map((campaign) => (
                        <div key={campaign.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                            {/* Campaign Header */}
                            <div className="p-6">
                                <div className="flex items-start gap-6">
                                    {/* Campaign Image */}
                                    {campaign.image_url ? (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={campaign.image_url}
                                                alt={campaign.name}
                                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Eye className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}

                                    {/* Campaign Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {campaign.name}
                                                </h3>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    In Review
                                                </span>
                                            </div>
                                        </div>

                                        {campaign.description && (
                                            <p className="text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
                                        )}

                                        {/* Campaign Meta */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Payout:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {campaign.payout}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Submitted:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatDate(campaign.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Campaign ID: {campaign.id.slice(0, 8)}...
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateStatus(campaign.id, 'approved')}
                                            disabled={processingId === campaign.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </button>

                                        <button
                                            onClick={() => updateStatus(campaign.id, 'rejected')}
                                            disabled={processingId === campaign.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>

                                        <button
                                            onClick={() => updateStatus(campaign.id, 'cancelled')}
                                            disabled={processingId === campaign.id}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Ban className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
