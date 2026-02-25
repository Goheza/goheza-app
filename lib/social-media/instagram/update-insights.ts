/**
 * Used for updating Insights
 * @param campaignId
 */

import { supabaseClient } from '@/lib/supabase/client'

export async function UpdateInsightsForCampaign(campaignId: string) {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
        throw new Error('User not logged in')
    }
    await fetch('/api/instagram/insights', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ campaignId }),
    })
}
