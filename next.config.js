const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const DEPLOY_BASE_PATH = "/Automata-Playground";

module.exports = phase => {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    ...(isDevelopment
      ? {}
      : {
          basePath: DEPLOY_BASE_PATH,
          assetPrefix: DEPLOY_BASE_PATH,
        }),
  };

  return nextConfig;
};
