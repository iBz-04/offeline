/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Avoid requiring native `sharp` during SSR/dev on Windows
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers', '@mlc-ai/web-llm'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@mlc-ai/web-llm'];
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        perf_hooks: false,
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };

    return config;
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
