
/**
 * NEW: Define the possible states for the campaign creation process
 */
export type ProgressState =
    | 'idle'
    | 'calculating'
    | 'uploading-assets'
    | 'inserting-data'
    | 'notifying-admin'
    | 'complete'
    | 'error'

export interface ProgressStepProps {
    label: string
    state: 'pending' | 'active' | 'done' | 'error'
    current: ProgressState
}

/**
 * Used for progressive loading of the campaign
 * @param param0 
 * @returns 
 */


export const ProgressStep: React.FC<ProgressStepProps> = ({ label, state, current }) => {
    const icon = {
        done: (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        ),
        active: (
            <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        pending: <div className="w-3 h-3 rounded-full bg-gray-400"></div>,
    }[state]

    const color = {
        done: 'bg-green-500',
        active: 'bg-red-500',
        error: 'bg-red-500',
        pending: 'bg-white border-2 border-gray-400',
    }[state]

    const textColor =
        state === 'active' ? 'text-red-600 font-medium' : state === 'done' ? 'text-gray-900' : 'text-gray-500'

    return (
        <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${color} shadow-lg`}>
                {state === 'done' || state === 'active' || state === 'error' ? icon : null}
            </div>
            <span className={`text-sm ${textColor}`}>{label}</span>
        </div>
    )
}

/**
 * Progress Status Managers
 * @param step 
 * @param current 
 * @returns 
 */


export const getProgressStatus = (step: ProgressState, current: ProgressState) => {
    const order: ProgressState[] = ['uploading-assets', 'inserting-data', 'notifying-admin', 'complete']
    const stepIndex = order.indexOf(step)
    const currentIndex = order.indexOf(current)

    if (current === 'error') return 'error'
    if (stepIndex < currentIndex) return 'done'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
}

/**
 * Used to set Button Text
 * @param state 
 * @returns 
 */

export const getButtonText = (state: ProgressState): string => {
    switch (state) {
        case 'calculating':
            return 'Calculating...'
        case 'uploading-assets':
            return 'Uploading Assets...'
        case 'inserting-data':
            return 'Saving Campaign...'
        case 'notifying-admin':
            return 'Finalizing...'
        case 'complete':
            return 'Campaign Posted!'
        case 'error':
            return 'Try Again'
        default:
            return 'Create Campaign'
    }
}