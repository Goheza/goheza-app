


export async function getTikTokVideoId(url: string): Promise<string | null> {
    try {
        let finalUrl = url.trim()

        if (finalUrl.includes('vm.tiktok.com') || finalUrl.includes('vt.tiktok.com')) {
            const response = await fetch(finalUrl, {
                redirect: 'follow',
            })

            finalUrl = response.url
        }

        const parsed = new URL(finalUrl)

        const match = parsed.pathname.match(/\/video\/(\d{15,20})/) || parsed.pathname.match(/\/v\/(\d{15,20})/)

        return match?.[1] ?? null
    } catch {
        return null
    }
}
