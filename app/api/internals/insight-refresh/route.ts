// app/api/internals/insight-refresh/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    const auth = searchParams.get('auth')
    const campaignName = searchParams.get('campaign_name')

    // Validate secret
    if (auth !== process.env.INTERNAL_API_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!campaignName) {
        return NextResponse.json({ error: 'campaign_name is required' }, { status: 400 })
    }

    // Find campaign by name (case-insensitive)
    const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('campaigns')
        .select('id, name')
        .ilike('name', campaignName)
        .eq('status', 'approved')
        .single()

    if (campaignError || !campaign) {
        return NextResponse.json({ error: `Campaign "${campaignName}" not found` }, { status: 404 })
    }

    // Fetch published tiktok posts for that campaign
    const { data: posts, error: postsError } = await supabaseAdmin
        .from('campaign_posts')
        .select('media_id, campaign_id')
        .eq('campaign_id', campaign.id)
        .eq('status', 'PUBLISHED')
        .eq('platform', 'tiktok')

    if (postsError) {
        return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
        return NextResponse.json({ message: `No published TikTok posts found for "${campaign.name}"` }, { status: 200 })
    }

    // Fire insight refresh for each post
    const results = await Promise.allSettled(
        posts.map(async (post) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok/submission-insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({ mediaId: post.media_id, campaignId: post.campaign_id }),
            })
            if (!res.ok) throw new Error(`Failed for media_id: ${post.media_id}`)
            return post.media_id
        })
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
        campaign: campaign.name,
        total: posts.length,
        succeeded,
        failed,
    })
}
