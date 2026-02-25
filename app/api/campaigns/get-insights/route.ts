// app/api/campaigns/get-insights/route.ts
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

        const { data: insights, error } = await supabase
            .from('campaign_insights')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('last_updated', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ insights })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Failed to get Insights' }, { status: 500 })
    }
}
