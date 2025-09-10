


function setURL() {
    let uri = 'http://localhost:3000'
    if(process.env.NODE_ENV == 'development') {
        return uri;
    }else{
        uri = 'https://goheza-app.vercel.app'
        return uri
    }
}

export const baseURL =   setURL()