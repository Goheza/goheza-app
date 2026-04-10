'use client'

import React, { useState, useEffect, useCallback } from 'react'
// ⭐ Assuming these components are available in your project setup
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

// --- Configuration ---
const ACTIVATION_CODE_SEQ = process.env.NEXT_PUBLIC_PRIEM || 'admin'; // Added fallback for safety
const SEQ_LENGTH = ACTIVATION_CODE_SEQ.length
const ACCESS_KEY = 'admin_access_granted'
// !!! WARNING: This must be replaced with a secure server-side check !!!
const SECRET_BACKEND_CODE = process.env.NEXT_PUBLIC_KUO
// ----------------------

interface AdminAccessGateProps {
    children: React.ReactNode
}

export default function AdminAccessGate({ children }: AdminAccessGateProps) {
    const [hasAccess, setHasAccess] = useState(
        typeof window !== 'undefined' ? sessionStorage.getItem(ACCESS_KEY) === 'true' : false
    )
    const [keyIndex, setKeyIndex] = useState(0)
    const [isSequenceComplete, setIsSequenceComplete] = useState(false)
    const [validationCode, setValidationCode] = useState('')
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    
    // 💡 NEW STATE for Mobile Access
    const [isMobileInputActive, setIsMobileInputActive] = useState(false) 
    const [mobileSequenceInput, setMobileSequenceInput] = useState('')


    // --- Core Sequence Logic (Reusable for Keyboard and Mobile Input) ---
    const checkSequence = useCallback((pressedKey: string) => {
        if (hasAccess || isSequenceComplete) return

        // Ensure key is treated as lowercase for case-insensitive matching
        const normalizedKey = pressedKey.toLowerCase()
        const expectedKey = ACTIVATION_CODE_SEQ[keyIndex]

        if (normalizedKey === expectedKey) {
            const nextIndex = keyIndex + 1

            if (nextIndex === SEQ_LENGTH) {
                setIsSequenceComplete(true)
                setIsMobileInputActive(false) // Hide mobile input on success
                toast.success('Sequence correct. Enter validation code to proceed.')
            } else {
                setKeyIndex(nextIndex)
            }
            return true // Key accepted
        } else {
            // Key mismatch: reset the sequence
            setKeyIndex(0)
            toast.info('Sequence reset.')
            return false // Key rejected
        }
    }, [hasAccess, keyIndex, isSequenceComplete])


    // --- Desktop Key-Stroke Listener useEffect ---
    useEffect(() => {
        if (hasAccess || isSequenceComplete || isMobileInputActive) return

        const handleKeyPress = (event: KeyboardEvent) => {
            // Prevent sequence from being typed if a regular input is focused
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return
            }
            checkSequence(event.key)
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => {
            window.removeEventListener('keydown', handleKeyPress)
        }
    }, [hasAccess, isSequenceComplete, isMobileInputActive, checkSequence])


    // --- Mobile Input Handler ---
    const handleMobileSequenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase()
        setMobileSequenceInput(value)
        
        // Check only the last typed character
        if (value.length > mobileSequenceInput.length && value.length > 0) {
             const lastKey = value[value.length - 1]
             const success = checkSequence(lastKey);

             if (!success) {
                 // Reset the visual input after failure to ensure the user restarts
                 setMobileSequenceInput('');
             }
        }
    }


    // --- Validation Handler ---
    const handleValidation = async () => {
        setIsAuthenticating(true)

        // --- START: Simulated Backend/API Check (Replace with real API call) ---
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (validationCode === SECRET_BACKEND_CODE) {
            sessionStorage.setItem(ACCESS_KEY, 'true')
            setHasAccess(true)
            toast.success('Access granted and secured for this session.')
        } else {
            toast.error('Invalid validation code. Restarting sequence...')
            setValidationCode('')
            setIsSequenceComplete(false)
            setKeyIndex(0)
            setIsMobileInputActive(false); // Reset mobile state
            setMobileSequenceInput('');
        }
        // --- END: Simulated Backend/API Check ---

        setIsAuthenticating(false)
    }

    if (hasAccess) {
        return <>{children}</>
    }

    // --- Unauthorized Access Screen (Lock Screen UI) ---
    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-white">
            <svg
                className="w-16 h-16 text-[#e85c51] mb-6 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
            </svg>
            <h1 className="text-4xl font-extrabold mb-4">ACCESS DENIED</h1>
            <p className="text-xl text-gray-400 mb-8 text-center">
                {isSequenceComplete
                    ? 'Sequence accepted. Enter validation code.'
                    : 'Unauthorized area. Start typing the secret sequence.'}
            </p>

            {/* Visual Feedback for Key Sequence */}
            {!isSequenceComplete && (
                <div className="text-lg font-mono text-center mb-6">
                    <p className="text-green-400">{ACTIVATION_CODE_SEQ.substring(0, keyIndex)}</p>
                   
                </div>
            )}

            {/* 💡 Mobile Input Section */}
            {!isSequenceComplete && (
                <div className="w-full max-w-xs space-y-4">
                    {!isMobileInputActive && (
                        <Button
                            onClick={() => setIsMobileInputActive(true)}
                            className="w-full bg-[#3c3c3c] hover:bg-gray-700 text-white"
                        >
                            Activate Mobile Input
                        </Button>
                    )}
                    
                    {isMobileInputActive && (
                        <>
                            <Input
                                type="text"
                                placeholder="Type the secret sequence here..."
                                value={mobileSequenceInput}
                                onChange={handleMobileSequenceChange}
                                className="w-full bg-gray-800 border-gray-700 text-white focus:ring-[#e85c51]"
                                autoFocus
                            />
                            <p className="text-sm text-[#e85c51] text-center">
                                * Type the sequence character by character.
                            </p>
                        </>
                    )}
                </div>
            )}


            {/* Validation Input */}
            {isSequenceComplete && (
                <div className="w-full max-w-xs space-y-4">
                    <Input
                        type="password"
                        placeholder="Validation Code"
                        value={validationCode}
                        onChange={(e) => setValidationCode(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleValidation()
                        }}
                        className="w-full bg-gray-800 border-gray-700 text-white"
                        autoFocus
                    />
                    <Button
                        onClick={handleValidation}
                        disabled={isAuthenticating || validationCode.length === 0}
                        className="w-full bg-[#e85c51] hover:bg-[#f3867e] text-white"
                    >
                        {isAuthenticating ? 'Verifying...' : 'Validate Access'}
                    </Button>
                </div>
            )}

            <Button
                onClick={() => (window.location.href = '/')}
                variant="link"
                className="mt-12 text-gray-500 hover:text-white"
            >
                Return to Home
            </Button>
        </div>
    )
}