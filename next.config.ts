import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['panel.tuagentx.com', 'tuagentx.com', 'www.tuagentx.com', 'localhost:3000'],
    },
  },
  async headers() {
    return [
      {
        source: '/api/demo/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://tuagentx.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}
export default withSentryConfig(nextConfig, {
  org: "tuagentx",
  project: "crm",
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
})
