import { createClient } from '@/lib/supabase/serverSideClient'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()

        // auth
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { publishId } = await req.json()

        if (!publishId) {
            return Response.json({ error: 'Missing publishId' }, { status: 400 })
        }

        // get account
        const { data: account, error } = await supabase
            .from('social_accounts')
            .select('access_token, username')
            .eq('user_id', user.id)
            .eq('platform', 'tiktok')
            .single()

        if (error || !account) {
            return Response.json({ error: 'No TikTok account' }, { status: 400 })
        }

        let username = account.username

        // fetch username if missing
        if (!username) {
            const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/', {
                headers: {
                    Authorization: `Bearer ${account.access_token}`,
                },
            })

            const userData = await userRes.json()
            username = userData?.data?.user?.username

            if (username) {
                await supabase
                    .from('social_accounts')
                    .update({ username })
                    .eq('user_id', user.id)
                    .eq('platform', 'tiktok')
            }
        }

        // get videoId
        const statusRes = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                publish_id: publishId,
            }),
        })

        const statusData = await statusRes.json()

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
