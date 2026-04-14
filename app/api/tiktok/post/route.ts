import { createClient } from '@/lib/supabase/serverSideClient'

export async function POST(req: Request) {
    try {
        /**
         * Get the authorization and authentication tokens
         */
        const supabase = await createClient()
        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')
        if (!token) {
            return Response.json({ error: 'No token provided' }, { status: 401 })
        }

        /**
         * Compare the values
         */

        const { campaignId, videoUrl, caption, creatorUserId } = await req.json()
        if (!campaignId || !videoUrl) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 })
        }
        console.log("Current-Data",videoUrl)

        /**
         * get the user-account information
         */

        const { data: account } = await supabase
            .from('social_accounts')
            .select('access_token, refresh_token, expires_at')
            .eq('user_id', creatorUserId)
            .eq('platform', 'tiktok')
            .single()

        if (!account) {
            return Response.json({ error: `No tiktok Account Connected : ${creatorUserId}` }, { status: 400 })
        }

        let accessToken = account.access_token

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
                return Response.json({ error: 'Token refresh failed' }, { status: 400 })
            }
            accessToken = refreshData.access_token

            const { error: updateError } = await supabase
                .from('social_accounts')
                .update({
                    access_token: refreshData.access_token,
                    refresh_token: refreshData.refresh_token,
                    expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
                })
                .eq('user_id', creatorUserId)
                .eq('platform', 'tiktok')

            if (updateError) {
                console.error('Failed to persist refreshed token:', updateError)
            }
        }

        // ✅ Single init call is all that's needed for PULL_FROM_URL
        const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                post_info: {
                    title: caption,
                    privacy_level: 'PUBLIC_TO_EVERYONE',
                    disable_duet: false,
                    disable_comment: false,
                    disable_stitch: false,
                },
                source_info: {
                    source: 'PULL_FROM_URL',
                    video_url: videoUrl,
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
            video_url: videoUrl,
            status: 'PROCESSING',
            created_at: new Date().toISOString(),
        })

        return Response.json({ success: true, publishId })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
