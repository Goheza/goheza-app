import { supabaseClient } from '../client'

const BUCKET_NAME = process.env.NEXT_PUBLIC_BOOM_FKNAME!  // ← set your real bucket here

export const removeStorageObject = async (videoUrl: string | null | undefined, fileName: string | null | undefined) => {
    const results: { attempted: { bucket: string; path: string; ok: boolean; error?: any }[] } = { attempted: [] }

    // Determine path to delete (prefer exact filename arg, fallback to last segment of URL)
    let pathCandidate: string | null = null
    if (fileName) pathCandidate = fileName
    if (!pathCandidate && videoUrl) {
        try {
            const u = new URL(videoUrl)
            const last = u.pathname.split('/').pop()
            if (last) pathCandidate = last
        } catch {}
    }
    if (!pathCandidate) {
        // nothing to delete
        results.attempted.push({ bucket: BUCKET_NAME, path: '(no-path-found)', ok: false, error: 'no-path-provided' })
        return results
    }

    // normalize (remove leading slash)
    const normalized = pathCandidate.replace(/^\/+/, '')

    try {
        const { data, error } = await supabaseClient.storage.from(BUCKET_NAME).remove([normalized])
        results.attempted.push({ bucket: BUCKET_NAME, path: normalized, ok: !error, error: error ?? undefined })
        return results
    } catch (err) {
        results.attempted.push({ bucket: BUCKET_NAME, path: normalized, ok: false, error: err })
        return results
    }
}
