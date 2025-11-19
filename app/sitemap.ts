import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://goheza.com'

    // Static routes
    const routes = ['/', '/privacy-policy', '/terms','/main/auth/signin','/main/auth/signup'].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    return [...routes /* , ...postRoutes */]
}
