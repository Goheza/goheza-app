import axios from 'axios'

export async function resolveTikTokUrl(shortUrl: string): Promise<string> {
    try {
        const response = await axios.head(shortUrl, {
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        })

        const finalUrl = response.request?.res?.responseUrl ?? response.config.url

        if (!finalUrl) {
            throw new Error('Unable to determine final URL')
        }

        const cleanUrl = new URL(finalUrl)

        return `${cleanUrl.origin}${cleanUrl.pathname}`
    } catch {
        const response = await axios.get(shortUrl, {
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        })

        const finalUrl = response.request?.res?.responseUrl ?? response.config.url

        const cleanUrl = new URL(finalUrl)

        return `${cleanUrl.origin}${cleanUrl.pathname}`
    }
}
