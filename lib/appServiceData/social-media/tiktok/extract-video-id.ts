export async function getTikTokVideoId(url: string): Promise<string | null> {
    try {
        let finalUrl = url.trim()

        if (finalUrl.includes('vm.tiktok.com') || finalUrl.includes('vt.tiktok.com')) {
            const _X_ = await resolveTikTok(finalUrl)
            finalUrl = _X_
        }

        const parsed = new URL(finalUrl)

        const match = parsed.pathname.match(/\/video\/(\d{15,20})/) || parsed.pathname.match(/\/v\/(\d{15,20})/)

        return match?.[1] ?? null
    } catch {
        return null
    }
}

export async function resolveTikTok(shortUrl: string): Promise<string> {
    const response = await fetch('/api/resolve-url', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: shortUrl,
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to resolve TikTok URL')
    }

    const data = await response.json()

    return data.resolvedUrl
}
