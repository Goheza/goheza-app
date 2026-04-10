'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { FetchPostsForCampaign, FetchInsightsForCampaign } from '@/lib/appServiceData/social-media/fetch/fetchInsights'
import { UpdateInsightsForCampaignTk } from '@/lib/appServiceData/social-media/tiktok/update-insights-tk'
import { supabaseClient } from '@/lib/supabase/client'
// ────────────────────────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

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
    platform: 'tiktok' | 'instagram'
    media_id: string
    permalink: string | null
    video_url: string | null
    thumbnail_url: string | null
    media_type: string | null
    status: string
    posted_at: string
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

type MetricKey = 'views' | 'likes' | 'comments' | 'shares' | 'reach' | 'impressions' | 'saves'
type SortDir = 'asc' | 'desc'

// ─── Pure helpers (no JSX) ────────────────────────────────────────────────────

function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return n.toLocaleString()
}

function engRate(p: PostWithInsight): string {
    if (!p.insight || !p.insight.views) return '—'
    const rate = ((p.insight.likes + p.insight.comments + p.insight.shares) / p.insight.views) * 100
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
            const r = ((p.insight!.likes + p.insight!.comments + p.insight!.shares) / p.insight!.views) * 100
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
        'Shares',
        'Reach',
        'Impressions',
        'Saves',
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
        p.insight?.shares ?? 0,
        p.insight?.reach ?? 0,
        p.insight?.impressions ?? 0,
        p.insight?.saves ?? 0,
        engRate(p),
        p.insight?.last_updated ? new Date(p.insight.last_updated).toLocaleString() : '—',
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaignName.replace(/\s+/g, '_')}_tiktok_analytics.csv`
    a.click()
    URL.revokeObjectURL(url)
}

// ─── Small presentational components ─────────────────────────────────────────

function Th({ children }: { children?: ReactNode }) {
    return <th style={s.th}>{children}</th>
}

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
            style={{ ...s.th, cursor: 'pointer', userSelect: 'none', color: active ? '#D85A30' : '#999' }}
            onClick={() => onSort(k)}
        >
            {label} {active ? (dir === 'desc' ? '↓' : '↑') : '↕'}
        </th>
    )
}

function Bar({ value, max, color = '#D85A30' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
        <div style={{ background: '#F1EFE8', borderRadius: 4, height: 5, width: 80, marginTop: 4 }}>
            <div style={{ background: color, borderRadius: 4, height: 5, width: `${pct}%` }} />
        </div>
    )
}

function StatusPill({ status }: { status: string }) {
    const bg = status === 'PUBLISHED' ? '#EAF3DE' : status === 'PROCESSING' ? '#FAEEDA' : '#FCEBEB'
    const color = status === 'PUBLISHED' ? '#3B6D11' : status === 'PROCESSING' ? '#854F0B' : '#A32D2D'
    return (
        <span
            style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 99,
                background: bg,
                color,
            }}
        >
            {status}
        </span>
    )
}

function CampaignStatusPill({ status }: { status: string }) {
    const bg = status === 'approved' ? '#EAF3DE' : status === 'inreview' ? '#FAEEDA' : '#F1EFE8'
    const color = status === 'approved' ? '#3B6D11' : status === 'inreview' ? '#854F0B' : '#5F5E5A'
    return (
        <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 8px', borderRadius: 99, background: bg, color }}>
            {status}
        </span>
    )
}

function EngagementDonut({ posts }: { posts: PostWithInsight[] }) {
    const likes = sumMetric(posts, 'likes')
    const comments = sumMetric(posts, 'comments')
    const shares = sumMetric(posts, 'shares')
    const saves = sumMetric(posts, 'saves')
    const total = likes + comments + shares + saves

    const segments = [
        { label: 'Likes', value: likes, color: '#D85A30' },
        { label: 'Comments', value: comments, color: '#534AB7' },
        { label: 'Shares', value: shares, color: '#1D9E75' },
        { label: 'Saves', value: saves, color: '#BA7517' },
    ]

    if (!total) {
        return (
            <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '2rem 0', margin: 0 }}>
                No engagement data yet
            </p>
        )
    }

    const cx = 70,
        cy = 70,
        outerR = 50,
        innerR = 32
    let angle = -Math.PI / 2

    const arcs = segments.map((seg) => {
        const slice = (seg.value / total) * Math.PI * 2
        const x1 = cx + outerR * Math.cos(angle)
        const y1 = cy + outerR * Math.sin(angle)
        angle += slice
        const x2 = cx + outerR * Math.cos(angle)
        const y2 = cy + outerR * Math.sin(angle)
        const ix1 = cx + innerR * Math.cos(angle)
        const iy1 = cy + innerR * Math.sin(angle)
        const ix2 = cx + innerR * Math.cos(angle - slice)
        const iy2 = cy + innerR * Math.sin(angle - slice)
        const large = slice > Math.PI ? 1 : 0
        const d = [
            `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
            `A ${outerR} ${outerR} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
            `L ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
            `A ${innerR} ${innerR} 0 ${large} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
            'Z',
        ].join(' ')
        return { ...seg, d, pct: Math.round((seg.value / total) * 100) }
    })

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 20 }}>
            <svg width={140} height={140} viewBox="0 0 140 140" aria-hidden="true">
                {arcs.map((a) => (
                    <path key={a.label} d={a.d} fill={a.color} />
                ))}
                <text x={70} y={66} textAnchor="middle" fontSize={11} fill="#999">
                    Total
                </text>
                <text x={70} y={81} textAnchor="middle" fontSize={14} fontWeight={500} fill="#111">
                    {fmt(total)}
                </text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {arcs.map((a) => (
                    <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: a.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#666' }}>{a.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 'auto' }}>{a.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function TikTokIcon() {
    return (
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.96a8.17 8.17 0 004.78 1.52V7.01a4.85 4.85 0 01-1.01-.32z"
                fill="currentColor"
            />
        </svg>
    )
}

/**
 * Spinning refresh icon.
 * The @keyframes rule is injected once in the page root via a <style> tag —
 * NOT inside the SVG, which would cause React hydration warnings in Next.js.
 */
function RefreshIcon({ spinning }: { spinning: boolean }) {
    return (
        <span style={{ display: 'inline-flex', animation: spinning ? 'goheza-spin 1s linear infinite' : 'none' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                    d="M4 12a8 8 0 018-8V2l4 4-4 4V8a6 6 0 100 6"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    )
}

function DownloadIcon() {
    return (
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 16l-4-4h3V4h2v8h3l-4 4zm-7 4v-2h14v2H5z" fill="currentColor" />
        </svg>
    )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

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

    // Load campaign list on mount
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

    // Load posts + insights whenever the selected campaign changes
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

    // Pull fresh stats from TikTok then reload
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

    // Derived state
    const tiktokPosts = posts.filter((p) => p.platform === 'tiktok')

    const sorted = [...tiktokPosts].sort((a, b) => {
        const av = a.insight?.[sortKey] ?? 0
        const bv = b.insight?.[sortKey] ?? 0
        return sortDir === 'desc' ? bv - av : av - bv
    })

    function toggleSort(key: MetricKey) {
        if (key === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
        else {
            setSortKey(key)
            setSortDir('desc')
        }
    }

    const maxViews = Math.max(...tiktokPosts.map((p) => p.insight?.views ?? 0), 1)
    const selectedCampaign = campaigns.find((c) => c.id === selectedId)
    const publishedCount = tiktokPosts.filter((p) => p.status === 'PUBLISHED').length

    const totals = {
        views: sumMetric(tiktokPosts, 'views'),
        likes: sumMetric(tiktokPosts, 'likes'),
        comments: sumMetric(tiktokPosts, 'comments'),
        shares: sumMetric(tiktokPosts, 'shares'),
        reach: sumMetric(tiktokPosts, 'reach'),
        impressions: sumMetric(tiktokPosts, 'impressions'),
    }

    return (
        <>
            {/* Spinner keyframe — placed here so it's injected once at the page root, not inside an SVG */}
            <style>{`@keyframes goheza-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            <div style={s.page}>
                {/* Top bar */}
                <div style={s.topbar}>
                    <div>
                        <h1 style={s.pageTitle}>Analytics</h1>
                        <p style={s.pageSub}>TikTok campaign performance overview</p>
                    </div>
                    <div style={s.topbarRight}>
                        {lastRefreshed && (
                            <span style={s.refreshedAt}>Updated {lastRefreshed.toLocaleTimeString()}</span>
                        )}
                        <select
                            style={s.select}
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            aria-label="Select campaign"
                        >
                            {campaigns.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <button
                            style={{ ...s.btnSecondary, opacity: refreshing ? 0.6 : 1 }}
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <RefreshIcon spinning={refreshing} />
                            {refreshing ? 'Refreshing…' : 'Refresh'}
                        </button>
                        <button
                            style={{ ...s.btnPrimary, opacity: !tiktokPosts.length ? 0.5 : 1 }}
                            onClick={() => selectedCampaign && downloadCSV(tiktokPosts, selectedCampaign.name)}
                            disabled={!tiktokPosts.length}
                        >
                            <DownloadIcon />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div role="alert" style={s.errorBanner}>
                        <span>{error}</span>
                        <button style={s.errorDismiss} onClick={() => setError(null)}>
                            ✕
                        </button>
                    </div>
                )}

                {/* Platform + campaign status */}
                <div style={s.platformRow}>
                    <span style={s.platformBadge}>
                        <TikTokIcon />
                        TikTok · {tiktokPosts.length} post{tiktokPosts.length !== 1 ? 's' : ''}
                    </span>
                    {selectedCampaign && <CampaignStatusPill status={selectedCampaign.status} />}
                </div>

                {loading ? (
                    <div style={s.loadingState} role="status" aria-live="polite">
                        Loading analytics…
                    </div>
                ) : (
                    <>
                        {/* Metric cards */}
                        <div style={s.metricsGrid}>
                            {(
                                [
                                    {
                                        label: 'Total views',
                                        value: totals.views,
                                        sub: 'All TikTok posts',
                                        accent: '#D85A30',
                                    },
                                    {
                                        label: 'Total likes',
                                        value: totals.likes,
                                        sub: `${avgEngRate(tiktokPosts)} avg eng.`,
                                        accent: '#534AB7',
                                    },
                                    {
                                        label: 'Comments',
                                        value: totals.comments,
                                        sub: 'Direct responses',
                                        accent: '#1D9E75',
                                    },
                                    {
                                        label: 'Shares',
                                        value: totals.shares,
                                        sub: 'Viral amplification',
                                        accent: '#BA7517',
                                    },
                                    {
                                        label: 'Total reach',
                                        value: totals.reach,
                                        sub: 'Unique accounts',
                                        accent: '#D4537E',
                                    },
                                    {
                                        label: 'Impressions',
                                        value: totals.impressions,
                                        sub: 'Total exposures',
                                        accent: '#378ADD',
                                    },
                                ] as const
                            ).map((m) => (
                                <div key={m.label} style={s.metricCard}>
                                    <div style={{ ...s.metricAccent, background: m.accent }} />
                                    <div style={s.metricLabel}>{m.label}</div>
                                    <div style={s.metricValue}>{fmt(m.value)}</div>
                                    <div style={s.metricSub}>{m.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* Charts row */}
                        <div style={s.chartsRow}>
                            <div style={s.chartCard}>
                                <div style={s.chartTitle}>Views per post</div>
                                <div style={s.chartSubtitle}>Relative performance across published posts</div>
                                <div style={{ marginTop: 16 }}>
                                    {tiktokPosts.filter((p) => (p.insight?.views ?? 0) > 0).length === 0 ? (
                                        <p style={s.emptyChart}>No published data yet</p>
                                    ) : (
                                        [...tiktokPosts]
                                            .filter((p) => (p.insight?.views ?? 0) > 0)
                                            .sort((a, b) => (b.insight?.views ?? 0) - (a.insight?.views ?? 0))
                                            .map((p) => (
                                                <div key={p.id} style={s.chartBarRow}>
                                                    <span style={s.chartBarLabel} title={p.media_id}>
                                                        {p.media_id.slice(-8)}
                                                    </span>
                                                    <div style={s.chartBarTrack}>
                                                        <div
                                                            style={{
                                                                ...s.chartBarFill,
                                                                width: `${Math.round(
                                                                    ((p.insight?.views ?? 0) / maxViews) * 100
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={s.chartBarVal}>{fmt(p.insight?.views ?? 0)}</span>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>

                            <div style={s.chartCard}>
                                <div style={s.chartTitle}>Engagement breakdown</div>
                                <div style={s.chartSubtitle}>Distribution across interaction types</div>
                                <EngagementDonut posts={tiktokPosts} />
                            </div>
                        </div>

                        {/* Per-post table */}
                        <div style={s.tableCard}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={s.chartTitle}>Per-post breakdown</div>
                                <div style={s.chartSubtitle}>
                                    Click a metric column to sort · {publishedCount} published
                                </div>
                            </div>

                            {sorted.length === 0 ? (
                                <div style={s.emptyTable}>No TikTok posts found for this campaign.</div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={s.table}>
                                        <thead>
                                            <tr>
                                                <Th>Post</Th>
                                                <Th>Status</Th>
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
                                                <SortTh
                                                    label="Shares"
                                                    k="shares"
                                                    cur={sortKey}
                                                    dir={sortDir}
                                                    onSort={toggleSort}
                                                />
                                                <SortTh
                                                    label="Reach"
                                                    k="reach"
                                                    cur={sortKey}
                                                    dir={sortDir}
                                                    onSort={toggleSort}
                                                />
                                                <Th>Eng. rate</Th>
                                                <Th>Posted</Th>
                                                <Th>Updated</Th>
                                                <Th></Th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sorted.map((p, i) => (
                                                <tr key={p.id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                                                    <td style={s.tdPost}>
                                                        <div style={s.postCell}>
                                                            <div style={s.postThumb}>
                                                                {p.thumbnail_url ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={p.thumbnail_url}
                                                                        alt={`Thumbnail for post ${p.media_id}`}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit: 'cover',
                                                                            borderRadius: 6,
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <span style={{ fontSize: 18 }}>🎵</span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div style={s.postMediaId}>{p.media_id}</div>
                                                                <div style={s.postType}>{p.media_type ?? 'VIDEO'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={s.td}>
                                                        <StatusPill status={p.status} />
                                                    </td>
                                                    <td style={s.tdNum}>
                                                        <div>{fmt(p.insight?.views ?? 0)}</div>
                                                        <Bar
                                                            value={p.insight?.views ?? 0}
                                                            max={maxViews}
                                                            color="#D85A30"
                                                        />
                                                    </td>
                                                    <td style={s.tdNum}>{fmt(p.insight?.likes ?? 0)}</td>
                                                    <td style={s.tdNum}>{fmt(p.insight?.comments ?? 0)}</td>
                                                    <td style={s.tdNum}>{fmt(p.insight?.shares ?? 0)}</td>
                                                    <td style={s.tdNum}>{fmt(p.insight?.reach ?? 0)}</td>
                                                    <td style={s.tdNum}>{engRate(p)}</td>
                                                    <td style={s.tdMuted}>
                                                        {new Date(p.posted_at).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: '2-digit',
                                                        })}
                                                    </td>
                                                    <td style={s.tdMuted}>
                                                        {p.insight?.last_updated
                                                            ? new Date(p.insight.last_updated).toLocaleDateString(
                                                                  'en-GB',
                                                                  {
                                                                      day: 'numeric',
                                                                      month: 'short',
                                                                  }
                                                              )
                                                            : '—'}
                                                    </td>
                                                    <td style={s.td}>
                                                        {p.permalink && p.status === 'PUBLISHED' ? (
                                                            <a
                                                                href={p.permalink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={s.viewLink}
                                                            >
                                                                View ↗
                                                            </a>
                                                        ) : (
                                                            '—'
                                                        )}
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
            </div>
        </>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
//
// Typed as Record<string, CSSProperties> — plain objects only.
// Dynamic styles (those depending on runtime values like accent colour or
// status strings) are composed inline in JSX so we never need function-values
// in this map, which would break the TypeScript type.

const s: Record<string, CSSProperties> = {
    page: { padding: '2rem 1.5rem', maxWidth: 1140, margin: '0 auto', fontFamily: 'inherit' },
    topbar: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: '1.75rem',
    },
    pageTitle: { fontSize: 24, fontWeight: 600, color: '#111', margin: 0 },
    pageSub: { fontSize: 14, color: '#666', marginTop: 4 },
    topbarRight: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    refreshedAt: { fontSize: 12, color: '#999' },
    select: {
        fontSize: 13,
        padding: '7px 12px',
        borderRadius: 8,
        border: '1px solid #e0e0e0',
        background: '#fff',
        color: '#111',
        cursor: 'pointer',
        minWidth: 180,
    },
    btnPrimary: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 500,
        padding: '7px 16px',
        borderRadius: 8,
        border: 'none',
        background: '#D85A30',
        color: '#fff',
        cursor: 'pointer',
    },
    btnSecondary: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        padding: '7px 14px',
        borderRadius: 8,
        border: '1px solid #e0e0e0',
        background: '#fff',
        color: '#333',
        cursor: 'pointer',
    },
    errorBanner: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FCEBEB',
        border: '1px solid #F09595',
        color: '#A32D2D',
        borderRadius: 8,
        padding: '10px 16px',
        fontSize: 13,
        marginBottom: 16,
    },
    errorDismiss: { background: 'none', border: 'none', color: '#A32D2D', cursor: 'pointer', fontSize: 14, padding: 0 },
    platformRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' },
    platformBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 6,
        background: '#EEEDFE',
        color: '#3C3489',
        border: '1px solid #AFA9EC',
    },
    loadingState: { textAlign: 'center', padding: '4rem', color: '#888', fontSize: 14 },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
        marginBottom: '1.5rem',
    },
    metricCard: {
        background: '#F8F7F5',
        borderRadius: 10,
        padding: '1rem 1.1rem',
        position: 'relative',
        overflow: 'hidden',
    },
    metricAccent: { position: 'absolute', top: 0, left: 0, width: 3, height: '100%', borderRadius: '10px 0 0 10px' },
    metricLabel: { fontSize: 12, color: '#888', marginBottom: 6, paddingLeft: 6 },
    metricValue: { fontSize: 26, fontWeight: 600, color: '#111', paddingLeft: 6 },
    metricSub: { fontSize: 11, color: '#aaa', marginTop: 4, paddingLeft: 6 },
    chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.5rem' },
    chartCard: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '1.25rem' },
    chartTitle: { fontSize: 15, fontWeight: 500, color: '#111' },
    chartSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
    chartBarRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
    chartBarLabel: {
        fontSize: 12,
        color: '#888',
        width: 72,
        flexShrink: 0,
        fontFamily: 'monospace',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    chartBarTrack: { flex: 1, background: '#F1EFE8', borderRadius: 4, height: 8, overflow: 'hidden' },
    chartBarFill: { height: 8, background: '#D85A30', borderRadius: 4, transition: 'width 0.5s ease' },
    chartBarVal: { fontSize: 12, color: '#555', fontWeight: 500, width: 44, textAlign: 'right' },
    emptyChart: { fontSize: 13, color: '#bbb', textAlign: 'center', padding: '2rem 0', margin: 0 },
    tableCard: {
        background: '#fff',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: '1.25rem',
        marginBottom: '2rem',
    },
    emptyTable: { textAlign: 'center', padding: '3rem', fontSize: 14, color: '#bbb' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: {
        textAlign: 'left',
        padding: '8px 12px',
        fontSize: 11,
        fontWeight: 600,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        borderBottom: '1px solid #f0f0f0',
        whiteSpace: 'nowrap',
    },
    td: { padding: '12px 12px', color: '#111', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle' },
    tdNum: {
        padding: '12px 12px',
        color: '#111',
        borderBottom: '1px solid #f8f8f8',
        verticalAlign: 'middle',
        fontVariantNumeric: 'tabular-nums',
        fontSize: 13,
    },
    tdMuted: {
        padding: '12px 12px',
        color: '#aaa',
        borderBottom: '1px solid #f8f8f8',
        verticalAlign: 'middle',
        fontSize: 12,
    },
    tdPost: { padding: '12px 12px', borderBottom: '1px solid #f8f8f8', verticalAlign: 'middle' },
    trEven: { background: '#fff' },
    trOdd: { background: '#FAFAF9' },
    postCell: { display: 'flex', alignItems: 'center', gap: 10 },
    postThumb: {
        width: 40,
        height: 40,
        borderRadius: 6,
        background: '#F1EFE8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
    },
    postMediaId: { fontSize: 13, fontWeight: 500, fontFamily: 'monospace', color: '#111' },
    postType: { fontSize: 11, color: '#aaa', marginTop: 2 },
    viewLink: { fontSize: 12, color: '#D85A30', textDecoration: 'none', fontWeight: 500 },
}
