interface ContentFilterStatus {
    numVideosPaidFor: number
    maxApplicationsAllowed: number
    applicationsReceived: number
    applicationsRemaining: number
    campaignOpen: boolean
    submittedVideos: number
    approvedVideos: number
    videosSentToBrand: number
    summary: string
}

/**
 * -- Inputs:

    numVideosPaidFor → number of videos the brand purchased

    applicationsReceived → how many creators have applied so far

    submittedVideos → how many creators actually submitted their videos

    approvedVideos → how many videos the admin approves for the brand to review

    ---Outputs:

    maxApplicationsAllowed → 4 * numVideosPaidFor

    applicationsRemaining → how many more creators can still apply before cutoff

    campaignOpen → boolean flag if apply button should still be clickable

    videosSentToBrand → approved videos (≤ submitted)

    summary → text snapshot of what’s going on
 * @param numVideosPaidFor 
 * @param applicationsReceived 
 * @param submittedVideos 
 * @param approvedVideos 
 * @returns 
 */

function calculateContentFilter(
    numVideosPaidFor: number,
    applicationsReceived: number,
    submittedVideos: number,
    approvedVideos: number
): ContentFilterStatus {
    if (numVideosPaidFor <= 0) {
        throw new Error('Brand must pay for at least 1 video')
    }

    // 🎯 Step 1: max allowed applications
    const maxApplicationsAllowed = numVideosPaidFor * 4

    // 🎯 Step 2: applications remaining until cutoff
    const applicationsRemaining = Math.max(0, maxApplicationsAllowed - applicationsReceived)

    // 🎯 Step 3: campaign open/closed
    const campaignOpen = applicationsReceived < maxApplicationsAllowed

    // 🎯 Step 4: videos sent = admin-approved submissions
    const videosSentToBrand = Math.min(approvedVideos, submittedVideos)

    // 🎯 Step 5: summary
    const summary = `
Campaign target: ${numVideosPaidFor} videos
Applications received: ${applicationsReceived}/${maxApplicationsAllowed}
Campaign open: ${campaignOpen ? 'Yes' : 'No'}
Submitted videos: ${submittedVideos}
Approved videos: ${videosSentToBrand}
`

    return {
        numVideosPaidFor,
        maxApplicationsAllowed,
        applicationsReceived,
        applicationsRemaining,
        campaignOpen,
        submittedVideos,
        approvedVideos,
        videosSentToBrand,
        summary: summary.trim(),
    }
}
