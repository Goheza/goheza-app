import { User } from '@supabase/supabase-js'
import { supabaseClient } from '../client'
import { toast } from 'sonner'

interface IEXtraInfo {
    phone: string
    country: string
    paymentMethod: string
}

/**
 * Used to check the User Sessions
 */
export async function checkUserSession(): Promise<{ isSessionAvailable: boolean }> {
    const { data } = await supabaseClient.auth.getSession()

    if (!data.session) {
        return {
            isSessionAvailable: false,
        }
    } else {
        return {
            isSessionAvailable: true,
        }
    }
}

/**
 * Used to make the user Profile
 * @param user
 * @param role
 * @param extraInfo
 * @returns
 */
export async function makeProfile(user: User, role: 'brand' | 'creator', extraInfo?: IEXtraInfo) {
    /**
     * Get Profile Contact from here
     */
    let userContact = user.user_metadata!.phone! as string

    if (role === 'brand') {
        const { error: profileError } = await supabaseClient.from('brand_profiles').insert([
            {
                user_id: user.id,
                brand_name: user.identities![0]?.identity_data?.full_name || user.user_metadata?.fullName, // use fullName for now
                brand_email: user.email!,
                phone: userContact,
            },
        ])
        if (profileError) {
            console.error('Error creating brand profile:', profileError)
            return { isErrorTrue: true, errorMessage: profileError.message }
        }
        return
    }

    if (role === 'creator') {
        const { error: profileError } = await supabaseClient.from('creator_profiles').insert([
            {
                user_id: user.id,
                full_name: user.identities![0]?.identity_data?.full_name || user.user_metadata?.fullName,
                email: user.email!,
                country: '',
                phone: userContact,
            },
        ])

        if (profileError) {
            console.error('Error creating creator profile:', profileError)
            return { isErrorTrue: true, errorMessage: profileError.message }
        }
        return
    }
}

/**
 * Used to delete the profile of the user.
 * @param user
 * @param role
 */

export async function deleteProfile(id: string, role: 'brand' | 'creator') {
    if (role == 'brand') {
        const { error: profileError } = await supabaseClient
            .from('brand_profiles')
            .delete({ count: 'exact' })
            .eq('user_id', id)

        if (profileError) {
            toast.error('Error Deleting User', {
                description: `Failed to delete user Profile:${id}`,
            })
        }
    } else {
        const { error: profileError } = await supabaseClient
            .from('creator_profiles')
            .delete({ count: 'exact' })
            .eq('user_id', id)
        if (profileError) {
            toast.error('Error Deleting User', {
                description: `Failed to delete user Profile:${id}`,
            })
        }
    }
}

/**
 * Delete the user permanently
 * @param user
 */

export async function deleteUserPermanently(id: string) {
    await fetch('/api/delete-user', {
        method: 'POST',
        body: JSON.stringify({ user_id: id }),
    }).then(async (response) => {})
}

// Define the structure for the return value for type safety
export type UserProfile = {
    type: 'creator' | 'brand' | null
    user: User | null
}

export type UserByProfile = {
    profileType: 'creator' | 'brand' | 'unknown'
}
/**
 * Get the Profile based on the user that is currently logged In
 * @param user
 * @returns
 */
export async function getProfileBasedOnUser(user: User): Promise<{ profileType: 'creator' | 'brand' | 'unknown' }> {
    try {
        const userId = user.id

        const { data: creator, error: creatorError } = await supabaseClient
            .from('creator_profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        if (creatorError) throw creatorError
        if (creator) return { profileType: 'creator' }

        const { data: brand, error: brandError } = await supabaseClient
            .from('brand_profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

        if (brandError) throw brandError
        if (brand) return { profileType: 'brand' }

        // neither profile found
        return { profileType: 'unknown' }
    } catch (error) {
        console.error('getProfileBasedOnUser error:', error)
        return { profileType: 'unknown' }
    }
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
