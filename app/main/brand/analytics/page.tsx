'use client'

import React, { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, Eye, Heart, MessageCircle, Clock, Target, Zap, Instagram, MousePointer2 } from 'lucide-react'
import { toast } from 'sonner'
import { FetchPostsForCampaign, FetchInsightsForCampaign } from '@/lib/social-media/fetch/fetchInsights'
import { supabaseClient } from '@/lib/supabase/client'

// --- Icons ---
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.3 6.3 0 01-1.87-1.57v8.43c-.02 2.22-.56 4.54-2.19 6.09-1.63 1.54-4.01 2.06-6.14 1.74-2.14-.32-4.14-1.74-5.02-3.74-.88-2.01-.65-4.48.6-6.26 1.25-1.78 3.48-2.73 5.64-2.42v4.06c-1.12-.13-2.31.25-3.03 1.14-.72.89-.72 2.22-.11 3.19.61.96 1.79 1.48 2.89 1.25 1.1-.23 1.93-1.25 1.94-2.37V.02z" />
    </svg>
)

export default function CampaignAnalytics() {
    const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    // Fetch available campaigns
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                // 1️⃣ Get current logged-in user
                const {
                    data: { user },
                    error: userError,
                } = await supabaseClient.auth.getUser()

                if (userError || !user) {
                    return
                }

                let query = supabaseClient
                    .from('campaigns')
                    .select('id, name, status, image_url, created_at, cover_image_url')
                    .eq('created_by', user.id)
                const { data, error } = await query.order('created_at', { ascending: false })

                let modifiedData = data?.map((item) => {
                    return {
                        id: item.id,
                        name: item.name,
                    }
                })

                if (error) {
                    console.error('Error fetching campaigns:', error)
                } else {
                    setCampaigns(modifiedData!)
                }
            } catch {
                console.error('Unexpected error:', 'Error with Campaign')
            } finally {
                setLoading(false)
            }
        }
        fetchCampaigns();
    }, [])

    // Fetch posts + insights when a campaign is selected
    useEffect(() => {
        if (!selectedCampaignId) return

        const fetchCampaignData = async () => {
            setLoading(true)
            try {
                const fetchedPosts = await FetchPostsForCampaign(selectedCampaignId)
                const fetchedInsights = await FetchInsightsForCampaign(selectedCampaignId)

                // Merge posts with their insights
                const merged = fetchedPosts.map((post: any) => {
                    const insight = fetchedInsights.find((i: any) => i.media_id === post.media_id) || {}
                    return { ...post, insight }
                })
                setPosts(merged)
            } catch (err) {
                console.error(err)
                toast.error('Failed to fetch campaign data')
            } finally {
                setLoading(false)
            }
        }

        fetchCampaignData()
    }, [selectedCampaignId])

    // KPI aggregation
    const totalViews = posts.reduce((sum, p) => sum + (p.insight?.views || 0), 0)
    const totalLikes = posts.reduce((sum, p) => sum + (p.insight?.likes || 0), 0)
    const totalComments = posts.reduce((sum, p) => sum + (p.insight?.comments || 0), 0)
    const totalReach = posts.reduce((sum, p) => sum + (p.insight?.reach || 0), 0)
    const avgEngagementRate = posts.length ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1) : 0

    // Chart data
    const performanceData = posts.map((p, i) => ({
        name: `Post ${i + 1}`,
        views: p.insight?.views || 0,
        completion: p.insight?.completion || 0,
    }))

    // Download CSV report
    const handleDownloadReport = () => {
        if (!posts.length) return toast.error('No posts to download')
        setIsDownloading(true)

        const headers = ['Caption', 'Platform', 'Views', 'Likes', 'Comments', 'Reach', 'Completion']
        const rows = posts.map((p) => [
            `"${p.caption || ''}"`,
            p.platform || 'IG',
            p.insight?.views || 0,
            p.insight?.likes || 0,
            p.insight?.comments || 0,
            p.insight?.reach || 0,
            p.insight?.completion || 0,
        ])

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `campaign_${selectedCampaignId}_report.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setIsDownloading(false)
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-8 py-4 border-b  w-full ">
                <select
                    className="px-4 py-2 border rounded-lg"
                    value={selectedCampaignId || ''}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                >
                    <option value="" disabled>
                        Select a Campaign
                    </option>
                    {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-all"
                    >
                        <Download size={16} /> {isDownloading ? 'Generating...' : 'Download Report'}
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-8">
                {loading ? (
                    <p className="text-center mt-20 text-lg font-bold">Loading campaign analytics...</p>
                ) : selectedCampaignId ? (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                            <MetricCard label="Views" value={totalViews.toLocaleString()} icon={<Eye size={14} />} />
                            <MetricCard label="Likes" value={totalLikes.toLocaleString()} icon={<Heart size={14} />} />
                            <MetricCard
                                label="Comments"
                                value={totalComments.toLocaleString()}
                                icon={<MessageCircle size={14} />}
                            />
                            <MetricCard
                                label="Eng. Rate"
                                value={`${avgEngagementRate}%`}
                                growth="+1.2%"
                                icon={<MousePointer2 size={14} />}
                            />
                            <MetricCard label="Reach" value={totalReach.toLocaleString()} icon={<Target size={14} />} />
                        </div>

                        {/* Performance Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
                            <h3 className="font-bold text-lg mb-4">Daily Content Performance</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" hide />
                                        <YAxis hide />
                                        <Tooltip cursor={{ stroke: '#EF4444', strokeWidth: 2 }} />
                                        <Area
                                            type="monotone"
                                            dataKey="views"
                                            stroke="#EF4444"
                                            fill="#FEF2F2"
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Post Table with video previews */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Individual Post Analysis</h3>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                        <th className="px-6 py-4">Content</th>
                                        <th className="px-6 py-4">Platform</th>
                                        <th className="px-6 py-4 text-center">Views</th>
                                        <th className="px-6 py-4 text-center">Likes</th>
                                        <th className="px-6 py-4 text-center">Comments</th>
                                        <th className="px-6 py-4 text-center">Completion</th>
                                        <th className="px-6 py-4 text-center">Video</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {posts.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-sm">
                                                {row.caption || `Post ${i + 1}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                {row.platform === 'IG' ? (
                                                    <Instagram size={16} className="text-pink-500" />
                                                ) : (
                                                    <TikTokIcon className="w-4 h-4 text-slate-900" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">{row.insight?.views || 0}</td>
                                            <td className="px-6 py-4 text-center">{row.insight?.likes || 0}</td>
                                            <td className="px-6 py-4 text-center">{row.insight?.comments || 0}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-xs font-bold">
                                                        {row.insight?.completion || 0}%
                                                    </span>
                                                    <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-green-500 h-full"
                                                            style={{ width: `${row.insight?.completion || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {row.video_url ? (
                                                    <video width={120} height={70} controls className="rounded-md">
                                                        <source src={row.video_url} type="video/mp4" />
                                                        Your browser does not support the video tag.
                                                    </video>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded uppercase">
                                                    Live
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <p className="text-center mt-20 text-lg font-bold">Select a campaign to view analytics</p>
                )}
            </main>
        </div>
    )
}

// --- MetricCard ---
const MetricCard = ({ label, value, growth, icon }: any) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group transition-all hover:bg-white hover:shadow-md">
        <div className="text-red-500 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900">{value}</span>
            {growth && <span className="text-[10px] font-bold text-green-500">{growth}</span>}
        </div>
    </div>
)
