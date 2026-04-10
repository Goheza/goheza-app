import { supabaseClient, } from '@/lib/supabase/client'
import {User} from "@supabase/supabase-js"

export interface ISignUpUser {
    email: string
    password: string
    fullName: string
    role: string
    phone: string
    country: string
}

/**
 * Used to signup user for the account.
 * @param param0
 * @returns
 */

export const signUpUser = async ({ email, password, fullName, role, country, phone }: ISignUpUser) => {
    try {
        // Create account in Supabase auth
        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            phone: phone,
            options: {
                data: { fullName, role, phone, country },
            },
        })

        if (error) {
            return { isErrorTrue: true, errorMessage: error.message }
        }
        return {
            isErrorTrue: false,
            data: {
                message: 'Account created successfully',
            },
        }
    } catch (err) {
        console.error('Unexpected signup error:', err)
        return { isErrorTrue: true, errorMessage: 'Unexpected error occurred.' }
    }
}

/**
 * Used for SignInUser
 * @param email
 * @param password
 * @returns
 */
export async function signInUser(email: string, password: string): Promise<{ error?: Error }> {
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw error

        return {}
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to sign in')
        return { error }
    }
}

/**
 * Sign In With Google
 * @returns
 */

export async function signInWithGoogle(): Promise<{ error?: Error }> {
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/app/auth/onboarding/profile/google`,
            },
        })

        if (error) throw error

        return {}
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Failed to sign in with Google')
        return { error }
    }
}

/**
 * Used to Log Out USer
 */
export async function LogOutUser() {
    await supabaseClient.auth.signOut({scope : 'global'})
}

interface IResetPassword {
    redirectLink: string
    email: string
}

/**
 * Reset the user password
 * @param options
 */
export async function resetPassword(options: IResetPassword) {
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()
    return await supabaseClient.auth.resetPasswordForEmail(options.email, { redirectTo: options.redirectLink })
}

interface IUpdatePassword {
    password: string
}

/**
 *
 * Update the current password
 * @param options
 * @returns
 */

export async function updateUserPassword(options: IUpdatePassword) {
    return supabaseClient.auth.updateUser({ password: options.password })
}

export const isOnboardingComplete = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabaseClient
        .from('creator_profiles')
        .select('phone, country')
        .eq('user_id', userId)
        .single()

    if (error || !data) return false

    return !!data.phone?.trim() && !!data.country?.trim()
}



export async function getAuthUser(): Promise<User> {
    const { data: { user }, error } = await supabaseClient.auth.getUser()

    if (error) throw new Error(error.message)
    if (!user) throw new Error('No authenticated user found.')

    return user
}

export async function fetchBrandProfile() {
    // Get the current user's session and ID
    const {
        data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
        // Return null or handle the case where the user is not logged in
        return null
    }

    // Use the generated types for the 'brand_profiles' table
    const { data, error } = await supabaseClient.from('brand_profiles').select('*').eq('user_id', user.id).single()

    if (error) {
        
        return null
    }

    // The 'data' variable is now correctly typed as BrandProfile
    return data
}