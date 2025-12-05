import { supabaseClient } from "../client";

export default async function signOutUser() {
    
    const {error} = await supabaseClient.auth.signOut();

    if(error) {
        
    }

}