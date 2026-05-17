const { getDefaultConfig } = require("expo/metro-config");
const { withSentry } = require("@sentry/react-native/expo");

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Keep Metro scoped to this app by default. We only block transient debug
// folders here. Blocking `.pnpm` broadly breaks resolution in this workspace
// because app-level package links point into the root `node_modules/.pnpm`.
config.resolver.blockList = [
  ...((config.resolver && config.resolver.blockList) || []),
  /.*debug_tmp_.*/,
];

// Support bundling .db and .wasm files
config.resolver.assetExts.push("db", "wasm");

// Required for expo-sqlite web support (SharedArrayBuffer)
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    middleware(req, res, next);
  };
};

module.exports = withSentry(config);
