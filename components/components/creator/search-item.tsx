'use client'

import { Search } from 'lucide-react'

/**
 *
 * Used for searching and filtering items
 * @returns
 */

interface ISearchItemProps {
    /**
     * Send the request up so we can filter the results
     * @param value
     */
    onDidEnterUserInput(value: string): void
}

export default function SearchItem(props: ISearchItemProps) {
    return (
        <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
                onChange={(e) => {
                    let currentInput = e.target! as HTMLInputElement
                    let getCurrentInput = currentInput.value
                    setTimeout(() => {
                        props.onDidEnterUserInput(getCurrentInput)
                    }, 500)
                }}
                type="text"
                placeholder="Search Campaigns"
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
        </div>
    )
}
