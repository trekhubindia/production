/**
 * next-sitemap configuration
 * Docs: https://github.com/iamvishnusankar/next-sitemap
 */

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Set your production site URL via env or fallback
  siteUrl: process.env.SITE_URL || 'https://nomadictravels.shop',

  // Generate robots.txt along with sitemaps
  generateRobotsTxt: true,

  // Optional tweaks
  sitemapSize: 7000,
  // Exclude any paths if needed
  // exclude: ['/admin/*'],

  // If deploying with a custom basePath or i18n, next-sitemap will pick from next.config automatically
  // Additional transforms can be added if you need fine-grained control
};
