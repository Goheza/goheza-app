/**
 * Extracts the TikTok video ID from a TikTok video URL.
 * Supports:
 *   https://www.tiktok.com/@handle/video/7234567890123456789
 *   https://vm.tiktok.com/ZMxxxxxxx/ (short links — these need to be resolved first)
 */
export function extractTikTokVideoId(url: string): string | null {
    const match = url.match(/\/video\/(\d+)/)
    return match ? match[1] : null
}