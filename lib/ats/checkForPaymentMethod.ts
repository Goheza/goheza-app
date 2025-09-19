import { supabaseClient } from '../supabase/client'

type payment_exists = 'is_available' | 'is_unavailable' | 'failed'

export async function checkIFPaymentExists(): Promise<payment_exists> {
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()

    const { data, error } = await supabaseClient
        .from('creator_profiles')
        .select('payment_method')
        .eq('user_id', user!.id) // Or some other column to filter by

    if (user) {
        if (data) {
            const paymentMethod = data[0].payment_method! as string
            if (paymentMethod == 'bank' || paymentMethod == 'mobile') {
                return 'is_available'
            } else {
                return 'is_unavailable'
            }
        } else {
            return 'failed'
        }
    } else {
        return 'failed'
    }
}
