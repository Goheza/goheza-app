import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function adminClient() {
    const cookieStore = await cookies()
    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: () => {},
        },
    })
}

export async function POST(req: Request) {
    try {
        const { user_id, role } = await req.json()
        if (!user_id || !role) {
            return NextResponse.json({ error: 'Missing user_id or role' }, { status: 400 })
        }

        const supabase = await adminClient()

        // 0️⃣ Delete dependent rows first
        if (role === 'creator') {
            // delete campaign submissions first
            const { error: submissionError } = await supabase
                .from('campaign_submissions')
                .delete()
                .eq('user_id', user_id)
            if (submissionError) {
                return NextResponse.json(
                    { error: `Failed to delete campaign submissions: ${submissionError.message}` },
                    { status: 400 }
                )
            }

            // add other dependent tables for creators here...
        } else if (role === 'brand') {
            // delete brand-related tables first
            // const { error: brandDataError } = await supabase
            //     .from('brand_campaigns') // example table
            //     .delete()
            //     .eq('brand', user_id)
            // if (brandDataError) {
            //     return NextResponse.json(
            //         { error: `Failed to delete brand campaigns: ${brandDataError.message}` },
            //         { status: 400 }
            //     )
            // }

            // add other dependent tables for brands here...
        }

        // 1️⃣ Delete profile
        const table = role === 'brand' ? 'brand_profiles' : 'creator_profiles'
        const { count: deletedCount, error: profileError } = await supabase
            .from(table)
            .delete({ count: 'exact' })
            .eq('user_id', user_id)

        if (profileError) {
            return NextResponse.json({ error: `Failed to delete profile: ${profileError.message}` }, { status: 400 })
        }

        if (!deletedCount || deletedCount === 0) {
            return NextResponse.json({ error: 'No profile found for this user_id' }, { status: 404 })
        }

        // 2️⃣ Delete auth user
        const { error: authError } = await supabase.auth.admin.deleteUser(user_id)
        if (authError) {
            return NextResponse.json({ error: `Failed to delete auth user: ${authError.message}` }, { status: 400 })
        }

        return NextResponse.json({
            message: 'User, dependent data, and profile deleted successfully',
        })
    } catch (err: any) {
        console.error('Delete user error:', err)
        return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
    }
}
