'use client'
export function confirmAction(message: string) {
    return new Promise<boolean>((resolve) => {
        const ok = window.confirm(message)
        resolve(ok)
    })
}
