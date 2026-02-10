/**
 * Site configuration
 */

export const siteConfig = {
  name: 'MyApp',
  description: 'A complete Next.js application with backend and frontend',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  links: {
    twitter: 'https://twitter.com/myapp',
    github: 'https://github.com/myapp',
  },
};

/**
 * API configuration
 */
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
};

/**
 * Feature flags
 */
export const features = {
  enableAuth: true,
  enableAnalytics: false,
  enableNotifications: true,
};
