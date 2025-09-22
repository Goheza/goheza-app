/**
 * Get Brand Profile
 */

import { supabaseClient } from '../client'

export async function fetchBrandProfile() {
    // Get the current user's session and ID
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
        // Return null or handle the case where the user is not logged in
        return null
    }

    // Use the generated types for the 'brand_profiles' table
    const { data, error } = await supabaseClient.from('brand_profiles').select('*').eq('user_id', user.id).single()

    if (error) {
        console.log('Error fetching brand profile:', error.message)
        return null
    }

    // The 'data' variable is now correctly typed as BrandProfile
    return data
}
