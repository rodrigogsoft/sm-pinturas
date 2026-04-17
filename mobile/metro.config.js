const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {resolve} = require('metro-resolver');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Ignorar módulos Node.js que não existem em React Native
    blacklistRE: /node_modules\/(.*)\/(.*\/)node_modules\/(.*)/,
    // Ensure RN/browser builds are preferred over node builds (e.g., axios)
    resolverMainFields: ['react-native', 'browser', 'main'],
    // Force axios to the browser build to avoid node-only deps like crypto
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'axios') {
        return {
          type: 'sourceFile',
          filePath: path.join(__dirname, 'node_modules', 'axios', 'dist', 'browser', 'axios.cjs'),
        };
      }

      return resolve(context, moduleName, platform);
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
