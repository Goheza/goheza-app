/**
 * Used to check for an available Logged In Session
 * 
 * Check if their is a current user session that is available.
 * 
 * this provides a user.Data check if its null to verify the user is available
 */

import { supabaseClient } from "../supabase/client";


export async function checkCurrentUserSession() {
    return (await supabaseClient.auth.getUser()).data;
}