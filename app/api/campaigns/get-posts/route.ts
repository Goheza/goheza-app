import { createClient } from '@/lib/supabase/serverSideClient'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
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

        const { searchParams } = new URL(req.url)
        const campaignId = searchParams.get('campaignId')

        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
        }

        const { data: posts, error } = await supabase
            .from('campaign_posts')
            .select('*, creator_profiles(full_name)')
            .eq('campaign_id', campaignId)
            .order('posted_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ posts })
    } catch (err) {
        console.error('get-posts error:', err)
        return NextResponse.json({ error: 'Failed to get posts' }, { status: 500 })
    }
}
