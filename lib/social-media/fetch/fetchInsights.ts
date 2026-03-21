import { supabaseClient } from '@/lib/supabase/client'

/**
 * Used to fetch posts based on the campaign ID;
 * @param campaign_id
 */
export async function FetchPostsForCampaign(campaign_id: string) {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession()
    if (!session) {
        throw new Error('User not logged in')
    }
    const res = await fetch(`/api/campaigns/get-posts?campaignId=${campaign_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
        },
    })
    if (!res.ok) throw new Error('Failed to fetch posts')
    const { posts } = await res.json()
    return posts ?? []
}

/**
 * Fetch Insights for the campaign
 * @param campaign_id
 * @returns
 */
export async function FetchInsightsForCampaign(campaign_id: string) {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession()
    if (!session) {
        throw new Error('User not logged in')
    }
    const insightsRes = await fetch(`/api/campaigns/get-insights?campaignId=${campaign_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
        },
    })
    if (!insightsRes.ok) throw new Error('Failed to fetch insights')
    const { insights } = await insightsRes.json()
    return insights ?? []
}
