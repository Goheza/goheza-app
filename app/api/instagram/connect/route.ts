import { createClient } from '@/lib/supabase/ssr-server-client'

// app/api/instagram/connect/route.ts
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

        const clientId = process.env.INSTAGRAM_APP_ID // Your Meta App ID
        const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/instagram/callback`

        const authUrl =
            `https://www.facebook.com/v20.0/dialog/oauth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement&` +
            `response_type=code&` +
            `state=${user?.id}`

        return Response.json({ authUrl })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Failed to connect to Instagram' }, { status: 500 })
    }
}
