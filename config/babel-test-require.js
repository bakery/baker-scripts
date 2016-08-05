var path = require('path');

// XX: patch for npm 2
// baker-scripts will have all the deps installed within
// local node_modules directory so we need to provide the
// outside app with a way to see through it
require('app-module-path').addPath(
  path.resolve(__dirname, '../node_modules')
);

require('babel-register')({
  presets: ['babel-preset-es2015'].map(require.resolve),
});