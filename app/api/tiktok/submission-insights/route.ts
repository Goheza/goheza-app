import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/serverSideClient'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()

        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }


        console.log("Fuck NextJS")
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token)
        if (authError || !user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
        }

        const body = await req.json()
        const { submissionId, mediaId, campaignId: campaignIdFromBody } = body

        let campaign_id: string
        let user_id: string
        let videoId: string

        console.log("body-data",{
            mediaId,
            campaignIdFromBody
        })
        if (submissionId) {
            // ── Path A: called with submissionId (creator just submitted URL) ──
            const { data: submission, error: submissionError } = await supabase
                .from('campaign_submissions')
                .select('campaign_id, user_id, tiktok_url')
                .eq('id', submissionId)
                .single()

            if (submissionError || !submission) {
                return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
            }

            if (!submission.tiktok_url) {
                return NextResponse.json({ error: 'No TikTok URL on this submission' }, { status: 400 })
            }

            const match = submission.tiktok_url.match(/\/video\/(\d+)/)
            if (!match) {
                return NextResponse.json({ error: 'Could not extract video ID from TikTok URL' }, { status: 400 })
            }

            campaign_id = submission.campaign_id
            user_id = submission.user_id
            videoId = match[1]
        } else if (mediaId && campaignIdFromBody) {
            // ── Path B: called with mediaId + campaignId (brand opens drill-down) ──
            // Look up the submission to get user_id via campaign_id + tiktok_url containing mediaId
            const { data: submission, error: submissionError } = await supabase
                .from('campaign_submissions')
                .select('user_id')
                .eq('campaign_id', campaignIdFromBody)
                .ilike('tiktok_url', `%/video/${mediaId}%`)
                .single()

            if (submissionError || !submission) {
                return NextResponse.json({ error: 'Could not find matching submission' }, { status: 404 })
            }

            campaign_id = campaignIdFromBody
            user_id = submission.user_id
            videoId = mediaId
        } else {
            return NextResponse.json(
                { error: 'Provide either submissionId or both mediaId and campaignId' },
                { status: 400 }
            )
        }

        // ── Get creator's TikTok token ────────────────────────────────────
        const { data: account, error: accountError } = await supabase
            .from('social_accounts')
            .select('access_token, refresh_token, expires_at')
            .eq('platform', 'tiktok')
            .eq('user_id', user_id)
            .single()

        if (accountError || !account) {
            return NextResponse.json({ error: 'Creator TikTok account not connected' }, { status: 400 })
        }

        let accessToken = account.access_token

        // ── Refresh token if expired ──────────────────────────────────────
        if (new Date(account.expires_at) <= new Date()) {
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
                return NextResponse.json({ error: 'Token refresh failed' }, { status: 400 })
            }

            accessToken = refreshData.access_token

            await supabase
                .from('social_accounts')
                .update({
                    access_token: refreshData.access_token,
                    refresh_token: refreshData.refresh_token,
                    expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
                })
                .eq('user_id', user_id)
                .eq('platform', 'tiktok')
        }
        // ── Query TikTok for metrics ──────────────────────────────────────
        const tiktokRes = await fetch('https://open.tiktokapis.com/v2/video/query/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filters: { video_ids: [videoId] },
                fields: ['like_count', 'comment_count', 'view_count', 'share_count', 'cover_image_url'],
            }),
        })

        const tiktokJson = await tiktokRes.json()

        // ── LOGS MUST BE HERE — before the early return ──────────────────
        console.log('videoId being queried:', videoId)
        console.log('TikTok response status:', tiktokRes.status)
        console.log('TikTok full response:', JSON.stringify(tiktokJson, null, 2))

        const videoData = tiktokJson.data?.videos?.[0]
        console.log('videoData found:', !!videoData)

        if (!videoData) {
            return NextResponse.json(
                { error: 'TikTok returned no data for this video. It may still be processing.' },
                { status: 200 }
            )
        }
        console.log('TikTok response status:', tiktokRes.status)
        console.log('TikTok full response:', JSON.stringify(tiktokJson, null, 2))
        console.log('videoData found:', !!videoData)

        // ── Update thumbnail in campaign_posts ────────────────────────────
        if (videoData.cover_image_url) {
            await supabase
                .from('campaign_posts')
                .update({ thumbnail_url: videoData.cover_image_url })
                .eq('campaign_id', campaign_id)
                .eq('media_id', videoId)
        }

        // ── Upsert into campaign_insights ─────────────────────────────────
        const { error: upsertError } = await supabase.from('campaign_insights').upsert(
            {
                campaign_id,
                platform: 'tiktok',
                media_id: videoId,
                likes: videoData.like_count ?? 0,
                comments: videoData.comment_count ?? 0,
                views: videoData.view_count ?? 0,
                shares: videoData.share_count ?? 0,
                last_updated: new Date().toISOString(),
            },
            { onConflict: 'campaign_id, media_id' }
        )

        if (upsertError) {
            return NextResponse.json({ error: 'Failed to save insights' }, { status: 500 })
        }

        return NextResponse.json({ success: true, media_id: videoId })
    } catch (err) {
        console.error('submission-insights error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
