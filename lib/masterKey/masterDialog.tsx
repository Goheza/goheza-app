'use client'

import { useEffect, useRef, useState } from 'react'

interface IMasterControlContainerProps {
    /**
     * An event that will fire when MasterControl is Activated
     * or DeActivated
     */
    onDidActivateOrDeActivateMasterControl(isActivated: boolean): void
}

/**
 * The Target Sequence for the control
 */
const MASTER_SEQUENCE = 'goheza2025fathub'

export default function MasterControlDetectorContainer(props: IMasterControlContainerProps) {
    /**
     * Used for hiding or showing dialog
     */
    const [isVisibleDialog, setVisibleDialog] = useState(false)
    /**
     * We use a reference to store the current key
     */
    const sequenceRef = useRef('')

    /**
     * Is MasterActive or Not
     */
    const [isMasterActive, setMasterActive] = useState(false)

    useEffect(() => {
        /**
         * If the MasterContol is Active already we chilll....
         */
        if (isMasterActive) {
            // Stop listening once activated, unless you want it to be typable again
            // Return early if the control is already active
            return
        }

        /**
         * Used to reset the MasterControl
         */

        const onWillResetMasterControl = () => {
            const cleanerTimeout = setTimeout(() => {
                setMasterActive(false)
                sequenceRef.current = ''

                /**
                 * The Dialog Will hide after 50 seconds
                 */
                setVisibleDialog(false)
                /**
                 * Fire Listener for masterControl Removal
                 */
                props.onDidActivateOrDeActivateMasterControl(false)
                /**
                 * Clean Timeout
                 */
                clearTimeout(cleanerTimeout)
            }, 50000)
        }

        /**
         * Used for registering KeyEvents that come in globally
         * @param event
         * @returns
         */
        const registerGlobalKeyDownListener = (event: KeyboardEvent) => {
            /**
             * We ignore the keys from the input Elements
             */
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                return
            }

            /**
             * Store the corresponding values that have been availed
             */
            const key = event.key.toLowerCase()
            const currentSequence = sequenceRef.current + key
            const targetLength = MASTER_SEQUENCE.length

            /**
             *
             * Check if the current sequence is a prefix of the target sequence
             */
            if (MASTER_SEQUENCE.startsWith(currentSequence)) {
                sequenceRef.current = currentSequence

                /**
                 * Check if the full sequence is complete
                 */
                if (sequenceRef.current === MASTER_SEQUENCE) {
                    /**
                     * If the Sequence iis Complete we activate;
                     */

                    //##################################

                    props.onDidActivateOrDeActivateMasterControl(true)

                    /**
                     * Accept the masterControl is on
                     */
                    setMasterActive(true)

                    /**
                     * Display the dialog
                     */
                    setVisibleDialog(true)
                    /**
                     * we start the timer
                     */
                    onWillResetMasterControl()

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

        /**
         * Register the event listener to the main touch
         */
        document.addEventListener('keydown', registerGlobalKeyDownListener)

        return () => {
            /**
             * Cleanup global Listener
             */
            document.addEventListener('keydown', registerGlobalKeyDownListener)
        }
    })
    return (
        <div
            style={{
                display: isVisibleDialog ? 'block' : 'none',
            }}
            className="fixed top-[20px] right-[20px] pt-[10px] pr-[15px] bg-[#00cc00] text-white z-[999] shadow text-[14px] font-bold"
        >
            Master Control Activated
        </div>
    )
}

const preload = () => {
    'Kalema Pius Preloaded'
}

// export default MasterControlDialog
