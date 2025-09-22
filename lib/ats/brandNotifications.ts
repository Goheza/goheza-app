import { supabaseClient } from '../supabase/client'

export async function fetchBrandNotifications() {
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
        // Return null or handle the case where the user is not logged in
        return null
    }
    const { data, error } = await supabaseClient
        .from('brand_notifications')

        .select('*')
        .eq('brand_id', user.id)
        .single()

    if (error) {
        console.log('Error fetching Brand Notifications')
    }
    return data
}

interface IBrandNotification {
    message: string
    source: 'admin',
    id: string
}

/**
 * This is used to add notification to the brand
 * @param options
 */

export async function addNotificationToBrand(options: IBrandNotification) {
    const { data, error } = await supabaseClient
        .from('brand_notifications')
        .insert([
            {
                source: options.source,
                brand_id: options.id, // brand_profiles.id
                message: options.message,
            },
        ])
        .select()
        .single()

    if (error) {
        console.error('Error inserting brand notification:', error.message)
    } else {
        console.log('Brand notification created:', data)
    }
}
