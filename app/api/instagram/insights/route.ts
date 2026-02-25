import { createClient } from '@/lib/supabase/ssr-server-client'
import { NextResponse } from 'next/server'

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

        const { campaignId } = await req.json()

        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
        }

        const { data: posts, error: postsError } = await supabase
            .from('campaign_posts')
            .select('media_id')
            .eq('campaign_id', campaignId)

        if (postsError) {
            return NextResponse.json({ error: postsError.message }, { status: 500 })
        }

        const { data: account } = await supabase.from('social_accounts').select('access_token').single()

        if (!account?.access_token) {
            return NextResponse.json({ error: 'No Instagram account connected' }, { status: 400 })
        }

        for (const post of posts || []) {
            const insightsRes = await fetch(
                `https://graph.facebook.com/v20.0/${post.media_id}/insights?` +
                    `metric=likes,comments,plays,reach,impressions,saves,shares&` +
                    `access_token=${account.access_token}`
            )

            const json = await insightsRes.json()

            const insightValues = json.data?.reduce((acc: any, m: any) => {
                acc[m.name] = m.values?.[0]?.value || 0
                return acc
            }, {})

            await supabase.from('campaign_insights').upsert({
                campaign_id: campaignId,
                media_id: post.media_id,
                likes: insightValues?.likes || 0,
                comments: insightValues?.comments || 0,
                views: insightValues?.plays || 0,
                reach: insightValues?.reach || 0,
                impressions: insightValues?.impressions || 0,
                saves: insightValues?.saves || 0,
                shares: insightValues?.shares || 0,
                last_updated: new Date().toISOString(),
            })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Error updatiing Instagram Insights:', err)
        return Response.json({ error: err.message }, { status: 500 })
    }
   
}
