'use client'

/**
 * The Header Item to be shared on almost all screens
 *
 * ------------------------------------Zefer.
 * @returns
 */

import { Children, useEffect, useState } from 'react'
import UserAccountItem from './user-account'
import HeaderCreator from '../../creator/header-creator'
import { supabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface IHeaderComponentProps {
    children: React.ReactNode
}

export default function HeaderItemMain(props: IHeaderComponentProps) {
    const router = useRouter()

    /**
     * The UserName of the acccount
     */
    const [userName, setUserName] = useState<string>('Goheza')

    /**
     * The User Image
     */
    const [userImage, setUserImage] = useState<string>('')

    /**
     * Fired to signOut user
     */
    const onWillSignOutUser = async () => {
        await supabaseClient.auth.signOut()

        router.push('/auth/signin')
    }

    useEffect(() => {
        const onLoad = async () => {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (user) {
                setUserName(user.user_metadata!.fullName)
            }
        }

        onLoad()
    })

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl font-semibold text-[#E66262]">Goheza</span>
                    </div>
                </div>
                <div className='flex space-x-3'>
                    {props.children}
                    <UserAccountItem userImageSource={userImage} userName={userName} signOutUser={onWillSignOutUser} />
                </div>
            </div>
        </header>
    )
}
