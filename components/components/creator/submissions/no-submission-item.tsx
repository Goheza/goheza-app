"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * 
 * Showed when there are no submissions available
 * @returns 
 */

export default function NoSubmissionsBanner() {

    const router = useRouter();

    const onWillLoadAvaialbleGigs = ()=>{
        router.push("/creator/dashboard")
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Submissions</h2>

            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-48 h-32 mx-auto mb-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <div className="w-32 h-20 bg-yellow-200 rounded border-2 border-yellow-300 relative">
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-300 rounded"></div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-12 bg-yellow-300 rounded"></div>
                    </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">You haven't submitted any gigs yet!</h3>
                <p className="text-gray-600 mb-6">Browse available gigs to get started.</p>
                <Button onClick={onWillLoadAvaialbleGigs} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg">Browse Gigs</Button>
            </div>
        </div>
    )
}
