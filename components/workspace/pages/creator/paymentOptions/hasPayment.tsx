import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

/**
 * Checks if the currently logged-in user has set up their payment details.
 * @returns {Promise<boolean>} True if payment details are present, false otherwise.
 */
export async function hasPresentPaymentMethod(): Promise<boolean> {
    // 1. Get the current user
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
        // If no user is logged in, they certainly haven't set payment details.
        console.warn('No user logged in. Cannot check payment status.')
        return false
    }

    // 2. Fetch the user's creator profile
    const { data: profile, error } = await supabaseClient
        .from('creator_profiles')
        .select('has_payment_details')
        .eq('user_id', user.id)
        .single() // Use .single() to expect one row

    if (error) {
        console.error('Error fetching creator profile:', error)
        // You might want to toast an error here if this is a critical check
        return false
    }

    // 3. Check the has_payment_details flag
    // The profile.has_payment_details field is the boolean we set earlier.
    const hasDetails = profile?.has_payment_details ?? false

    if (!hasDetails) {
        toast.warning('Please complete your payment details to receive payouts.')
    }

    return hasDetails
}
