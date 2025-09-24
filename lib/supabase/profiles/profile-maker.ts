import { User } from '@supabase/supabase-js'
import { supabaseClient } from '../client'

interface IEXtraInfo {
    phone:string;
    country:string;
    paymentMethod:string;
    socialLinks:string;
}

export async function makeProfile(user: User, role: 'brand' | 'creator',extraInfo?:IEXtraInfo) {
    if (role === 'brand') {
        const { error: profileError } = await supabaseClient.from('brand_profiles').insert([
            {
                user_id: user.id,
                brand_name: user.identities![0]?.identity_data?.full_name || user.user_metadata?.fullName, // use fullName for now
                brand_email: user.email!,
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
                full_name: user.identities![0]?.identity_data?.full_name || user.user_metadata?.fullName,
                email: user.email!,
                payment_method : extraInfo!.paymentMethod,
                country : extraInfo!.country,
                sociallinks:extraInfo!.socialLinks,
                phone : extraInfo!.phone

            },
        ])

        if (profileError) {
            console.error('Error creating creator profile:', profileError)
            return { isErrorTrue: true, errorMessage: profileError.message }
        }
    }
}

export async function getProfile(user: User, role: 'brand' | 'creator' | 'random') {
    const table = role === 'brand' ? 'brand_profiles' : 'creator_profiles'
    const { data: profile, error } = await supabaseClient.from(table).select('*').eq('user_id', user.id).single()

    if (error && error.code !== 'PGRST116') {
        // PGRST116 is 'Row not found'
        console.error('Error fetching profile:', error)
        return { profile: null, isErrorTrue: true, errorMessage: error.message }
    }

    if (profile) {
        return { profile, isErrorTrue: false, errorMessage: null }
    }

    return { profile: null, isErrorTrue: false, errorMessage: null }
}
