'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function PostSuccessPageBoundary() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const videoUrl = searchParams.get('videoUrl')
    const campaignId = searchParams.get('campaignId')

    if (!videoUrl || !campaignId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Missing campaign or video information.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 flex flex-col items-center text-center">
                <div className="w-40 h-40 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-8 overflow-hidden">
                    <img src="/tiktok.gif" alt="Posted to TikTok" className="w-full h-full object-cover" />
                </div>

                <div className="mb-2">
                    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200 mb-4">
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Posted successfully
                    </span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Live on TikTok!</h1>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    The video has been published to the creator&apos;s TikTok account and is now visible to the public.
                </p>

                <div className="flex flex-col gap-3 w-full">
                    <Button
                        onClick={() => window.open(videoUrl, '_blank')}
                        className="w-full bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
                    >
                        View video on TikTok
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => router.push(`/app/accounts/brand/campaigns/${campaignId}/submissions`)}
                        className="w-full"
                    >
                        Back to submissions
                    </Button>
                </div>
            </div>
        </div>
    )
}