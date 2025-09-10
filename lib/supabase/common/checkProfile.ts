import { supabaseClient } from '../client'

interface ICheckResult {
    isProfileAvailable: boolean
}

/**
 * Used to check the profile existence
 * @param role
 * @returns
 */

export async function checkIfProfileExists(role: 'brand' | 'creator'): Promise<ICheckResult> {
    /**
     * Ensure user exists and is confirmed
     */

    const {
        data: { user },
    } = await supabaseClient.auth.getUser()

    /**
     * Ensure user and email is confirmed
     */
    if (user && user.confirmed_at!) {
        /**
         * Check if they have profiles based on role
         */

        if (role == 'brand') {
            const { error } = await supabaseClient.from('brand_profiles').select('*').eq('user_id', user.id).single()

            if (error) {
                //profile doesn't exist
                return { isProfileAvailable: false }
            } else {
                return { isProfileAvailable: true }
            }
        } else {
            const { error } = await supabaseClient.from('creator_profiles').select('*').eq('user_id', user.id).single()

            if (error) {
                return { isProfileAvailable: false }
            } else {
                return { isProfileAvailable: true }
            }
        }
    } else {
        return { isProfileAvailable: false }
    }
}

export async function createProfile(role: 'brand' | 'creator') {
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()

    if (user) {
        if (role === 'brand') {
            const { error: profileError } = await supabaseClient.from('brand_profiles').insert([
                {
                    user_id: user.id,
                    brand_name: user.user_metadata!.fullName, // use fullName for now
                    email: user.email!,
                },
            ])

            if (profileError) {
                console.error('Error creating brand profile:', profileError)
                return { isErrorTrue: true, errorMessage: profileError.message }
            }
        }

        if (role === 'creator') {
            const { error: profileError } = await supabaseClient.from('creator_profiles').insert([
                {
                    user_id: user.id,
                    creator_name: user.user_metadata!.fullName,
                    email: user.email!,
                },
            ])

            if (profileError) {
                console.error('Error creating creator profile:', profileError)
                return { isErrorTrue: true, errorMessage: profileError.message }
            }
        }
    }
}
