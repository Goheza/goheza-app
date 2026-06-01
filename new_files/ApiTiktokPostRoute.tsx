import { createClient } from '@/lib/supabase/serverSideClient'

type CommercialDisclosure = {
    yourBrand: boolean
    brandedContent: boolean
} | null

export async function POST(req: Request) {
    try {
        const supabase = await createClient()

        const {
            submissionId,
            campaignId,
            videoUrl,
            caption,
            creatorUserId,
            // Creator's explicit choices from the consent screen
            privacyLevel,
            disableComment,
            disableDuet,
            disableStitch,
            commercialDisclosure,
        }: {
            submissionId: string
            campaignId: string
            videoUrl: string
            caption: string
            creatorUserId: string
            privacyLevel: string
            disableComment: boolean
            disableDuet: boolean
            disableStitch: boolean
            commercialDisclosure: CommercialDisclosure
        } = await req.json()

        // ── Validate required fields ─────────────────────────────────────────
        if (!campaignId || !videoUrl || !privacyLevel || !submissionId) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // ── Fetch social account ─────────────────────────────────────────────
        const { data: account } = await supabase
            .from('social_accounts')
            .select('access_token, refresh_token, expires_at')
            .eq('user_id', creatorUserId)
            .eq('platform', 'tiktok')
            .single()

        if (!account) {
            return Response.json({ error: `No TikTok account connected for user: ${creatorUserId}` }, { status: 400 })
        }

        let accessToken = account.access_token

        // ── Token refresh ────────────────────────────────────────────────────
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

        // ── Step 1: Re-check creator info to enforce posting caps ────────────
        // TikTok requirement: check creator_info before every post attempt
        const creatorInfoRes = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
            },
        })
        const creatorInfoJson = await creatorInfoRes.json()

        if (!creatorInfoRes.ok || !creatorInfoJson.data) {
            return Response.json(
                { error: 'Failed to verify creator posting eligibility', details: creatorInfoJson },
                { status: 400 }
            )
        }

        const { privacy_level_options } = creatorInfoJson.data

        // Guard: creator has hit their posting cap
        if (!privacy_level_options || privacy_level_options.length === 0) {
            return Response.json(
                { error: 'You have reached your TikTok posting limit. Please try again later.' },
                { status: 429 }
            )
        }

        // Guard: the privacy level the creator chose is no longer available
        if (!privacy_level_options.includes(privacyLevel)) {
            return Response.json(
                {
                    error: `The selected privacy level "${privacyLevel}" is no longer available for your account. Please go back and choose another.`,
                },
                { status: 400 }
            )
        }

        // ── Step 2: Build post_info with creator's explicit choices ──────────
        const filename = videoUrl.split('/').pop()
        const proxyVideoUrl = `https://goheza.com/api/video/${filename}`

        // Build brand_content_toggle per TikTok spec
        // brand_content_toggle=true marks as Branded Content (paid partnership)
        // brand_organic_toggle=true marks as Your Brand (promotional content)
        const brandContentToggle = !!commercialDisclosure?.brandedContent
        const brandOrganicToggle = !!commercialDisclosure?.yourBrand

        const postInfo: Record<string, unknown> = {
            title: caption,
            privacy_level: privacyLevel,
            disable_comment: disableComment,
            disable_duet: disableDuet,
            disable_stitch: disableStitch,
        }

        // Only include brand toggles when disclosure is on
        if (commercialDisclosure) {
            postInfo.brand_content_toggle = brandContentToggle
            postInfo.brand_organic_toggle = brandOrganicToggle
        }

        // ── Step 3: Init the post ────────────────────────────────────────────
        const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                post_info: postInfo,
                source_info: {
                    source: 'PULL_FROM_URL',
                    video_url: proxyVideoUrl,
                },
            }),
        })

        const initJson = await initRes.json()
        console.log('TikTok init response:', JSON.stringify(initJson, null, 2))

        if (!initRes.ok || !initJson.data?.publish_id) {
            return Response.json({ error: 'Failed to initiate TikTok post', details: initJson }, { status: 400 })
        }

        const publishId = initJson.data.publish_id

        // ── Step 4: Persist to DB ────────────────────────────────────────────

        // Record in campaign_posts for the analytics pipeline
        await supabase.from('campaign_posts').insert({
            campaign_id: campaignId,
            user_id: creatorUserId,
            platform: 'tiktok',
            media_id: publishId,
            permalink: videoUrl,
            media_type: 'VIDEO',
            status: 'PROCESSING',
            posted_at: new Date().toISOString(),
        })

        // Update the submission so it knows it's been posted
        await supabase
            .from('campaign_submissions')
            .update({
                tiktok_publish_id: publishId,
                // tiktok_url will be filled in once TikTok finishes processing
                // via the submission-insights webhook / polling endpoint
            })
            .eq('id', submissionId)

        // ── Step 5: Kick off status polling ─────────────────────────────────
        // Non-blocking: fire and forget so the creator doesn't wait
        fetch('/api/tiktok/submission-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId, publishId, creatorUserId }),
        }).catch((err) => console.error('Insight trigger failed:', err))

        return Response.json({ success: true, publishId })
    } catch (error) {
        console.error('Unexpected error posting to TikTok:', error)
        return Response.json({ error: 'Server error' }, { status: 500 })
    }
}
