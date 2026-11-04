/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  // Permite abrir o servidor de desenvolvimento pelo celular na rede local.
  allowedDevOrigins: ["192.168.0.161", "192.168.*.*"],
};
export default nextConfig;
