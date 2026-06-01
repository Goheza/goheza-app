'use client'
import { useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'
import { FetchPostsForCampaign, FetchInsightsForCampaign } from '@/lib/appServiceData/social-media/fetch/fetchInsights'
import { UpdateInsightsForCampaignTk } from '@/lib/appServiceData/social-media/tiktok/update-insights-tk'
import { supabaseClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Campaign {
    id: string
    name: string
    status: string
    budget: number
    created_at: string
}
interface Post {
    id: string
    campaign_id: string
    user_id: string | null
    creator_profiles: { full_name: string }
    platform: 'tiktok' | 'instagram'
    media_id: string
    permalink: string | null
    video_url: string | null
    thumbnail_url: string | null
    media_type: string | null
    status: 'PUBLISHED' | 'PROCESSING' | 'FAILED'
    posted_at: string
    created_at: string
}
interface Insight {
    id: string
    campaign_id: string
    platform: string
    media_id: string
    likes: number
    comments: number
    views: number
    shares: number
    reach: number
    impressions: number
    saves: number
    extra_metrics: Record<string, unknown> | null
    last_updated: string
}
interface PostWithInsight extends Post {
    insight: Insight | null
}
type MetricKey = 'views' | 'likes' | 'comments'
type SortDir = 'asc' | 'desc'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return n.toLocaleString()
}
function engRate(p: PostWithInsight): string {
    if (!p.insight || !p.insight.views) return '—'
    const rate = ((p.insight.likes + p.insight.comments) / p.insight.views) * 100
    return rate.toFixed(2) + '%'
}
function sumMetric(posts: PostWithInsight[], key: MetricKey): number {
    return posts.reduce((acc, p) => acc + (p.insight?.[key] ?? 0), 0)
}
function avgEngRate(posts: PostWithInsight[]): string {
    const published = posts.filter((p) => p.status === 'PUBLISHED' && p.insight && p.insight.views > 0)
    if (!published.length) return '—'
    const avg =
        published.reduce((acc, p) => {
            const r = ((p.insight!.likes + p.insight!.comments) / p.insight!.views) * 100
            return acc + r
        }, 0) / published.length
    return avg.toFixed(2) + '%'
}
function downloadCSV(posts: PostWithInsight[], campaignName: string): void {
    const headers = [
        'Media ID',
        'Platform',
        'Status',
        'Posted At',
        'Views',
        'Likes',
        'Comments',
        'Engagement Rate',
        'Last Updated',
    ]
    const rows = posts.map((p) => [
        p.media_id,
        p.platform,
        p.status,
        new Date(p.posted_at).toLocaleDateString(),
        p.insight?.views ?? 0,
        p.insight?.likes ?? 0,
        p.insight?.comments ?? 0,
        engRate(p),
        p.insight?.last_updated ? new Date(p.insight.last_updated).toLocaleString() : '—',
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaignName.replace(/\s+/g, '_')}_analytics.csv`
    a.click()
    URL.revokeObjectURL(url)
}

// ── Recharts custom tooltip ───────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
                <p className="font-semibold text-black mb-1">{label}</p>
                {payload.map((entry: any) => (
                    <p key={entry.name} style={{ color: entry.color }} className="font-medium">
                        {entry.name}: {fmt(entry.value)}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
                <p className="font-semibold" style={{ color: payload[0].payload.color }}>
                    {payload[0].name}
                </p>
                <p className="text-black">
                    {fmt(payload[0].value)} ({payload[0].payload.pct}%)
                </p>
            </div>
        )
    }
    return null
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
    label,
    value,
    sub,
    accent,
    icon,
}: {
    label: string
    value: number
    sub?: string
    accent: string
    icon: string
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
            <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-8 translate-x-8 transition-all duration-300 group-hover:opacity-10 group-hover:scale-110"
                style={{ background: accent }}
            />
            <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">{label}</span>
                <span className="text-lg">{icon}</span>
            </div>
            <div
                className="text-3xl font-bold text-gray-900 tracking-tight mb-1"
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {fmt(value)}
            </div>
            {sub && <div className="text-xs text-gray-400 font-medium">{sub}</div>}
            <div
                className="absolute bottom-0 left-0 w-full h-0.5 opacity-60"
                style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
            />
        </div>
    )
}

// ── Status Pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
    const map: Record<string, string> = {
        PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        PROCESSING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        FAILED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    }
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                map[status] ?? 'bg-gray-100 text-gray-600'
            }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    status === 'PUBLISHED' ? 'bg-emerald-500' : status === 'PROCESSING' ? 'bg-amber-500' : 'bg-red-500'
                }`}
            />
            {status}
        </span>
    )
}

