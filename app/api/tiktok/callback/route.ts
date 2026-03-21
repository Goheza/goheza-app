import { baseURL } from '@/lib/env'
import { createClient } from '@/lib/supabase/ssr-server-client'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
    try {
        const supabase = await createClient()

        const { searchParams } = new URL(req.url)

        const code = searchParams.get('code')
        const state = searchParams.get('state') // your user_id
        const errorParam = searchParams.get('error')

        if (errorParam) {
            return Response.redirect(`${baseURL}/main/auth/onboarding/socials?error=tiktok_denied`)
        }

        if (!code || !state) {
            return Response.json({ error: 'Missing code or state' }, { status: 400 })
        }

        // 🔐 Retrieve stored PKCE verifier (example: from cookie)
        const cookieStore = await cookies()
        const codeVerifier = cookieStore.get('tiktok_code_verifier')?.value

        if (!codeVerifier) {
            return Response.json({ error: 'Missing PKCE verifier' }, { status: 400 })
        }

        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_key: process.env.TIKTOK_CLIENT_KEY!,
                client_secret: process.env.TIKTOK_CLIENT_SECRET!,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${baseURL}/api/tiktok/callback`,
                code_verifier: codeVerifier, // 🔥 REQUIRED
            }),
        })

        const tokenData = await tokenRes.json()

        if (!tokenRes.ok) {
            console.error('TikTok token error:', tokenData)
            return Response.json({ error: 'Token exchange failed' }, { status: 400 })
        }

        const { access_token, refresh_token, expires_in, open_id, scope } = tokenData

        await supabase.from('social_accounts').upsert({
            user_id: state,
            platform: 'tiktok',
            external_user_id: open_id,
            access_token,
            refresh_token,
            scope,
            expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        })

        return Response.redirect(`${baseURL}/main/auth/onboarding/socials`)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Callback failed' }, { status: 500 })
    }
}
