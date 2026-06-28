/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@langchain/langgraph", "langchain"],
  },
};

module.exports = nextConfig;
