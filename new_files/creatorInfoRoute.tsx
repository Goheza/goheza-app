import { createClient } from '@/lib/supabase/serverSideClient'

/**
 * GET /api/tiktok/creator-info
 *
 * Fetches TikTok creator info for a given user and returns it
 * in a clean shape the TikTokPostConsentScreen component can consume.
 *
 * Required body: { creatorUserId: string }
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { creatorUserId } = await req.json()

        if (!creatorUserId) {
            return Response.json({ error: 'Missing creatorUserId' }, { status: 400 })
        }

        // ── Fetch social account ─────────────────────────────────────────────
        const { data: account } = await supabase
            .from('social_accounts')
            .select('access_token, refresh_token, expires_at')
            .eq('user_id', creatorUserId)
            .eq('platform', 'tiktok')
            .single()

        if (!account) {
            return Response.json({ error: 'No TikTok account connected.' }, { status: 400 })
        }

        let accessToken = account.access_token

        // ── Token refresh if expired ─────────────────────────────────────────
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
                return Response.json({ error: 'Token refresh failed', details: refreshData }, { status: 400 })
            }
            accessToken = refreshData.access_token
            await supabase
                .from('social_accounts')
                .update({
                    access_token: refreshData.access_token,
                    refresh_token: refreshData.refresh_token,
                    expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
                })
                .eq('user_id', creatorUserId)
                .eq('platform', 'tiktok')
        }

        // ── Fetch creator info from TikTok ───────────────────────────────────
        const creatorInfoRes = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
            },
        })
        const creatorInfoJson = await creatorInfoRes.json()

        if (!creatorInfoRes.ok || !creatorInfoJson.data) {
            return Response.json(
                { error: 'Failed to fetch TikTok creator info', details: creatorInfoJson },
                { status: 400 }
            )
        }

        const data = creatorInfoJson.data

        // ── Return clean shape for the consent screen ────────────────────────
        return Response.json({
            nickname: data.creator_nickname ?? data.nickname ?? 'Unknown',
            avatar_url: data.creator_avatar_url ?? data.avatar_url ?? null,
            privacy_level_options: data.privacy_level_options ?? [],
            comment_disabled: data.comment_disabled ?? false,
            duet_disabled: data.duet_disabled ?? false,
            stitch_disabled: data.stitch_disabled ?? false,
            max_video_post_duration_sec: data.max_video_post_duration_sec ?? 600,
        })
    } catch (error) {
        console.error('Error fetching TikTok creator info:', error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
