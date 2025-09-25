'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'


/**
 * We want to push the user to the Admin Dashboard
 * @returns 
 */

export default function MainPage() {
    const router = useRouter()

    useEffect(() => {
        const mainInit = () => {

            router.push('/main/admin/dashboard')
        }

        mainInit()
    }, [])

    return <div></div>
}
