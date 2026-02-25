import { supabaseClient } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/ssr-server-client'

export async function POST(req: Request) {
    try {
        /**
         * -----------------------------------------
         */
        const supabase = await createClient()
        // ✅ Read Bearer token from Authorization header
        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token) {
            console.log('No token provided')
            return Response.json({ error: 'No token provided' }, { status: 401 })
        }

        /**
         * Ensure the user is logged in and Exists
         */
        // ✅ Pass token directly to getUser()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token)

        if (authError || !user) {
            console.log('Auth error:', authError)
            return Response.json({ error: 'User not authenticated' }, { status: 401 })
        }

        /**
         * ----------------------------------------------s
         */

        const { campaignId, videoUrl, caption, creatorUserId } = await req.json()
        const { data: account } = await supabaseClient
            .from('social_accounts')
            .select('*')
            .eq('user_id', creatorUserId)
            .eq('platform', 'tiktok')
            .single()

        if (!account) throw new Error('No TikTok account connected')

        // Step 1: Initialize Direct Post
        const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_info: {
                    source: 'PULL_FROM_URL',
                    video_url: videoUrl, // Public Supabase Storage URL
                },
                post_info: {
                    title: caption,
                    privacy_level: 'PUBLIC_TO_EVERYONE',
                    disable_duet: false,
                    disable_comment: false,
                    disable_stitch: false,
                },
            }),
        })

        const initJson = await initRes.json()
        if (!initJson.data?.publish_id) throw new Error('Init failed: ' + JSON.stringify(initJson))

        const publishId = initJson.data.publish_id

        // Step 2: Publish (TikTok processes async – status via /status/fetch)
        const publishRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/publish/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publish_id: publishId }),
        })

        const publishJson = await publishRes.json()

        // Poll status in production (or use webhook if enabled)
        // For now, assume success and store
        await supabaseClient.from('campaign_posts').insert({
            campaign_id: campaignId,
            platform: 'tiktok',
            media_id: publishId,
            video_url: videoUrl,
            status: 'PROCESSING',
        })

        return Response.json({ success: true, publishId })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Generation failed' }, { status: 500 })
    }
}
