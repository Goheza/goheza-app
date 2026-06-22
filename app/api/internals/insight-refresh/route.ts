// app/api/internals/tiktok-insight-refresh/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function refreshInsightForPost(mediaId: string, campaignId: string, userId: string) {
    // ── Get creator's TikTok token ────────────────────────────────────
    const { data: account, error: accountError } = await supabaseAdmin
        .from('social_accounts')
        .select('access_token, refresh_token, expires_at')
        .eq('platform', 'tiktok')
        .eq('user_id', userId)
        .single()

    if (accountError || !account) {
        throw new Error(`No TikTok account for user ${userId}`)
    }

    // ── Normalize expires_at to UTC ───────────────────────────────────
    const rawExpiry = account.expires_at as string
    const normalizedExpiry = rawExpiry.endsWith('Z') || rawExpiry.includes('+') ? rawExpiry : rawExpiry + 'Z'

    let accessToken = account.access_token

    // ── Refresh token if expired (with 5-min buffer) ──────────────────
    const BUFFER_MS = 5 * 60 * 1000
    const isExpired = new Date(normalizedExpiry).getTime() <= Date.now() + BUFFER_MS

    if (isExpired) {
        const refreshRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: process.env.TIKTOK_CLIENT_KEY!,
                client_secret: process.env.TIKTOK_CLIENT_SECRET!,
                grant_type: 'refresh_token',
                refresh_token: account.refresh_token,
            }),
        })

        const refreshData = await refreshRes.json()

        if (!refreshRes.ok) {
            throw new Error(`Token refresh failed for user ${userId}: ${JSON.stringify(refreshData)}`)
        }

        accessToken = refreshData.access_token

        await supabaseAdmin
            .from('social_accounts')
            .update({
                access_token: refreshData.access_token,
                refresh_token: refreshData.refresh_token,
                expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
            })
            .eq('user_id', userId)
            .eq('platform', 'tiktok')
    }

    // ── Query TikTok for metrics ──────────────────────────────────────
    const fields = 'like_count,comment_count,view_count,share_count,cover_image_url'
    const tiktokRes = await fetch(`https://open.tiktokapis.com/v2/video/query/?fields=${fields}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filters: { video_ids: [mediaId] },
        }),
    })

    const tiktokJson = await tiktokRes.json()
    const videoData = tiktokJson.data?.videos?.[0]

    if (!videoData) {
        throw new Error(`TikTok returned no data for media_id ${mediaId}`)
    }

    // ── Update thumbnail in campaign_posts ────────────────────────────
    if (videoData.cover_image_url) {
        await supabaseAdmin
            .from('campaign_posts')
            .update({ thumbnail_url: videoData.cover_image_url })
            .eq('campaign_id', campaignId)
            .eq('media_id', mediaId)
    }

    // ── Upsert into campaign_insights ─────────────────────────────────
    const { error: upsertError } = await supabaseAdmin.from('campaign_insights').upsert(
        {
            campaign_id: campaignId,
            media_id: mediaId,
            likes: videoData.like_count ?? 0,
            comments: videoData.comment_count ?? 0,
            views: videoData.view_count ?? 0,
            shares: videoData.share_count ?? 0,
            last_updated: new Date().toISOString(),
        },
        { onConflict: 'campaign_id, media_id' }
    )

    if (upsertError) {
        throw new Error(`Upsert failed for media_id ${mediaId}: ${upsertError.message}`)
    }

    return mediaId
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)

        const auth = searchParams.get('auth')
        const campaignName = searchParams.get('campaign_name')

        // ── Auth ──────────────────────────────────────────────────────
        if (auth !== process.env.INTERNAL_API_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!campaignName) {
            return NextResponse.json({ error: 'campaign_name is required' }, { status: 400 })
        }

        // ── Find campaign ─────────────────────────────────────────────
        const { data: campaign, error: campaignError } = await supabaseAdmin
            .from('campaigns')
            .select('id, name')
            .ilike('name', campaignName)
            .eq('status', 'approved')
            .single()

        if (campaignError || !campaign) {
            return NextResponse.json({ error: `Campaign "${campaignName}" not found` }, { status: 404 })
        }

        // ── Fetch published TikTok posts ──────────────────────────────
        const { data: posts, error: postsError } = await supabaseAdmin
            .from('campaign_posts')
            .select('media_id, campaign_id, user_id')
            .eq('campaign_id', campaign.id)
            .eq('status', 'PUBLISHED')
            .eq('platform', 'tiktok')

        if (postsError) {
            return NextResponse.json({ error: postsError.message }, { status: 500 })
        }

        if (!posts || posts.length === 0) {
            return NextResponse.json({
                message: `No published TikTok posts found for "${campaign.name}"`,
            })
        }

        // ── Refresh insights for each post ────────────────────────────
        const results = await Promise.allSettled(
            posts.map((post) => refreshInsightForPost(post.media_id, post.campaign_id, post.user_id))
        )

        const succeeded: string[] = []
        const failed: { media_id: string; user_id: string; reason: string; stack?: string }[] = []

        ///sdssdsdsdsdsdsdsdsdsdsdsdsdsdsdmfnnf
        results.forEach((result, i) => {
            const post = posts[i]
            if (result.status === 'fulfilled') {
                succeeded.push(result.value)
            } else {
                const err = result.reason
                failed.push({
                    media_id: post.media_id,
                    user_id: post.user_id,
                    reason: err?.message ?? 'Unknown error',
                    stack: err?.stack ?? undefined,
                })
            }
        })

        return NextResponse.json({
            campaign: campaign.name,
            total: posts.length,
            succeeded: succeeded.length,
            failed: failed.length,
            ...(succeeded.length > 0 && { succeeded_media_ids: succeeded }),
            ...(failed.length > 0 && { failures: failed }),
        })
    } catch (err: any) {
        console.error('insight-refresh error:', err)
        return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
    }
}
