const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@suppr/ui", "@suppr/contracts"],
  env: {
    NEXT_PUBLIC_AZURE_CDN_ENDPOINT: process.env.AZURE_CDN_ENDPOINT ?? "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.AZURE_CDN_HOSTNAME || "*.azurefd.net",
      },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "image.mux.com" },
    ],
  },
  experimental: { serverActions: { allowedOrigins: ["localhost:3000"] } },
};

module.exports = withPWA(nextConfig);
