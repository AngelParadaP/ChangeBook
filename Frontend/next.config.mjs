/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3500/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.bucket.for.cbook.webapp.20112004.s3.amazonaws.com",
        port: "",
        pathname: "/", // Utiliza '/' para coincidir con todas las imágenes en ese hostname
      },
    ],
  },
};




export default nextConfig;
