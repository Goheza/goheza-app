interface ITio {
    publishId: string
    creatorId: string
}

export async function getTitktokURL(args: ITio): Promise<string> {
    const res = await fetch('/api/tiktok/get-post-url', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            publishId: args.publishId,
            creatorId: args.creatorId,
        }),
    })

    const data = await res.json()

    return data.url
}
