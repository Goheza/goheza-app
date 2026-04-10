import { supabaseClient } from '@/lib/supabase/client'

export interface Campaign {
    id: string
    name: string
    status: 'approved' | 'inreview' | 'cancelled'
    budget: string
    createdAt: string
    submissionsCount: number
    approvedSubmissions: number
}

export interface BrandProfile {
    id: string
    brandName: string
    email: string
}

// --- Queries ---

const CAMPAIGN_SELECT = `
    id,
    name,
    status,
    budget,
    payout,
    created_at,
    campaign_submissions(count),
    approved:campaign_submissions(count).eq(status, 'approved')
` as const

/**
 * Used to fetch the brand campaigns
 * @param userId
 * @returns
 */
export async function fetchBrandCampaigns(userId: string) {
    const { data, error } = await supabaseClient
        .from('campaigns')
        .select(CAMPAIGN_SELECT)
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return data ?? []
}

// --- Mappers ---

/**
 * Used to map campaigns
 * @param raw
 * @returns
 */
function mapCampaign(raw: any): Campaign {
    return {
        id: raw.id,
        name: raw.name,
        status: raw.status,
        budget: raw.budget ?? raw.payout ?? '-',
        createdAt: new Date(raw.created_at).toLocaleDateString(),
        submissionsCount: raw.campaign_submissions?.[0]?.count ?? 0,
        approvedSubmissions: raw.approved?.[0]?.count ?? 0,
    }
}

export function mapCampaigns(rawCampaigns: any[]): Campaign[] {
    return rawCampaigns.map(mapCampaign)
}

/**
 * Used to get the brand campaigns at once
 * @param userId
 * @returns
 */
export async function getBrandCampaigns(userId: string): Promise<Campaign[]> {
    const raw = await fetchBrandCampaigns(userId)
    return mapCampaigns(raw)
}

/**
 * Fetch the current brand
 * @param userId
 * @returns
 */

export async function fetchBrandProfile(userId: string): Promise<BrandProfile> {
    const { data, error } = await supabaseClient.from('brand_profiles').select('*').eq('user_id', userId).single()
    if (error) throw new Error(error.message)
    return data
}

// src/lib/appServiceData/fetchSubmissionById.ts

export interface RawSubmissionRow {
    id: string
    user_id: string
    campaign_id: string
    video_url: string
    caption: string | null
    file_name: string
    file_size: number
    status: 'pending' | 'approved' | 'rejected' | string
    submitted_at: string
    reviewed_by: string | null
    reviewed_at: string | null
    feedback: string | null
    campaigns?: { name?: string; description?: string; payout?: string; requirements?: string[]; status?: string }
    creator_profiles?: { full_name?: string | null; email?: string | null }
}

export async function fetchSubmissionById(
    submissionId: string
): Promise<{ data: RawSubmissionRow | null; error: string | null }> {
    const { data, error } = await supabaseClient
        .from('campaign_submissions')
        .select(
            `
                id,
                user_id,
                campaign_id,
                video_url,
                caption,
                file_name,
                file_size,
                status,
                submitted_at,
                reviewed_by,
                reviewed_at,
                feedback,
                campaigns (
                    name,
                    description,
                    payout,
                    requirements,
                    status
                ),
                creator_profiles!campaign_submissions_creator_fkey (
                    full_name,
                    email
                )
            `
        )
        .eq('id', submissionId)
        .single()

    if (error || !data) {
        console.error('Error fetching submission:', error)
        return { data: null, error: 'Submission not found.' }
    }

    return { data: data as unknown as RawSubmissionRow, error: null }
}

export interface DisplaySubmission {
    id: string
    user_id: string // ✅ Bug 1 fix: added user_id
    campaign_id: string
    creator_name: string

    submission_date: string
    campaign_title: string
    campaign_description?: string
    status: 'pending' | 'approved' | 'rejected' | string
    video_url: string
    caption: string | null
    file_name: string
    file_size: number
    feedback: string | null
}

export function mappedSubmissionsData(row: RawSubmissionRow) {
    const transformed: DisplaySubmission = {
        id: row.id,
        user_id: row.user_id, // ✅ Bug 1 fix: mapped user_id
        campaign_id: row.campaign_id,
        creator_name: row.creator_profiles?.full_name?.trim() || row.creator_profiles?.email || 'Unknown Creator',
        submission_date: row.submitted_at,
        campaign_title: row.campaigns?.name || 'Unknown Campaign',
        campaign_description: row.campaigns?.description || undefined,
        status: row.status,
        video_url: row.video_url,
        caption: row.caption,
        file_name: row.file_name,
        file_size: row.file_size,
        feedback: row.feedback,
    }
    return transformed;
}
