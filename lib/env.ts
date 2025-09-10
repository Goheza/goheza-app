


export const baseURL =
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : typeof window !== 'undefined'
        ? window.location.origin
        : ''
