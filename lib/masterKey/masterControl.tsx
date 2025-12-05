import { create } from 'zustand'

// Define the shape of the state
interface MasterControlState {
    isMasterControlActiv: boolean
    // Function to activate the control
    activateControl: () => void
    // Function to deactivate/reset the control
    resetControlt: () => void
}

// Create the Zustand store
export const useMasterControlStore = create<MasterControlState>((set) => ({
    isMasterControlActiv: false,

    activateControl: () => {
        // Set the state to true when the sequence is typed
        set({ isMasterControlActiv: true })
        
    },

    resetControlt: () => {
        // Set the state back to false
        set({ isMasterControlActiv: false })
        
    },
}))
