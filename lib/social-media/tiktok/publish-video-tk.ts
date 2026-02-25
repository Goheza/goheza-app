import { supabaseClient } from '@/lib/supabase/client'

type PublishTikTokParams = {
    campaignId: string
    videoUrl: string
    caption: string
    creatorUserId: string
}

export async function publishTikTokVideo(params: PublishTikTokParams) {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
        throw new Error('User not logged in')
    }

    const res = await fetch('/api/tiktok/publish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(params),
    })

    if (!res.ok) {
        const error = await res.text()
        throw new Error(error)
    }

    return res.json() as Promise<{
        success: boolean
        publishId: string
    }>
}
