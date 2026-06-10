export function getTikTokVideoId(url: string): string | null {
  try {
    const { pathname } = new URL(url.trim())
    const match = pathname.match(/\/video\/(\d{15,20})/)
    return match ? match[1] : null
  } catch {
    return null
  }
}