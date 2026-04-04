import { supabaseClient } from '../supabase/client'

/**
 * Check if the user has socials connected or not
 */
export const checkAllPlatformsConnected = async (platforms: string[]) => {
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()
    if (!user) return false

    const { data: accounts } = await supabaseClient.from('social_accounts').select('platform').eq('user_id', user.id)

    if (!accounts) return false

    return platforms.every((platform) => accounts.some((a) => a.platform === platform))
}
