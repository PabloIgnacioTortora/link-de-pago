import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/register', '/login', '/privacy', '/terms'],
        disallow: ['/dashboard', '/links', '/transactions', '/settings', '/api/'],
      },
    ],
    sitemap: 'https://link-de-pago.vercel.app/sitemap.xml',
  };
}
