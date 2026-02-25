import { createClient } from '@/lib/supabase/ssr-server-client'

export async function POST(req: Request) {
    try {
        /**
         * -----------------------------------------
         */
        const supabase = await createClient()

        // ✅ Read Bearer token from Authorization header
        const authHeader = req.headers.get('Authorization')
        const __token = authHeader?.replace('Bearer ', '')

        if (!__token) {
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
        } = await supabase.auth.getUser(__token)

        if (authError || !user) {
            console.log('Auth error:', authError)
            return Response.json({ error: 'User not authenticated' }, { status: 401 })
        }

        /**
         * ----------------------------------------------s
         */

        const { campaignId, videoUrl, caption, creatorId, isReel = true } = await req.json() // videoUrl = public Supabase Storage URL

        const { data: account } = await supabase
            .from('social_accounts')
            .select('instagram_business_id, access_token')
            .eq('user_id', creatorId)
            .single()

        //@ts-ignore
        const igUserId = account.instagram_business_id
        //@ts-ignore

        const token = account.access_token

        // Step 1: Create media container
        const containerRes = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media`, {
            method: 'POST',
            body: new URLSearchParams({
                media_type: isReel ? 'REELS' : 'VIDEO',
                video_url: videoUrl,
                caption,
                access_token: token,
            }),
        })

        const { id: containerId } = await containerRes.json()

        // Step 2: Publish (wait for container to be ready – poll status in production)
        const publishRes = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media_publish`, {
            method: 'POST',
            body: new URLSearchParams({
                creation_id: containerId,
                access_token: token,
            }),
        })

        const { id: mediaId } = await publishRes.json()

        // Get permalink & thumbnail (optional)
        const mediaInfo = await fetch(
            `https://graph.facebook.com/v20.0/${mediaId}?fields=permalink,thumbnail_url,media_product_type&access_token=${token}`
        )
        const { permalink, thumbnail_url, media_product_type } = await mediaInfo.json()

        await supabase.from('campaign_posts').insert({
            campaign_id: campaignId,
            media_id: mediaId,
            permalink,
            thumbnail_url,
            media_product_type,
        })

        return Response.json({ success: true, mediaId })
    } catch (err: any) {
        console.error('Error with Instagram Post:', err)
        return Response.json({ error: err.message }, { status: 500 })
    }
}
