// pages/_app.tsx
import React, { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'
import { useMasterKeyListener } from './masterKey'

// Simple Dialog Component (You should style this properly)
const MasterControlDialog: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
    if (!isVisible) return null

    // Basic inline styling for a small, visible dialog
    const style: React.CSSProperties = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '10px 15px',
        backgroundColor: '#00cc00', // Green for 'Activated'
        color: 'white',
        borderRadius: '5px',
        zIndex: 9999, // Ensure it's on top
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        fontSize: '14px',
        fontWeight: 'bold',
    }

    return <div style={style}>Master Control Activated</div>
}

const preload = () => {
    'Kalema Pius Preloaded'
}

export default MasterControlDialog
