import { supabaseClient } from '../supabase/client'

interface IAdminNotification {
    message: string
    source: 'brand' | 'creator'
    id: string
}

/**
 * This is used to add notification to the Admin
 * @param options 
 */

export async function addNotificationToTheAdmin(options: IAdminNotification) {
    const { data, error } = await supabaseClient
        .from('admin_notifications')
        .insert([
            {
                source_type: options.source,
                source_id: options.id, // brand_profiles.id
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
