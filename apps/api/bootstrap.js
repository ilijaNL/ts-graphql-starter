// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsConfig = require('./tsconfig.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsConfigPaths = require('tsconfig-paths');

const baseUrl = './dist';

tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths
});
