const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const path = require("path");

const DEPLOY_BASE_PATH = "/Automata-Lab";
const SRC_ALIASES = [
  "components",
  "locales",
  "modules",
  "observables",
  "pages",
  "styles",
];

module.exports = phase => {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    webpack: config => {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": __dirname,
        ...Object.fromEntries(
          SRC_ALIASES.map(alias => [alias, path.join(__dirname, alias)])
        ),
      };

      return config;
    },
    ...(isDevelopment
      ? {}
      : {
          basePath: DEPLOY_BASE_PATH,
          assetPrefix: DEPLOY_BASE_PATH,
        }),
  };

  return nextConfig;
};
