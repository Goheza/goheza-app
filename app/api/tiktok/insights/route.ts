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

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
        }

        const { campaignId } = await req.json()
        if (!campaignId) {
            return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
        }

        // 🔒 Fetch only THIS user's TikTok account
        const { data: account, error: accountError } = await supabase
            .from('social_accounts')
            .select('access_token, refresh_token, expires_at')
            .eq('platform', 'tiktok')
            .eq('user_id', user.id)
            .single()

        if (accountError || !account) {
            return NextResponse.json({ error: 'TikTok account not connected' }, { status: 400 })
        }

        let accessToken = account.access_token

        // 🔄 OPTIONAL: Refresh token if expired
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
                .eq('user_id', user.id)
                .eq('platform', 'tiktok')
        }

        // 📦 Get campaign posts
        const { data: posts, error: postsError } = await supabase
            .from('campaign_posts')
            .select('media_id')
            .eq('campaign_id', campaignId)
            .eq('platform', 'tiktok')

        if (postsError) throw postsError
        if (!posts || posts.length === 0) {
            return NextResponse.json({ message: 'No TikTok posts found' })
        }

        for (const post of posts) {
            const res = await fetch('https://open.tiktokapis.com/v2/video/query/', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filters: { video_ids: [post.media_id] },
                    fields: ['like_count', 'comment_count', 'view_count', 'share_count'],
                }),
            })

            const json = await res.json()
            const videoData = json.data?.videos?.[0]

            if (!videoData) continue

            await supabase.from('campaign_insights').upsert({
                campaign_id: campaignId,
                platform: 'tiktok',
                media_id: post.media_id,
                likes: videoData.like_count ?? 0,
                comments: videoData.comment_count ?? 0,
                views: videoData.view_count ?? 0,
                shares: videoData.share_count ?? 0,
                last_updated: new Date().toISOString(),
            })
        }

        return NextResponse.json({
            message: 'TikTok insights updated successfully',
        })
    } catch (err: any) {
        console.error('Error updating TikTok insights:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
