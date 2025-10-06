'use client'

import HeaderBrand from '@/components/components/brand/header-brand'
import NotificationsDialog, { Notification } from '@/components/components/brand/notifications'
import HeaderItemMainBre from '@/components/components/common/header/header-bre'
import { useEffect, useState } from 'react'

export default function RootLayout(props: { children: React.ReactNode }) {
 
   

    return (
        <div>
          
            <HeaderItemMainBre />
        
            <div className="translate-y-14 ">{props.children}</div>
        </div>
    )
}
