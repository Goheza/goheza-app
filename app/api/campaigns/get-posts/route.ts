// app/api/campaigns/get-posts/route.ts
import { supabaseClient } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/ssr-server-client'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
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

        const { searchParams } = new URL(req.url)
        const campaignId = searchParams.get('campaignId')

        if (!campaignId) {
            return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
        }

        const { data: posts, error } = await supabaseClient
            .from('campaign_posts')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ posts })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Getting Posts' }, { status: 500 })
    }
}
