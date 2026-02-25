/**
 * Used to activate the authentication for Tiktok
 * @todo This is to be used for the user to add their instagram Account
 */

import { supabaseClient } from '@/lib/supabase/client'

export async function activateTiktokOAuth() {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
        throw new Error('User not logged in')
    }

    const res = await fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
        },
    })

    const data = await res.json()

    if (data.authUrl) {
        window.location.href = data.authUrl
    }
}
