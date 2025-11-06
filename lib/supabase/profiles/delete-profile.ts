import { User } from '@supabase/supabase-js'
import { supabaseClient } from '../client'
import { toast } from 'sonner'

/**
 * Used to delete the profile of the user.
 * @param user
 * @param role
 */

export async function deleteProfile(id:string, role: 'brand' | 'creator') {
    console.log("will-delete-profile",id, role)
    if (role == 'brand') {
        const { error: profileError } = await supabaseClient.from('brand_profiles').delete({count : "exact"}).eq('user_id', id)

        if (profileError) {
            toast.error('Error Deleting User', {
                description: `Failed to delete user Profile:${id}`,
            })
        }
    } else {
        console.log("deleting-user")
        const { error: profileError } = await supabaseClient.from('creator_profiles').delete({count : "exact"}).eq('user_id', id)
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

export async function deleteUserPermanently(id:string) {
    console.log("CurrentID",id)
    await fetch('/api/delete-user', {
        method: 'POST',
        body: JSON.stringify({ user_id: id }),
    }).then(async (response) => {
        console.log(await response.json())
    })
}
