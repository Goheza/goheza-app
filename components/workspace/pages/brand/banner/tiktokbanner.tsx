export default function TikTokReviewBanner() {
    return (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <span className="text-yellow-500 text-xl">⏳</span>
            <div>
                <p className="text-yellow-800 font-medium text-sm">TikTok Integration Under Review</p>
                <p className="text-yellow-700 text-xs mt-1">
                    We're currently awaiting TikTok's approval for our integration. Direct posting will be available once approved.
                </p>
            </div>
        </div>
    )
}