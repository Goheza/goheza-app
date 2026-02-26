import { supabaseClient } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/ssr-server-client'

export async function POST(req: Request) {
    try {
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

        // 'tiktok' or 'instagram'

        const clientKey = process.env.TIKTOK_CLIENT_KEY!
        const redirectUri = `${process.env.baseURL}/api/social/tiktok/callback`

        const authUrl =
            `https://www.tiktok.com/v2/auth/authorize/?` +
            `client_key=${clientKey}&` +
            `scope=video.upload,video.publish,user.info.basic&` +
            `response_type=code&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `state=${user?.id}`

        return Response.json({ authUrl })

        // Add Instagram block here similarly (facebook.com dialog)
        return Response.json({ error: 'Unsupported platform' }, { status: 400 })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Generation failed' }, { status: 500 })
    }
}
