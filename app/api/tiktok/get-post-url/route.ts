import { createClient } from '@/lib/supabase/serverSideClient'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()

        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')
        if (!token) {
            return Response.json({ error: 'No token provided' }, { status: 401 })
        }

        const { publishId,creatorId } = await req.json()
        if (!publishId) {
            return Response.json({ error: 'Missing publishId' }, { status: 400 })
        }

        const { data: account, error } = await supabase
            .from('social_accounts')
            .select('access_token, refresh_token, expires_at, username')
            .eq('user_id', creatorId)
            .eq('platform', 'tiktok')
            .single()

        if (error || !account) {
            return Response.json({ error: 'No TikTok account' }, { status: 400 })
        }

        let accessToken = account.access_token

        // 🔄 Refresh if expired
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
                .eq('user_id', creatorId)
                .eq('platform', 'tiktok')

            if (updateError) {
                console.error('Failed to persist refreshed token:', updateError)
            }
        }

        let username = account.username

        // 🔍 Fetch username if missing
        if (!username) {
            const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=username,display_name', {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            const userData = await userRes.json()
            console.log('TikTok user info response:', JSON.stringify(userData, null, 2))
            username = userData?.data?.user?.username

            if (username) {
                await supabase
                    .from('social_accounts')
                    .update({ username })
                    .eq('user_id', creatorId)
                    .eq('platform', 'tiktok')
            }
        }

        // 📊 Fetch publish status
        const statusRes = await fetch(
            'https://open.tiktokapis.com/v2/post/publish/status/fetch/?fields=status,video_id',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ publish_id: publishId }),
            }
        )

        const statusData = await statusRes.json()
        console.log('TikTok status response:', JSON.stringify(statusData, null, 2))

        const videoId = statusData?.data?.video_id
        const status = statusData?.data?.status

        if (!username || !videoId) {
            return Response.json({ status, url: null })
        }

        const url = `https://www.tiktok.com/@${username}/video/${videoId}`
        return Response.json({ status, url })
    } catch (err) {
        console.error(err)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
