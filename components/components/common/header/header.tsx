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


    const [role,setRole] = useState('creator')

    /**
     * The UserName of the acccount
     */
    const [userName, setUserName] = useState<string>('Goheza')
    /**
     * The Emails
     */
    const [userEmail, setUserEmail] = useState<string>('Goheza')

    /**
     * The User Image
     */
    const [userImage, setUserImage] = useState<string>('')

    /**
     * Fired to signOut user
     */
    const onWillSignOutUser = async () => {
        await supabaseClient.auth.signOut()

        router.push('/main/auth/signin')
    }

    useEffect(() => {
        const onLoad = async () => {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser()

            if (user) {
                const userName =
                    user.identities![0]?.identity_data?.full_name ||
                    user.user_metadata?.full_name ||
                    user.user_metadata.fullName
                const userImage = user.identities![0]?.identity_data?.avatar_url || user.user_metadata?.avatar_url;

                const userRole = 

                setUserName(userName)
                setUserImage(userImage)
                setUserEmail(user.email!)
            }
        }

        onLoad()
    })

    return (
        <header className="bg-white border-b px-6 py-4 fixed top-0 z-40 w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl font-semibold text-[#E66262]">Goheza</span>
                    </div>
                </div>
                <div className="flex space-x-5 items-center">
                    <div className='mr-6'>{props.children}</div>
                    <UserAccountItem
                        userEmail={userEmail}
                        userImageSource={userImage}
                        userName={userName}
                        signOutUser={onWillSignOutUser}
                    />
                </div>
            </div>
        </header>
    )
}
