import { baseURL } from '@/lib/env'
import { supabaseClient } from '@/lib/supabase/client'

export interface ISignUpUser {
    email: string
    password: string
    fullName: string
    role: string
    phone: string
    country: string
};

/**
 * Used to signup user for the account.
 * @param param0 
 * @returns 
 */

export const signUpUserNormalAuth = async ({ email, password, fullName, role, country, phone }: ISignUpUser) => {
    try {
        // Create account in Supabase auth
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${baseURL}/main/auth/profile-make?role=${role}`,
                data: { fullName, role, phone, country },
                // stored in user_metadata
            },
        })

        if (error) {
            return { isErrorTrue: true, errorMessage: error.message }
        }

        const user = data.user
        if (!user) {
            return { isErrorTrue: true, errorMessage: 'No user returned after signup.' }
        }

        // Insert role-specific profile

        return {
            isErrorTrue: false,
            data: {
                user,
                message: 'Account created successfully',
            },
        }
    } catch (err) {
        console.error('Unexpected signup error:', err)
        return { isErrorTrue: true, errorMessage: 'Unexpected error occurred.' }
    }
}



export const signUpUserNormalBrandAuth = async ({ email, password, fullName, role, country, phone }: ISignUpUser) => {
    try {
        // Create account in Supabase auth
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${baseURL}/main/auth/profile-make?role=${role}`,
                data: { fullName, role, phone, country },
                // stored in user_metadata
            },
        })

        if (error) {
            return { isErrorTrue: true, errorMessage: error.message }
        }

        const user = data.user
        if (!user) {
            return { isErrorTrue: true, errorMessage: 'No user returned after signup.' }
        }

        // Insert role-specific profile

        return {
            isErrorTrue: false,
            data: {
                user,
                message: 'Account created successfully',
            },
        }
    } catch (err) {
        console.error('Unexpected signup error:', err)
        return { isErrorTrue: true, errorMessage: 'Unexpected error occurred.' }
    }
}