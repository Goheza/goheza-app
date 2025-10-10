"use client"

// hooks/useMasterKeyListener.ts
import { useState, useEffect, useCallback, useRef } from 'react'

// The target key sequence (lowercase)
const MASTER_SEQUENCE = 'goheza2025fathub'

/**
 * Custom hook to listen for a global key sequence and manage an activation state.
 * @returns [isMasterControlActive, resetControl]
 */
export const useMasterKeyListener = (): [boolean, () => void] => {
    const [isActive, setIsActive] = useState(false)
    // Ref to store the current part of the sequence typed by the user
    const sequenceRef = useRef('')

    // Function to reset the control state
    const resetControl = useCallback(() => {
        setIsActive(false)
        sequenceRef.current = ''
    }, [])

    useEffect(() => {
        if (isActive) {
            // Stop listening once activated, unless you want it to be typable again
            // Return early if the control is already active
            return
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore keys when typing in input fields (optional, but good practice)
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                return
            }

            const key = event.key.toLowerCase()
            const currentSequence = sequenceRef.current + key
            const targetLength = MASTER_SEQUENCE.length

            // Check if the current sequence is a prefix of the target sequence
            if (MASTER_SEQUENCE.startsWith(currentSequence)) {
                sequenceRef.current = currentSequence

                // Check if the full sequence is complete
                if (sequenceRef.current === MASTER_SEQUENCE) {
                    setIsActive(true)
                    // Optional: Clear the sequence after activation
                    sequenceRef.current = ''
                }
            } else {
                // If the key doesn't match the next character in the sequence,
                // check if the key is the *start* of the sequence itself.
                if (MASTER_SEQUENCE.startsWith(key)) {
                    sequenceRef.current = key
                } else {
                    // Reset the sequence tracking completely if it's a mismatch
                    sequenceRef.current = ''
                }
            }
        }

        // Attach and clean up the global event listener
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isActive]) // Re-run effect only when isActive changes

    return [isActive, resetControl]
}
