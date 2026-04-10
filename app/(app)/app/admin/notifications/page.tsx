'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { BellRing, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Notification = {
    id: string
    message: string
    source_type: 'brand' | 'creator'
    source_id: string
    is_read: boolean
    created_at: string
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabaseClient
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching notifications:', error)
                toast.error('Failed to load notifications.')
                return
            }
            setNotifications(data as Notification[])
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (id: string) => {
        const { error } = await supabaseClient.from('admin_notifications').update({ is_read: true }).eq('id', id)

        if (error) {
            toast.error('Failed to mark as read.')
        } else {
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        }
    }

    const getSourceBadge = (type: string) => {
        switch (type) {
            case 'brand':
                return <Badge className="bg-blue-500/10 text-blue-500">Brand</Badge>
            case 'creator':
                return <Badge className="bg-[#e85c51]/10 text-[#e85c51]">Creator</Badge>
            default:
                return null
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-12 h-12 border-4 border-[#e85c51] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Notifications</h1>
            <div className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map((n) => (
                        <Card key={n.id} className="relative shadow-sm p-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${n.is_read ? 'bg-gray-200' : 'bg-[#e85c51]/20'}`}>
                                    {n.is_read ? (
                                        <BellOff className="h-5 w-5 text-gray-500" />
                                    ) : (
                                        <BellRing className="h-5 w-5 text-[#e85c51]" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-md font-medium text-neutral-800">{n.message}</p>
                                        <span className="text-xs text-neutral-500 ml-4">
                                            {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        {getSourceBadge(n.source_type)}
                                        <Badge
                                            variant="outline"
                                            className={`text-xs ${
                                                n.is_read ? 'bg-gray-100' : 'bg-green-100 text-green-600'
                                            }`}
                                        >
                                            {n.is_read ? 'Read' : 'New'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            {!n.is_read && (
                                <Button
                                    onClick={() => handleMarkAsRead(n.id)}
                                    variant="ghost"
                                    className="absolute bottom-4 right-4 text-xs h-8 px-2 py-1 text-neutral-500 hover:text-neutral-800"
                                >
                                    Mark as Read
                                </Button>
                            )}
                        </Card>
                    ))
                ) : (
                    <p className="text-center text-neutral-500">No notifications found.</p>
                )}
            </div>
        </div>
    )
}
