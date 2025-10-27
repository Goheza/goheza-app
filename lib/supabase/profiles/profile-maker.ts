import { User } from '@supabase/supabase-js'
import { supabaseClient } from '../client'

interface IEXtraInfo {
    phone:string;
    country:string;
    paymentMethod:string;
}

export async function makeProfile(user: User, role: 'brand' | 'creator',extraInfo?:IEXtraInfo) {

    /**
     * Get Profile Contact from here
     */
    let userContact = user.user_metadata!.phone! as string;

    if (role === 'brand') {
        const { error: profileError } = await supabaseClient.from('brand_profiles').insert([
            {
                user_id: user.id,
                brand_name: user.identities![0]?.identity_data?.full_name || user.user_metadata?.fullName, // use fullName for now
                brand_email: user.email!,
                phone : userContact
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
                country :"",
                phone : userContact

            },
        ])

        if (profileError) {
            console.error('Error creating creator profile:', profileError)
            return { isErrorTrue: true, errorMessage: profileError.message }
        }
    }
}

