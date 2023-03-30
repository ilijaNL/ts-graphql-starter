const tsConfig = require('./tsconfig.json');
const tsConfigPaths = require('tsconfig-paths');
const path = require('node:path');

const baseUrl = path.join(__dirname, 'dist');

tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths
});
