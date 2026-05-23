import { createClient } from '@/lib/supabase/serverSideClient'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { campaignId, videoUrl, caption, creatorUserId } = await req.json()

        if (!campaignId || !videoUrl) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data: account } = await supabase
            .from('social_accounts')
            .select('access_token, refresh_token, expires_at')
            .eq('user_id', creatorUserId)
            .eq('platform', 'tiktok')
            .single()

        if (!account) {
            return Response.json({ error: `No TikTok account connected: ${creatorUserId}` }, { status: 400 })
        }

        let accessToken = account.access_token

        // ── Token refresh ────────────────────────────────────────────────
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

        // ── Step 1: Query creator info to get allowed privacy levels ─────
        const creatorInfoRes = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
            },
        })
        const creatorInfoJson = await creatorInfoRes.json()
        console.log('TikTok creator info:', JSON.stringify(creatorInfoJson, null, 2))

        if (!creatorInfoRes.ok || !creatorInfoJson.data) {
            return Response.json({ error: 'Failed to fetch creator info', details: creatorInfoJson }, { status: 400 })
        }

        const privacyOptions: string[] = creatorInfoJson.data.privacy_level_options ?? []

        // Pick the most public level available, falling back down the list
        const preferredLevels = ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY']
        const privacyLevel = preferredLevels.find((lvl) => privacyOptions.includes(lvl)) ?? 'SELF_ONLY'

        console.log(`Using privacy level: ${privacyLevel} (available: ${privacyOptions.join(', ')})`)

        // ── Step 2: Init the post with the correct privacy level ─────────
        const filename = videoUrl.split('/').pop()
        const proxyVideoUrl = `https://goheza.com/api/video/${filename}`

        const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                post_info: {
                    title: caption,
                    privacy_level: privacyLevel,
                    disable_duet: false,
                    disable_comment: false,
                    disable_stitch: false,
                },
                source_info: {
                    source: 'PULL_FROM_URL',
                    video_url: proxyVideoUrl,
                },
            }),
        })

        const initJson = await initRes.json()
        console.log('TikTok init response:', JSON.stringify(initJson, null, 2))

        if (!initRes.ok || !initJson.data?.publish_id) {
            return Response.json({ error: 'Init failed', details: initJson }, { status: 400 })
        }

        const publishId = initJson.data.publish_id

        await supabase.from('campaign_posts').insert({
            campaign_id: campaignId,
            platform: 'tiktok',
            media_id: publishId,
            permalink: videoUrl,
            posted_at: new Date().toISOString(),
        })

        return Response.json({ success: true, publishId, privacyLevel })
    } catch (error) {
        console.error('Unexpected error posting to TikTok:', error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
