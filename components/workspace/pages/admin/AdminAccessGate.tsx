'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// --- Configuration ---
const ACTIVATION_CODE_SEQ = (process.env.NEXT_PUBLIC_PRIEM || 'admin').toLowerCase()
const ADMIN_CODE = (process.env.NEXT_PUBLIC_KUO || '').trim()

const SEQ_LENGTH = ACTIVATION_CODE_SEQ.length
const ACCESS_KEY = 'admin_access_granted'
const LOCK_KEY = 'admin_access_locked'
const MAX_ATTEMPTS = 5

interface AdminAccessGateProps {
    children: React.ReactNode
}

export default function AdminAccessGate({ children }: AdminAccessGateProps) {
    const router = useRouter()

    const [hasAccess, setHasAccess] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    const [keyIndex, setKeyIndex] = useState(0)
    const [isSequenceComplete, setIsSequenceComplete] = useState(false)

    const [validationCode, setValidationCode] = useState('')
    const [isAuthenticating, setIsAuthenticating] = useState(false)

    const [isMobileInputActive, setIsMobileInputActive] = useState(false)
    const [mobileSequenceInput, setMobileSequenceInput] = useState('')

    const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
    const [isLocked, setIsLocked] = useState(false)

    const keyIndexRef = useRef(0)
    const lastKeyTime = useRef(0)

    // Hydration-safe init
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHasAccess(sessionStorage.getItem(ACCESS_KEY) === 'true')
            setIsLocked(sessionStorage.getItem(LOCK_KEY) === 'true')
            setIsHydrated(true)
        }
    }, [])

    const resetSequence = useCallback(() => {
        keyIndexRef.current = 0
        setKeyIndex(0)
        setIsSequenceComplete(false)
        setIsMobileInputActive(false)
        setMobileSequenceInput('')
    }, [])

    const checkSequence = useCallback(
        (pressedKey: string): boolean => {
            if (isSequenceComplete || isLocked) return false

            // debounce spam typing
            const now = Date.now()
            if (now - lastKeyTime.current < 120) return false
            lastKeyTime.current = now

            const normalizedKey = pressedKey.toLowerCase()
            const expectedKey = ACTIVATION_CODE_SEQ[keyIndexRef.current]

            if (normalizedKey === expectedKey) {
                const nextIndex = keyIndexRef.current + 1

                keyIndexRef.current = nextIndex
                setKeyIndex(nextIndex)

                if (nextIndex === SEQ_LENGTH) {
                    setIsSequenceComplete(true)
                    setMobileSequenceInput('')
                    toast.success('Sequence accepted. Enter validation code.')
                }

                return true
            }

            // reset on wrong key
            if (keyIndexRef.current > 0) {
                toast.info('Sequence reset.')
            }

            keyIndexRef.current = 0
            setKeyIndex(0)
            setIsSequenceComplete(false)

            return false
        },
        [isSequenceComplete, isLocked]
    )

    // Desktop key listener
    useEffect(() => {
        if (hasAccess || isSequenceComplete || isMobileInputActive || !isHydrated) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

            checkSequence(event.key)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [hasAccess, isSequenceComplete, isMobileInputActive, checkSequence, isHydrated])

    // Mobile input fix
    const handleMobileSequenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const previousLength = mobileSequenceInput.length

        setMobileSequenceInput(value)

        if (value.length > previousLength && value.length > 0) {
            const lastKey = value[value.length - 1]
            const success = checkSequence(lastKey)
            if (!success) setMobileSequenceInput('')
        }
    }

    const handleValidation = async () => {
        if (isLocked || isAuthenticating) return

        setIsAuthenticating(true)

        try {
            await new Promise((r) => setTimeout(r, 800))

            const success = validationCode.trim() === ADMIN_CODE

            if (success) {
                sessionStorage.setItem(ACCESS_KEY, 'true')
                setHasAccess(true)
                toast.success('Access granted.')
            } else {
                const remaining = attemptsLeft - 1
                setAttemptsLeft(remaining)
                setValidationCode('')

                if (remaining <= 0) {
                    setIsLocked(true)
                    sessionStorage.setItem(LOCK_KEY, 'true')
                    toast.error('Session locked.')
                } else {
                    toast.error(`Invalid code. ${remaining} attempts left.`)
                }

                resetSequence()
            }
        } finally {
            setIsAuthenticating(false)
        }
    }

    if (!isHydrated) return null
    if (hasAccess) return <>{children}</>

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-white">
            <svg
                className="w-16 h-16 text-[#e85c51] mb-6 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
            </svg>

            <h1 className="text-4xl font-extrabold mb-4">ACCESS DENIED</h1>

            <p className="text-xl text-gray-400 mb-8 text-center">
                {isLocked
                    ? 'Session locked.'
                    : isSequenceComplete
                    ? 'Sequence accepted. Enter validation code.'
                    : 'Enter secret sequence.'}
            </p>

            {/* Progress */}
            {!isSequenceComplete && !isLocked && (
                <div className="flex gap-2 mb-6">
                    {Array.from({ length: SEQ_LENGTH }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${i < keyIndex ? 'bg-green-400' : 'bg-gray-600'}`}
                        />
                    ))}
                </div>
            )}

            {/* Mobile input */}
            {!isSequenceComplete && !isLocked && (
                <div className="w-full max-w-xs space-y-4">
                    {!isMobileInputActive ? (
                        <Button onClick={() => setIsMobileInputActive(true)} className="w-full bg-[#3c3c3c]">
                            Activate Mobile Input
                        </Button>
                    ) : (
                        <Input
                            type="password"
                            value={mobileSequenceInput}
                            onChange={handleMobileSequenceChange}
                            className="w-full bg-gray-800"
                            autoFocus
                        />
                    )}
                </div>
            )}

            {/* Validation */}
            {isSequenceComplete && !isLocked && (
                <div className="w-full max-w-xs space-y-4">
                    <Input
                        type="password"
                        value={validationCode}
                        onChange={(e) => setValidationCode(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleValidation()
                        }}
                        className="w-full bg-gray-800"
                    />

                    <Button
                        onClick={handleValidation}
                        disabled={isAuthenticating || !validationCode.trim()}
                        className="w-full bg-[#e85c51]"
                    >
                        {isAuthenticating ? 'Verifying...' : 'Validate Access'}
                    </Button>
                </div>
            )}

            <Button onClick={() => router.push('/')} variant="link" className="mt-12 text-gray-500">
                Return to Home
            </Button>
        </div>
    )
}
