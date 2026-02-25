import { NextResponse } from 'next/server'
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

        const { campaignId } = await req.json()
        if (!campaignId) {
            return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
        }

        // Get all TikTok posts for this campaign
        const { data: posts, error: postsError } = await supabaseClient
            .from('campaign_posts')
            .select('media_id, platform')
            .eq('campaign_id', campaignId)
            .eq('platform', 'tiktok')

        if (postsError) throw postsError
        if (!posts || posts.length === 0) {
            return NextResponse.json({ message: 'No TikTok posts found' })
        }

        for (const post of posts) {
            // Get TikTok access token (simplified; ideally match creator)
            const { data: account, error: accountError } = await supabaseClient
                .from('social_accounts')
                .select('access_token')
                .eq('platform', 'tiktok')
                .single() // assumes only one TikTok account

            if (accountError || !account) continue

            // Fetch TikTok video insights
            const res = await fetch('https://open.tiktokapis.com/v2/video/query/', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${account.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_ids: [post.media_id] }),
            })

            const json = await res.json()
            const videoData = json.data?.videos?.[0]

            if (!videoData) continue

            // Upsert insights to Supabase
            await supabaseClient.from('campaign_insights').upsert({
                campaign_id: campaignId,
                platform: 'tiktok',
                media_id: post.media_id,
                likes: videoData.like_count || 0,
                comments: videoData.comment_count || 0,
                views: videoData.view_count || 0,
                shares: videoData.share_count || 0,
                last_updated: new Date().toISOString(),
            })
        }

        return NextResponse.json({ message: 'TikTok insights updated successfully' })
    } catch (err: any) {
        console.error('Error updating TikTok insights:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
