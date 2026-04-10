
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/app/admin/', '/_next/', '/private/','/app/admin'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/', '/app/admin/'],
            },
        ],
        sitemap: 'https://goheza.com/sitemap.xml',
        host: 'https://goheza.com',
    }
}
