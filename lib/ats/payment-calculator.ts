interface PaymentBreakdown {
    numCreators: number
    maxPayout: number
    flatFee: number
    creatorPayoutTotal: number
    platformFee: number
    brandTotalPay: number
    perCreatorTotal: number
    totalViews: number
}

/**
 * Calculates the financial breakdown and estimated views for a Goheza campaign.
 * * View Logic: Total Views = 352 * (maxPayout * numCreators)
 */
export function calculateGohezaPayment(numCreators: number, maxPayout: number, flatFee: number = 0): PaymentBreakdown {
    // --- Corrected Constraint Check ---
    if (numCreators < 30) {
        throw new Error('Minimum number of creators is 30') // Corrected minimum check and message
    }
    if (maxPayout < 30) {
        throw new Error('Maximum payout per creator must be at least $30')
    }

    // --- 1. Per Creator Cost ---
    const perCreatorTotal = maxPayout + flatFee

    // --- 2. Creator Payout Total ---
    const creatorPayoutTotal = perCreatorTotal * numCreators

    // --- 3. Platform Fee (30%) ---
    const platformFee = creatorPayoutTotal * 0.3

    // --- 4. Brand Total Pay ---
    const brandTotalPay = creatorPayoutTotal + platformFee

    // --- 5. Estimated View Calculation ---
    /* * The views are based *only* on the 'maxPayout' component (excluding flatFee).
     * Total Views = (maxPayout * numCreators) * 352
     */
    const baseCreatorPayTotal = maxPayout * numCreators
    const viewsPerDollar = 352

    const totalViews = Math.round(baseCreatorPayTotal * viewsPerDollar)

    // --- Return Breakdown ---

    return {
        numCreators,
        maxPayout,
        flatFee,
        perCreatorTotal,
        creatorPayoutTotal,
        platformFee,
        brandTotalPay,
        totalViews,
    }
}
