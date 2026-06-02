/**
 * Extracts the TikTok video ID from a TikTok video URL.
 * Supports:
 *   https://www.tiktok.com/@handle/video/7234567890123456789
 *   https://m.tiktok.com/v/7234567890123456789.html
 *   https://vm.tiktok.com/ZMxxxxxxx/   (short links)
 *   https://vt.tiktok.com/ZMxxxxxxx/   (short links)
 */
export function extractTikTokVideoId(url: string): string | null {
  // Standard long-form: /@handle/video/<id>
  const videoPathMatch = url.match(/\/video\/(\d+)/)
  if (videoPathMatch) return videoPathMatch[1]

  // Mobile format: /v/<id>.html
  const mobileMatch = url.match(/\/v\/(\d+)/)
  if (mobileMatch) return mobileMatch[1]

  // Short links (vm.tiktok.com, vt.tiktok.com) — no numeric ID available
  // These must be resolved to a full URL first (via HTTP redirect)
  const isShortLink = /^https?:\/\/(vm|vt)\.tiktok\.com\//.test(url)
  if (isShortLink) return null // caller must resolve the redirect first

  return null
}

/**
 * Resolves a short TikTok URL (vm.tiktok.com / vt.tiktok.com) to its full URL,
 * then extracts the video ID.
 *
 * Must be called in an environment where fetch + redirect following is available.
 */
export async function resolveShortTikTokUrl(url: string): Promise<string | null> {
  const isShortLink = /^https?:\/\/(vm|vt)\.tiktok\.com\//.test(url)
  if (!isShortLink) return extractTikTokVideoId(url)

  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return extractTikTokVideoId(response.url)
  } catch {
    return null
  }
}