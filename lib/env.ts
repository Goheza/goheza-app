function setURL() {
    let uri = 'http://localhost:3000'
    if (process.env.NODE_ENV == 'development') {
        return uri
    } else {
        return 'https://goheza-app.vercel.app'
    }
}

console.log("current-environment",process.env.NODE_ENV)


export const baseURL = setURL()
