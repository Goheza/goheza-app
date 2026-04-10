import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Goheza',
        short_name: 'Goheza',
        description: 'Get your businesses seen everywhere. Connect with thousands of content creators who promote your business, products, and services online and pay only for content that performs. Get Started Now',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#e85c51',
        icons: [
            {
                src: '/favicon.jpg',
                type: 'image/jpeg',
            },
          
        ],
    }
}
