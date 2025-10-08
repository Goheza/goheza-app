
/**
 * This is the google signup of the brand 
 * @param param0 
 * @returns 
 */

import { supabaseClient } from "../client";

interface ISignInWithGoogle {
    redirectURL:string;
}

export const signInWithGoogleBrand = async ({ redirectURL }:ISignInWithGoogle) => {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectURL,
                
            },
        })

        if (error) {
            return { isErrorTrue: true, errorMessage: error.message }
        }

        return { isErrorTrue: false, data, message: 'Google sign-in initiated' }
    } catch (err) {
        console.error('Unexpected Google sign-in error:', err)
        return { isErrorTrue: true, errorMessage: 'Unexpected error occurred.' }
    }
}