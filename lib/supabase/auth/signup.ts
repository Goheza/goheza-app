import { baseURL } from '@/lib/env'
import { supabaseClient } from '@/lib/supabase/client'

interface ISignUpUser {
    email: string,
    password: string
    fullName: string
    role: string
}

export const signUpUser = async ({ email, password, fullName, role }: ISignUpUser) => {
    try {
        // Create account in Supabase auth
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${baseURL}$`,
                data: { fullName, role },
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
        

        if (role === 'brand') {
            const { error: profileError } = await supabaseClient.from('brand_profiles').insert([
                {
                    user_id: user.id,
                    brand_name: fullName, // use fullName for now
                    email,
                },
            ])

            if (profileError) {
                console.error('Error creating brand profile:', profileError)
                return { isErrorTrue: true, errorMessage: profileError.message }
            }
        }

        if (role === 'creator') {
            const { error: profileError } = await supabaseClient.from('creator_profiles').insert([
                {
                    user_id: user.id,
                    creator_name: fullName,
                    email,
                },
            ])

            if (profileError) {
                console.error('Error creating creator profile:', profileError)
                return { isErrorTrue: true, errorMessage: profileError.message }
            }
        }
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