function CampaignStatusPill({ status }: { status: string }) {
    const map: Record<string, string> = {
        approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        inreview: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    }
    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                map[status] ?? 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
            }`}
        >
            {status}
        </span>
    )
}

// ── Sort Header ───────────────────────────────────────────────────────────────
function SortTh({
    label,
    k,
    cur,
    dir,
    onSort,
}: {
    label: string
    k: MetricKey
    cur: MetricKey
    dir: SortDir
    onSort: (k: MetricKey) => void
}) {
    const active = cur === k
    return (
        <th
            onClick={() => onSort(k)}
            className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors ${
                active ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
            }`}
        >
            <span className="flex items-center gap-1">
                {label}
                <span className="text-xs">{active ? (dir === 'desc' ? '↓' : '↑') : '↕'}</span>
            </span>
        </th>
    )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function TikTokIcon() {
    return (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.96a8.17 8.17 0 004.78 1.52V7.01a4.85 4.85 0 01-1.01-.32z" />
        </svg>
    )
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
    return (
        <span style={{ display: 'inline-flex', animation: spinning ? 'spin 1s linear infinite' : 'none' }}>
            <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M4 12a8 8 0 018-8V2l4 4-4 4V8a6 6 0 100 6" />
            </svg>
        </span>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [selectedId, setSelectedId] = useState<string>('')
    const [posts, setPosts] = useState<PostWithInsight[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sortKey, setSortKey] = useState<MetricKey>('views')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
    const [selectedCreator, setSelectedCreator] = useState<PostWithInsight | null>(null)
    const [drillLoading, setDrillLoading] = useState(false)

    useEffect(() => {
        async function loadCampaigns() {
            const { data, error: dbError } = await supabaseClient
                .from('campaigns')
                .select('id, name, status, budget, created_at')
                .order('created_at', { ascending: false })
            if (dbError) {
                setError('Failed to load campaigns')
                return
            }
            const rows = (data ?? []) as Campaign[]
            setCampaigns(rows)
            if (rows.length > 0) setSelectedId(rows[0].id)
        }
        loadCampaigns()
    }, [])

    const loadData = useCallback(async (campaignId: string) => {
        if (!campaignId) return
        setLoading(true)
        setError(null)
        try {
            const [rawPosts, rawInsights] = await Promise.all([
                FetchPostsForCampaign(campaignId),
                FetchInsightsForCampaign(campaignId),
            ])
            const insightMap = new Map<string, Insight>()
            ;(rawInsights as Insight[]).forEach((ins) => insightMap.set(ins.media_id, ins))
            const merged: PostWithInsight[] = (rawPosts as Post[]).map((p) => ({
                ...p,
                insight: insightMap.get(p.media_id) ?? null,
            }))
            setPosts(merged)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (selectedId) loadData(selectedId)
    }, [selectedId, loadData])
    useEffect(() => {
        if (!selectedCreator) return
        const updated = posts.find(
            (p) => p.media_id === selectedCreator.media_id && p.campaign_id === selectedCreator.campaign_id
        )
        if (updated) setSelectedCreator(updated)
    }, [posts])

    async function handleRefresh() {
        if (!selectedId || refreshing) return
        setRefreshing(true)
        setError(null)
        try {
            await UpdateInsightsForCampaignTk(selectedId)
            await loadData(selectedId)
            setLastRefreshed(new Date())
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to refresh TikTok insights')
        } finally {
            setRefreshing(false)
        }
    }

    async function handleSelectCreator(post: PostWithInsight) {
        setDrillLoading(true)
        setSelectedCreator(post)
        try {
            const {
                data: { session },
            } = await supabaseClient.auth.getSession()
            if (session) {
                await fetch('/api/tiktok/submission-insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                    body: JSON.stringify({ mediaId: post.media_id, campaignId: post.campaign_id }),
                })
                await loadData(selectedId)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setDrillLoading(false)
        }
    }

    const tiktokPosts = posts.filter((p) => p.platform === 'tiktok')
    const sorted = [...tiktokPosts].sort((a, b) => {
        const av = a.insight?.[sortKey] ?? 0,
            bv = b.insight?.[sortKey] ?? 0
        return sortDir === 'desc' ? bv - av : av - bv
    })
    function toggleSort(key: MetricKey) {
        if (key === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
        else {
            setSortKey(key)
            setSortDir('desc')
        }
    }

    const selectedCampaign = campaigns.find((c) => c.id === selectedId)
    const totals = {
        views: sumMetric(tiktokPosts, 'views'),
        likes: sumMetric(tiktokPosts, 'likes'),
        comments: sumMetric(tiktokPosts, 'comments'),
    }

    // Chart data
    const barData = [...tiktokPosts]
        .filter((p) => (p.insight?.views ?? 0) > 0)
        .sort((a, b) => (b.insight?.views ?? 0) - (a.insight?.views ?? 0))
        .slice(0, 8)
        .map((p) => ({
            name: p.creator_profiles?.full_name?.split(' ')[0] ?? p.media_id.slice(-6),
            Views: p.insight?.views ?? 0,
            Likes: p.insight?.likes ?? 0,
            Comments: p.insight?.comments ?? 0,
        }))

    const likes = sumMetric(tiktokPosts, 'likes')
    const comments = sumMetric(tiktokPosts, 'comments')

    const engTotal = likes + comments
    const pieData = [
        { name: 'Likes', value: likes, color: '#f97316', pct: engTotal ? Math.round((likes / engTotal) * 100) : 0 },
        {
            name: 'Comments',
            value: comments,
            color: '#6366f1',
            pct: engTotal ? Math.round((comments / engTotal) * 100) : 0,
        },
    ].filter((d) => d.value > 0)

    const creatorPieData = selectedCreator
        ? [
              { name: 'Likes', value: selectedCreator.insight?.likes ?? 0, color: '#f97316', pct: 0 },
              { name: 'Comments', value: selectedCreator.insight?.comments ?? 0, color: '#6366f1', pct: 0 },
              { name: 'Shares', value: selectedCreator.insight?.shares ?? 0, color: '#10b981', pct: 0 },
              { name: 'Saves', value: selectedCreator.insight?.saves ?? 0, color: '#f59e0b', pct: 0 },
          ]
              .filter((d) => d.value > 0)
              .map((d) => {
                  const t =
                      (selectedCreator.insight?.likes ?? 0) +
                      (selectedCreator.insight?.comments ?? 0) +
                      (selectedCreator.insight?.shares ?? 0) +
                      (selectedCreator.insight?.saves ?? 0)
                  return { ...d, pct: t ? Math.round((d.value / t) * 100) : 0 }
              })
        : []

    const RADIAN = Math.PI / 180
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) => {
        if (pct < 8) return null
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)
        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
            >
                {pct}%
            </text>
        )
    }

    return (
        <>
            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .anim-card { animation: fadeInUp 0.4s ease both; }
      `}</style>

            <div className="min-h-screen bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* ── Header ── */}
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campaign Analytics</h1>
                            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full text-xs">
                                    <TikTokIcon /> TikTok
                                </span>
                                Performance overview &amp; creator insights
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {lastRefreshed && (
                                <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm">
                                    Updated {lastRefreshed.toLocaleTimeString()}
                                </span>
                            )}
                            <select
                                className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 min-w-[180px] cursor-pointer"
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                            >
                                {campaigns.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
                            >
                                <RefreshIcon spinning={refreshing} />
                                {refreshing ? 'Refreshing…' : 'Refresh'}
                            </button>
                            <button
                                onClick={() => selectedCampaign && downloadCSV(tiktokPosts, selectedCampaign.name)}
                                disabled={!tiktokPosts.length}
                                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-sm transition-all disabled:opacity-40"
                            >
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 16l-4-4h3V4h2v8h3l-4 4zm-7 4v-2h14v2H5z" />
                                </svg>
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* ── Error ── */}
                    {error && (
                        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">
                                ✕
                            </button>
                        </div>
                    )}

                    {/* ── Campaign badge ── */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="flex items-center gap-2 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full">
                            <TikTokIcon />
                            TikTok · {tiktokPosts.length} post{tiktokPosts.length !== 1 ? 's' : ''}
                        </span>
                        {selectedCampaign && <CampaignStatusPill status={selectedCampaign.status} />}
                        {loading && <span className="text-xs text-gray-400 italic">Loading…</span>}
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════
              CAMPAIGN OVERVIEW
          ═══════════════════════════════════════════════════════════════════ */}
                    {!selectedCreator && (
                        <>
                            {/* Stat cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
                                {(
                                    [
                                        {
                                            label: 'Total Views',
                                            value: totals.views,
                                            sub: 'All TikTok posts',
                                            accent: '#f97316',
                                            icon: '👁',
                                        },
                                        {
                                            label: 'Total Likes',
                                            value: totals.likes,
                                            sub: `${avgEngRate(tiktokPosts)} avg eng.`,
                                            accent: '#6366f1',
                                            icon: '❤️',
                                        },
                                        {
                                            label: 'Comments',
                                            value: totals.comments,
                                            sub: 'Direct responses',
                                            accent: '#10b981',
                                            icon: '💬',
                                        },
                                    ] as const
                                ).map((m, i) => (
                                    <div key={m.label} className="anim-card" style={{ animationDelay: `${i * 60}ms` }}>
                                        <StatCard {...m} />
                                    </div>
                                ))}
                            </div>

                            {/* Charts row */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                                {/* Bar chart – views per creator */}
                                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="mb-5">
                                        <h3 className="text-sm font-semibold text-gray-800">Views per Creator</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Top performing posts by view count
                                        </p>
                                    </div>
                                    {barData.length === 0 ? (
                                        <div className="flex items-center justify-center h-48 text-sm text-gray-300">
                                            No data yet
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart
                                                data={barData}
                                                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                                                barCategoryGap="30%"
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#f3f4f6"
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(v) => fmt(v)}
                                                />
                                                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f9fafb' }} />
                                                <Bar dataKey="Views" fill="#f97316" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>

                                {/* Pie chart – engagement breakdown */}
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="mb-5">
                                        <h3 className="text-sm font-semibold text-gray-800">Engagement Breakdown</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Distribution by interaction type</p>
                                    </div>
                                    {pieData.length === 0 ? (
                                        <div className="flex items-center justify-center h-48 text-sm text-gray-300">
                                            No engagement data yet
                                        </div>
                                    ) : (
                                        <>
                                            <ResponsiveContainer width="100%" height={160}>
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={42}
                                                        outerRadius={72}
                                                        dataKey="value"
                                                        labelLine={false}
                                                        label={renderCustomLabel}
                                                        strokeWidth={2}
                                                        stroke="#fff"
                                                    >
                                                        {pieData.map((entry, i) => (
                                                            <Cell key={i} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomPieTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {pieData.map((d) => (
                                                    <div key={d.name} className="flex items-center gap-2">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                                            style={{ background: d.color }}
                                                        />
                                                        <span className="text-xs text-gray-500">{d.name}</span>
                                                        <span className="text-xs font-semibold text-gray-700 ml-auto">
                                                            {d.pct}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Engagement metrics bar chart */}
                            {tiktokPosts.some((p) => p.insight) && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                                    <div className="mb-5">
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            Likes vs Comments vs Shares
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Engagement breakdown per creator</p>
                                    </div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart
                                            data={barData}
                                            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                                            barCategoryGap="25%"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => fmt(v)}
                                            />
                                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f9fafb' }} />
                                            <Bar dataKey="Likes" fill="#f97316" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Comments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Shares" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            <Legend
                                                formatter={(v) => <span className="text-xs text-gray-500">{v}</span>}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Creators table */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-10">
                                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">Creator Performance</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Click &quot;View Analytics&quot; to see a creator&apos;s full breakdown
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                                        {sorted.length} creator{sorted.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {sorted.length === 0 ? (
                                    <div className="py-16 text-center text-sm text-gray-300">
                                        No TikTok posts found for this campaign.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50/70">
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                        Creator
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                        Video
                                                    </th>
                                                    <SortTh
                                                        label="Views"
                                                        k="views"
                                                        cur={sortKey}
                                                        dir={sortDir}
                                                        onSort={toggleSort}
                                                    />
                                                    <SortTh
                                                        label="Likes"
                                                        k="likes"
                                                        cur={sortKey}
                                                        dir={sortDir}
                                                        onSort={toggleSort}
                                                    />
                                                    <SortTh
                                                        label="Comments"
                                                        k="comments"
                                                        cur={sortKey}
                                                        dir={sortDir}
                                                        onSort={toggleSort}
                                                    />

                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                        Eng. Rate
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                        Posted
                                                    </th>
                                                    <th className="px-4 py-3" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {sorted.map((p, i) => (
                                                    <tr
                                                        key={p.id}
                                                        className="hover:bg-red-50/30 transition-colors group"
                                                    >
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                                    {(p.creator_profiles?.full_name ??
                                                                        '?')[0].toUpperCase()}
                                                                </div>
                                                                <span className="font-medium text-gray-800 text-sm">
                                                                    {p.creator_profiles?.full_name ?? 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                    {p.thumbnail_url ? (
                                                                        <img
                                                                            src={p.thumbnail_url}
                                                                            alt="thumb"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-base">🎵</span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-mono text-gray-400">
                                                                    {p.media_id.slice(-8)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 tabular-nums font-semibold text-gray-800">
                                                            {fmt(p.insight?.views ?? 0)}
                                                        </td>
                                                        <td className="px-4 py-3.5 tabular-nums text-gray-600">
                                                            {fmt(p.insight?.likes ?? 0)}
                                                        </td>
                                                        <td className="px-4 py-3.5 tabular-nums text-gray-600">
                                                            {fmt(p.insight?.comments ?? 0)}
                                                        </td>
                                                        <td className="px-4 py-3.5 tabular-nums text-gray-600">
                                                            {fmt(p.insight?.shares ?? 0)}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <span
                                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                                    engRate(p) === '—'
                                                                        ? 'text-gray-300'
                                                                        : 'bg-red-50 text-red-600'
                                                                }`}
                                                            >
                                                                {engRate(p)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-xs text-gray-400">
                                                            {new Date(p.posted_at).toLocaleDateString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: '2-digit',
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <button
                                                                onClick={() => handleSelectCreator(p)}
                                                                className="text-xs font-semibold text-red-500 hover:text-red-700  transition-all whitespace-nowrap"
                                                            >
                                                                View Analytics ↗
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ══════════════════════════════════════════════════════════════════
              CREATOR DRILL-DOWN
          ═══════════════════════════════════════════════════════════════════ */}
                    {selectedCreator && (
                        <div className="anim-card">
                            <button
                                onClick={() => setSelectedCreator(null)}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
                            >
                                <svg
                                    width={14}
                                    height={14}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path d="M19 12H5M12 5l-7 7 7 7" />
                                </svg>
                                Back to campaign overview
                            </button>

                            {drillLoading && (
                                <div className="bg-blue-50 border border-blue-200 text-blue-600 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
                                    <RefreshIcon spinning /> Refreshing metrics from TikTok…
                                </div>
                            )}

                            {/* Creator header */}
                            <div className="flex items-center gap-4 mb-7">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                                    {(selectedCreator.creator_profiles?.full_name ?? '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {selectedCreator.creator_profiles?.full_name ?? 'Unknown Creator'}
                                    </h2>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        Posted{' '}
                                        {new Date(selectedCreator.posted_at).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <StatusPill status={selectedCreator.status} />
                                </div>
                            </div>

                            {/* Stat cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
                                {(
                                    [
                                        {
                                            label: 'Views',
                                            value: selectedCreator.insight?.views ?? 0,
                                            accent: '#f97316',
                                            icon: '👁',
                                        },
                                        {
                                            label: 'Likes',
                                            value: selectedCreator.insight?.likes ?? 0,
                                            accent: '#6366f1',
                                            icon: '❤️',
                                        },
                                        {
                                            label: 'Comments',
                                            value: selectedCreator.insight?.comments ?? 0,
                                            accent: '#10b981',
                                            icon: '💬',
                                        },
                                        {
                                            label: 'Shares',
                                            value: selectedCreator.insight?.shares ?? 0,
                                            accent: '#f59e0b',
                                            icon: '🔁',
                                        },
                                        {
                                            label: 'Reach',
                                            value: selectedCreator.insight?.reach ?? 0,
                                            accent: '#ec4899',
                                            icon: '📡',
                                        },
                                        {
                                            label: 'Impressions',
                                            value: selectedCreator.insight?.impressions ?? 0,
                                            accent: '#3b82f6',
                                            icon: '📊',
                                        },
                                    ] as const
                                ).map((m, i) => (
                                    <div key={m.label} className="anim-card" style={{ animationDelay: `${i * 50}ms` }}>
                                        <StatCard {...m} />
                                    </div>
                                ))}
                            </div>

                            {/* Video + Engagement row */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                                {/* Video */}
                                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-800">Submitted Video</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Media ID: {selectedCreator.media_id}
                                            </p>
                                        </div>
                                        {selectedCreator.permalink && (
                                            <a
                                                href={selectedCreator.permalink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <TikTokIcon /> View on TikTok ↗
                                            </a>
                                        )}
                                    </div>
                                    <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
                                        {selectedCreator.video_url ? (
                                            <video
                                                src={selectedCreator.video_url}
                                                controls
                                                className="w-full h-full object-contain"
                                            />
                                        ) : selectedCreator.permalink ? (
                                            <div className="flex items-center justify-center h-full">
                                                <a
                                                    href={selectedCreator.permalink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-white text-sm hover:underline"
                                                >
                                                    Open on TikTok ↗
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                                No video available
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Engagement donut */}
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-1">Engagement Breakdown</h3>
                                    <p className="text-xs text-gray-400 mb-4">Interaction type distribution</p>
                                    {creatorPieData.length === 0 ? (
                                        <div className="flex items-center justify-center h-48 text-sm text-gray-300">
                                            No engagement data yet
                                        </div>
                                    ) : (
                                        <>
                                            <ResponsiveContainer width="100%" height={160}>
                                                <PieChart>
                                                    <Pie
                                                        data={creatorPieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius={70}
                                                        dataKey="value"
                                                        labelLine={false}
                                                        label={renderCustomLabel}
                                                        strokeWidth={2}
                                                        stroke="#000"
                                                    >
                                                        {creatorPieData.map((entry, i) => (
                                                            <Cell key={i} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomPieTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {creatorPieData.map((d) => (
                                                    <div key={d.name} className="flex items-center gap-2">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                                            style={{ background: d.color }}
                                                        />
                                                        <span className="text-xs text-gray-500">{d.name}</span>
                                                        <span className="text-xs font-semibold text-gray-700 ml-auto">
                                                            {d.pct}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Engagement rate + last updated */}
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-4 flex items-center gap-6">
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium">Engagement Rate</p>
                                        <p className="text-2xl font-bold text-red-500 tabular-nums">
                                            {engRate(selectedCreator)}
                                        </p>
                                    </div>
                                    <div className="w-px h-10 bg-gray-100" />
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium">Post Status</p>
                                        <div className="mt-1">
                                            <StatusPill status={selectedCreator.status} />
                                        </div>
                                    </div>
                                </div>
                                {selectedCreator.insight?.last_updated && (
                                    <p className="text-xs text-gray-400">
                                        Last synced: {new Date(selectedCreator.insight.last_updated).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
