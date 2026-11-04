/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  // Imagens sobem direto para /api/upload; o formulário só leva URLs. A Vercel limita o body a 4,5 MB.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Permite abrir o servidor de desenvolvimento pelo celular na rede local.
  allowedDevOrigins: ["192.168.0.161", "192.168.*.*"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
