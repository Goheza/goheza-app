import { supabaseClient } from '@/lib/supabase/client'

export interface IPublishVideoToInstagram {
    campaignId: string
    creatorId: string
    videoURL: string
    caption: string
    /**
     * Is it a Reel or video
     */
    isReel: boolean
}

export async function PublishVideoOrReelToInsgram(args: IPublishVideoToInstagram) {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
        throw new Error('User not logged in')
    }

    const res = await fetch('/api/instagram/post', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
            campaignId: args.campaignId,
            creatorId: args.creatorId,
            caption: args.videoURL,
            videoUrl: args.videoURL,
            isReel: args.isReel,
        }),
    })

    const data = await res.json()
    console.log(data)
}
