import { supabaseClient } from '../client'

interface ISignInUser {
    email: string
    password: string
};

/**
 * Used to signin the user 
 * @param param0 
 * @returns 
 */

export const signInUser = async ({ email, password }: ISignInUser) => {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return { isErrorTrue: true, errorMessage: error.message }
        }

        return {
            isErrorTrue: false,
            data: {
                user: data.user,
                session: data.session,
                message: 'Signed in successfully',
            },
        }
    } catch (err) {
        console.error('Unexpected signin error:', err)
        return { isErrorTrue: true, errorMessage: 'Unexpected error occurred.' }
    }
}

interface ISignInWithGoogle {
    redirectURL:string;
}


/**
 * Used to continue or signup with google
 * @param param0 
 * @returns 
 */

export const signInWithGoogle = async ({ redirectURL }:ISignInWithGoogle) => {
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
