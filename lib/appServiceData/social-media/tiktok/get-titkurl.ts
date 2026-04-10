

export async function getTitktokURL(publishId: string):Promise<string> {
    const res = await fetch('/api/tiktok/get-post-url', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publishId }),
    })

    const data = await res.json()

    return data.url
}
