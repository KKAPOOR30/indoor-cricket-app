import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // COEP/COOP headers will be added in Phase 2 when MediaPipe WASM is integrated.
  // They are intentionally left out here to avoid breaking font/CDN loading on the home page.
};

export default nextConfig;
