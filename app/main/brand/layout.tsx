'use client'

import HeaderBrand from '@/components/components/brand/header-brand'
import NotificationsDialog, { Notification } from '@/components/components/brand/notifications'
import HeaderItemMainBre from '@/components/components/common/header/header-bre'
import { fetchBrandNotifications } from '@/lib/ats/brandNotifications'
import { useEffect, useState } from 'react'

export default function RootLayout(props: { children: React.ReactNode }) {
    const [inotification, setINotifications] = useState<Notification[]>([])
    /**
     * For Handling the notification dialog
     */

    const [open, setOpen] = useState(false)

    const WillOpenDialog = () => {
        setOpen(true)
    }

    useEffect(() => {
        /**
         * Will fetch notifications for the brand
         */

        const willFetchBrandNotifications = async () => {
            interface _INotificationsData {
                source: string
                message: string
                id: string
            }
            const notificationsData = (await fetchBrandNotifications()!) as Promise<_INotificationsData[]>

            if (notificationsData) {
                let notificationsMapData: Notification[] = (await notificationsData).map((item) => {
                    return {
                        from: item.source,
                        id: item.id,
                        message: item.message,
                    }
                })

                setINotifications(notificationsMapData)
            }
        }
        willFetchBrandNotifications()
    }, [setINotifications])

    return (
        <div>
            <NotificationsDialog
                isOpen={open}
                notifications={inotification}
                onClose={() => {
                    setOpen(false)
                }}
            />
            <HeaderItemMainBre onWillOpenFunc={WillOpenDialog}/>
        
            <div className="translate-y-14 ">{props.children}</div>
        </div>
    )
}
