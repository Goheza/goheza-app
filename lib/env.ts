function setURL() {
    let uri = 'http://localhost:3000'
    if (process.env.NODE_ENV == 'development') {
        return uri
    } else {
        return 'https://goheza-app.vercel.app'
    }
}

export const baseURL = setURL()
