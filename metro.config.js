const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase ships CommonJS (.cjs) entry points for React Native, and Metro's
// package.json "exports" resolution conflicts with them (produces
// "Component auth has not been registered yet"). Fall back to the classic
// resolver and explicitly allow .cjs files.
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// Joi (v17+) publishes a Node-free "browser" build via its package.json
// "browser" field. Metro already prioritizes "browser" by default; this is
// set explicitly so Joi resolves to that build regardless of Metro defaults.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
