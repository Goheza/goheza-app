import { supabaseClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

// Define the structure for the return value for type safety
export type UserProfile = {
    type: 'creator' | 'brand' | null,
    user: User | null,
}

/**
 * Checks the database to determine which specific profile (creator or brand)
 * the authenticated Supabase user belongs to.
 * * @returns A UserProfile object containing the determined type and the user data.
 */
export async function getUserProfileType(): Promise<UserProfile> {

    // 1. Get the authenticated user
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
        // Not authenticated
        return { type: null, user: null } 
    }

    const userId = user.id

    try {
        // --- Step 2: Check creator_profiles ---
        const { data: creator, error: creatorError } = await supabaseClient
            .from('creator_profiles')
            .select('id')
            .eq('user_id', userId) // Correctly using 'user_id' based on your table
            .maybeSingle() 
        
        // Ignore the expected 'no rows found' error (PGRST116)
        if (creatorError && creatorError.code !== 'PGRST116') throw creatorError 

        if (creator) {
            return { type: 'creator', user }
        }
        
        // ----------------------------------------------------------------------

        // --- Step 3: Check brand_profiles ---
        const { data: brand, error: brandError } = await supabaseClient
            .from('brand_profiles')
            // Only selecting 'id' as 'is_approved' is not in your definition
            .select('id') 
            .eq('user_id', userId) // Correctly using 'user_id' based on your table
            .maybeSingle() 

        if (brandError && brandError.code !== 'PGRST116') throw brandError

        if (brand) {
            return {
                type: 'brand',
                user,
                // Note: isApproved field is removed here since it's not in the table.
            }
        }
        
        // ----------------------------------------------------------------------

        // --- Step 4: Not found in either table ---
        return { type: null, user }

    } catch (error) {
        console.error('CRITICAL ERROR: Failed to fetch user profile type:', error)
        
        // Return a safe default type on failure
        return { type: null, user } 
    }
}