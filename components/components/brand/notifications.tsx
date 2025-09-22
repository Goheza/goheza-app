'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export interface Notification {
    id: string
    from: string
    message: string
    createdAt?: string
}

interface NotificationsDialogProps {
    notifications: Notification[]
    isOpen: boolean
    onClose: () => void
}

export default function NotificationsDialog({ notifications, isOpen, onClose }: NotificationsDialogProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center p-4 bg-black/40">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">No notifications yet</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {notifications.map((n) => (
                                <motion.li
                                    key={n.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{n.from}</p>
                                        <p className="text-gray-600">{n.message}</p>
                                    </div>
                                    {n.createdAt && (
                                        <span className="text-sm text-gray-400 mt-1 sm:mt-0">{n.createdAt}</span>
                                    )}
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-[#c23e3e] text-white font-semibold hover:bg-[#df4848] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
