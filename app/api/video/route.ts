import { NextRequest } from 'next/server'

const SUPPORTED_VIDEO_TYPES = new Set([
    'video/mp4',
    'video/quicktime',
    'video/x-mov',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/x-msvideo',
    'video/x-matroska',
    'video/3gpp',
    'video/x-m4v',
])

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
    const { filename } = params
    const supabaseUrl = `https://hlqxrlkjocyqhjcycnky.supabase.co/storage/v1/object/public/campaign-videos/${filename}`

    const videoRes = await fetch(supabaseUrl)

    if (!videoRes.ok) {
        return new Response('Video not found', { status: 404 })
    }

    const contentType = videoRes.headers.get('Content-Type') || 'video/mp4'

    if (!SUPPORTED_VIDEO_TYPES.has(contentType)) {
        return new Response(`Unsupported video type: ${contentType}`, { status: 415 })
    }

    const contentLength = videoRes.headers.get('Content-Length')

    return new Response(videoRes.body, {
        headers: {
            'Content-Type': contentType,
            ...(contentLength && { 'Content-Length': contentLength }),
            'Cache-Control': 'public, max-age=31536000',
        },
    })
}
