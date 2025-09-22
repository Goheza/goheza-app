/**
 * Send feedback to the creator
 */

interface IFeedbackToCreator {
    creatorEmail: string
    feedback: string
    message: string
    campaignName: string
    campaignBrand: string
    decision: string
}

export function sendFeedbackToCreator(args: IFeedbackToCreator) {}
