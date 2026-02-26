import { baseURL } from '@/lib/env'
import { supabaseClient } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/ssr-server-client'

export async function GET(req: Request) {
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

        const { searchParams } = new URL(req.url)
        const code = searchParams.get('code')
        const state = searchParams.get('state') // user_id

        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: process.env.TIKTOK_CLIENT_KEY!,
                client_secret: process.env.TIKTOK_CLIENT_SECRET!,
                code: code!,
                grant_type: 'authorization_code',
                redirect_uri: `${baseURL}/api/social/tiktok/callback`,
            }),
        })

        const { access_token, refresh_token, expires_in, open_id } = await tokenRes.json()

        await supabaseClient.from('social_accounts').upsert({
            user_id: state,
            platform: 'tiktok',
            external_user_id: open_id,
            access_token,
            refresh_token,
            expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        })
        return Response.redirect(`${baseURL}/main/auth/onboarding/socials`)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Generation failed' }, { status: 500 })
    }
}
