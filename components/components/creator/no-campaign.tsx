import React from 'react'
import { Frown, PlusCircle } from 'lucide-react'

const NoCampaignsBanner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-center">
            <Frown className="w-16 h-16 text-[#e6626227] mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No Campaigns Available Right Now
            </h2>
            <p className="text-gray-600 mb-4 max-w-md">
                It looks like there aren't any new opportunities at the moment.
                Check back soon, as new campaigns are added daily!
            </p>
            
        </div>
    )
}

export default NoCampaignsBanner