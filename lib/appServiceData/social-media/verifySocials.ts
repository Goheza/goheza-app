import { supabaseClient } from '@/lib/supabase/client'

/**
 * Check if the user has socials connected or not
 */
export async function areSocialsAvailable(): Promise<boolean> {
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()
    if (!user) return false

    const { data, error } = await supabaseClient
        .from('social_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', 'tiktok')
        .maybeSingle()

    return !error && data !== null
}
