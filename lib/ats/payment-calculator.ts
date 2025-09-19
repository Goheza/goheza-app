interface PaymentBreakdown {
    numCreators: number
    maxPayout: number
    flatFee: number
    creatorPayoutTotal: number
    platformFee: number
    brandTotalPay: number
}

export function calculateGohezaPayment(numCreators: number, maxPayout: number, flatFee: number = 0): PaymentBreakdown {
    // ✅ enforce constraints
    if (numCreators < 50) {
        throw new Error('Minimum number of creators is 50')
    }
    if (maxPayout < 30) {
        throw new Error('Maximum payout per creator must be at least $30')
    }

    // Step 1: compute payout per creator (max payout + optional flat fee)
    const perCreatorTotal = maxPayout + flatFee

    // Step 2: total payout to creators
    const creatorPayoutTotal = perCreatorTotal * numCreators

    // Step 3: platform fee = 30% of creator payout
    const platformFee = creatorPayoutTotal * 0.3

    // Step 4: brand total = creators total + platform fee
    const brandTotalPay = creatorPayoutTotal + platformFee

    return {
        numCreators,
        maxPayout,
        flatFee,
        creatorPayoutTotal,
        platformFee,
        brandTotalPay,
    }
}
