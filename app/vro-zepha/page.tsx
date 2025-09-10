'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, User } from 'lucide-react'
// import { supabaseClient } from '@/lib/supabase/client'

interface Campaign {
    id: string
    name: string
    status: 'pending' | 'active' | 'rejected' | 'completed'
    created_by: string
    budget: string
}

interface Submission {
    id: string
    campaign_id: string
    creator_id: string
    status: 'pending' | 'approved' | 'rejected'
    file_url: string
}

// Mock data for demo
const mockCampaigns: Campaign[] = [
    { id: '1', name: 'Summer Style Showcase', status: 'pending', created_by: 'creator1', budget: '$5,000' },
    { id: '2', name: 'Tech Gadget Review', status: 'pending', created_by: 'creator2', budget: '$10,000' },
    { id: '3', name: 'Fitness Challenge', status: 'active', created_by: 'creator3', budget: '$3,000' },
]

const mockSubmissions: Submission[] = [
    { id: '1', campaign_id: 'Summer Refresh Campaign', creator_id: 'Sophia Bennett', status: 'pending', file_url: '' },
    { id: '2', campaign_id: 'Tech Review Series', creator_id: 'Marcus Chen', status: 'pending', file_url: '' },
]

export default function AdminDashboard() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'campaigns' | 'submissions'>('campaigns')

    useEffect(() => {
        const fetchData = async () => {
            // Simulate API call
            setTimeout(() => {
                setCampaigns(mockCampaigns)
                setSubmissions(mockSubmissions)
                setLoading(false)
            }, 1000)

            /* Real implementation:
            const { data: campaignsData } = await supabaseClient
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false })

            const { data: submissionsData } = await supabaseClient
                .from('campaign_submissions')
                .select('*')
                .order('created_at', { ascending: false })

            setCampaigns(campaignsData || [])
            setSubmissions(submissionsData || [])
            setLoading(false)
            */
        }

        fetchData()
    }, [])

    const getStatusBadge = (status: string) => {
        const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium'
        switch (status) {
            case 'pending':
                return `${baseClasses} bg-orange-100 text-orange-800`
            case 'active':
                return `${baseClasses} bg-teal-600 text-white`
            case 'approved':
                return `${baseClasses} bg-teal-600 text-white`
            case 'completed':
                return `${baseClasses} bg-teal-600 text-white`
            case 'rejected':
                return `${baseClasses} bg-gray-100 text-gray-600`
            default:
                return `${baseClasses} bg-gray-100 text-gray-600`
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-900 rounded"></div>
                            <span className="text-xl font-semibold text-gray-900">Goheza</span>
                        </div>
                       
                        <div className="flex items-center space-x-4">
                            <button className="p-2 bg-red-500 rounded-full text-white">
                                <Bell size={16} />
                            </button>
                            <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                                <User size={16} className="text-white" />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading admin dashboard...</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    const pendingCampaigns = campaigns.filter((c) => c.status === 'pending')
    const pendingSubmissions = submissions.filter((s) => s.status === 'pending')

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-900 rounded"></div>
                        <span className="text-xl font-semibold text-gray-900">Goheza</span>
                    </div>
                    <nav className="hidden md:flex items-center space-x-8">
                        <span className="text-gray-900 font-medium border-b-2 border-red-400 pb-1">Dashboard</span>
                        <span className="text-gray-600">Campaigns</span>
                        <span className="text-gray-600">Users</span>
                        <span className="text-gray-600">Content</span>
                        <span className="text-gray-600">Payments</span>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <button className="p-2 bg-red-500 rounded-full text-white">
                            <Bell size={16} />
                        </button>
                        <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                            <User size={16} className="text-white" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                    <p className="text-gray-600">Review and manage pending campaigns and content submissions.</p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Campaigns</h3>
                        <div className="text-2xl font-bold text-gray-900">{pendingCampaigns.length}</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Submissions</h3>
                        <div className="text-2xl font-bold text-gray-900">{pendingSubmissions.length}</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Total Campaigns</h3>
                        <div className="text-2xl font-bold text-gray-900">{campaigns.length}</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Total Submissions</h3>
                        <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="flex space-x-8 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('campaigns')}
                            className={`pb-3 px-1 font-medium text-sm ${
                                activeTab === 'campaigns'
                                    ? 'text-gray-900 border-b-2 border-red-400'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Pending Campaigns
                        </button>
                        <button
                            onClick={() => setActiveTab('submissions')}
                            className={`pb-3 px-1 font-medium text-sm ${
                                activeTab === 'submissions'
                                    ? 'text-gray-900 border-b-2 border-red-400'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Content Submissions
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {activeTab === 'campaigns' && (
                        <div className="p-6">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Campaigns Awaiting Approval</h2>
                                <p className="text-sm text-gray-600">
                                    Review campaign details before approving for creators.
                                </p>
                            </div>

                            {pendingCampaigns.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No pending campaigns at this time.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingCampaigns.map((campaign) => (
                                        <div
                                            key={campaign.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 mb-1">{campaign.name}</h3>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <span>Budget: {campaign.budget}</span>
                                                    <span className={getStatusBadge(campaign.status)}>
                                                        {campaign.status.charAt(0).toUpperCase() +
                                                            campaign.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/admin/campaigns/${campaign.id}`}
                                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                                            >
                                                Review Campaign
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="p-6">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Content Awaiting Review</h2>
                                <p className="text-sm text-gray-600">
                                    Review content submitted by creators before it goes live to brands.
                                </p>
                            </div>

                            {pendingSubmissions.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No pending submissions at this time.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingSubmissions.map((submission) => (
                                        <div
                                            key={submission.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 mb-1">
                                                    Submission for {submission.campaign_id}
                                                </h3>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <span>Creator: {submission.creator_id}</span>
                                                    <span className={getStatusBadge(submission.status)}>
                                                        {submission.status.charAt(0).toUpperCase() +
                                                            submission.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/admin/submissions/${submission.id}`}
                                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                                            >
                                                Review Content
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
