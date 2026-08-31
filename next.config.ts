import type { NextConfig } from "next";
import { hostname, networkInterfaces } from "node:os";

function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>(["127.0.0.1", hostname()]);

  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      origins.add(address.address);

      // URL.hostname keeps brackets around IPv6 literals. Keep both forms so
      // Next.js can match the browser Origin regardless of the URL parser path.
      if (address.family === "IPv6" && !address.address.includes("%")) {
        origins.add(`[${address.address}]`);
      }
    }
  }

  for (const origin of process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",") ?? []) {
    const trimmedOrigin = origin.trim();
    if (!trimmedOrigin) {
      continue;
    }

    try {
      const originUrl = new URL(
        trimmedOrigin.includes("://")
          ? trimmedOrigin
          : `http://${trimmedOrigin}`,
      );
      origins.add(originUrl.hostname);
    } catch {
      // Preserve Next.js wildcard patterns such as "*.dev.example".
      origins.add(trimmedOrigin);
    }
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  // Next.js protects development-only assets and HMR sockets with an Origin
  // allowlist. Include every address owned by this machine so LAN access works
  // without weakening that protection to arbitrary third-party origins.
  allowedDevOrigins: getAllowedDevOrigins(),
};

export default nextConfig;
