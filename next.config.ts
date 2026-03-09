import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.puter.com;
  script-src-elem 'self' 'unsafe-inline' https://js.puter.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data: https:;
  connect-src 'self' https: wss:;
  frame-src 'self' https://nowpayments.io https://*.nowpayments.io;
  frame-ancestors 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  // Disable 'X-Powered-By: Next.js' header (information disclosure)
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            // HSTS: 2 years, includeSubDomains, preload-ready
            // In dev we set max-age=0 so local HTTP still works
            key: 'Strict-Transport-Security',
            value: isDev
              ? 'max-age=0'
              : 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // DENY prevents any framing, including same-origin (stronger than SAMEORIGIN)
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(self), browsing-topics=()',
          },
          {
            // Prevent cross-origin popups from retaining a reference to this window
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            // Prevent this origin's resources being embedded cross-origin
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
