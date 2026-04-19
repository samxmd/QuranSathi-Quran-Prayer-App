const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Keep Metro scoped to this app by default. Watching the whole workspace makes
// Windows fallback watchers crawl pnpm internals and can crash on transient
// package directories inside `.pnpm`.
config.watchFolders = config.watchFolders || [];

// Resolve through the app's node_modules first, then fall back to the workspace
// root only for shared packages that are linked into this app.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
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

module.exports = config;
