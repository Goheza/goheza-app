import { supabaseClient } from '../supabase/client'

/**
 * Check if the user has socials connected or not
 */
export async function checkIFSocialsArePresent(): Promise<boolean> {
    const {
        data: { user },
        error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) return false

    const { data, error } = await supabaseClient.from('social_accounts').select('id').eq('user_id', user.id).limit(1)

    if (error) {
        console.error(error)
        return false
    }

    return (data?.length ?? 0) > 0
}
