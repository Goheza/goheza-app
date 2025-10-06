import { supabaseClient } from "../client";

export default async function signOutUser() {
    
    const {error} = await supabaseClient.auth.signOut();

    if(error) {
        console.log("Error Logging out user from (Profile Problem)")
    }

}