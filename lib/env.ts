function setURL() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  } else {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://goheza.com'
  }
}

export const baseURL = "https://goheza.com"


