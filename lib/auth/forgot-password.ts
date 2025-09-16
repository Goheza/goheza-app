/**
 * Used in the case when the user forgets the password
 * 
 * This has two stages . when the user says he forgot the password, 
 * 
 * direct them to check their email
 */

import { supabaseClient } from "../supabase/client"

/**
 * Reset the password.
 */


interface IResetPassword {
    redirectLink: string;
    email:string;
}

/**
 * Reset the user password
 * @param options 
 */
export async function resetPassword(options:IResetPassword) {

    const {data : {user}} = await supabaseClient.auth.getUser();
    return await supabaseClient.auth.resetPasswordForEmail(options.email, { redirectTo: options.redirectLink, })
}

interface IUpdatePassword {
    password:string;
}

/**
 * 
 * Update the current password
 * @param options 
 * @returns 
 */

export async function updateUserPassword(options:IUpdatePassword) {
   return supabaseClient.auth.updateUser({  password: options.password})
}