#!/usr/bin/env node
'use strict';

var _package = require('../package');

var _package2 = _interopRequireDefault(_package);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _crossSpawn = require('cross-spawn');

var _crossSpawn2 = _interopRequireDefault(_crossSpawn);

var _child_process = require('child_process');

var _foreverMonitor = require('forever-monitor');

var _foreverMonitor2 = _interopRequireDefault(_foreverMonitor);

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var executableLocations = [_path2.default.resolve(__dirname, '../node_modules/.bin/'), _path2.default.resolve(__dirname, '../../.bin/')];

var mocha = function mocha() {
  return (0, _helpers.findExecutable)(executableLocations, 'mocha');
};

var babel = function babel() {
  return (0, _helpers.findExecutable)(executableLocations, 'babel');
};

var babelCli = function babelCli() {
  return (0, _helpers.findExecutable)(executableLocations, 'babel-node');
};

var eslint = function eslint() {
  return (0, _helpers.findExecutable)(executableLocations, 'eslint');
};

var mongo = function mongo() {
  return (0, _helpers.findExecutable)(executableLocations, 'mongodb-runner');
};

var babelTestRequire = _path2.default.resolve(__dirname, '../config/babel-test-require.js');
var setupTests = _path2.default.resolve(__dirname, '../config/test-setup.js');

_commander2.default.version(_package2.default.version);

_commander2.default.command('test <path>').action(function (testPath, options) {
  (0, _crossSpawn2.default)(mocha(), [setupTests, testPath, '--require', babelTestRequire], { stdio: 'inherit' });
});

_commander2.default.command('test-react-native <test_require> <test_scripts>').action(function (test_require, test_scripts, options) {
  (0, _crossSpawn2.default)(mocha(), [setupTests, test_scripts, '--require', test_require], { stdio: 'inherit' });
});

_commander2.default.command('run <script_path> [otherArgs...]').option('-d, --node_dev', 'Sets NODE_ENV to development').option('-f, --forever', 'Run script forever and ever').option('-w, --watch <watch>', 'Watch directory and reload on change (only works with --forever)').option('-d, --debug', 'Run script in debug mode').option('-t, --test_run', 'Runs script in a test run mode and curls localhost:8000 after launching it').option('-m, --with_mongo', 'Also starts a local version of MongoDB before running the script').action(function (script_path, otherArgs, options) {
  var environment = {};

  if (options.node_dev) {
    environment.NODE_ENV = 'development';
  }

  if (!options.forever) {
    // normal mode
    (0, _crossSpawn2.default)(babelCli(), [script_path, '--presets', 'es2015'].concat(_toConsumableArray(otherArgs)), { stdio: 'inherit', env: Object.assign({}, process.env, environment) });
    return;
  }

  // forever mode
  var opts = {
    max: 3,
    command: babelCli(),
    args: ['--presets', 'es2015', '--plugins', 'transform-object-rest-spread'],
    env: environment
  };

  if (options.watch) {
    console.log('watching');
    opts.watch = true;
    opts.watchDirectory = options.watch;
  }

  if (options.debug) {
    console.log('debugging');
    opts.args.push('--debug');
  }

  var monitor = new _foreverMonitor2.default.Monitor(script_path, opts);

  monitor.on('start', function onMonitorStarted() {
    if (options.test_run) {
      console.log('testing server...');
      setTimeout(function onAfterServerStared() {
        (0, _crossSpawn2.default)('curl', ['localhost:8000'], { stdio: 'inherit' });
        monitor.stop();
      }, 30000);
    }
  });

  monitor.on('stderr', function onServerScriptError(error) {
    console.error(error.toString());
  });

  monitor.start();
});

_commander2.default.command('build <input_directory> <output_directory>').action(function (input_directory, output_directory, options) {
  (0, _helpers.transpileJS)(input_directory, output_directory);
});

_commander2.default.command('push_to_heroku <directory>').option('-s, --settings <settings>', 'Path to json file(s) with settings', function (val) {
  return val.split(',');
}).action(function (directory, options) {
  var serverGitRemote = 'heroku';
  var settings = void 0;

  if (options.settings) {
    try {
      settings = Object.assign.apply(this, options.settings.map(function (s) {
        return require(_path2.default.resolve(s));
      }));
    } catch (e) {
      console.log('Cannot load settings module from modules ' + _path2.default.resolve(options.settings));
      process.exit(1);
    }

    console.log('Deploying with settings:', JSON.stringify(settings, null, ' '));
  }

  try {
    (0, _crossSpawn2.default)('git', ['ls-remote', serverGitRemote]);
  } catch (e) {
    // eslint-disable-next-line max-len
    console.log(serverGitRemote + ' git remote is not set. Try: git remote add ' + serverGitRemote + ' <heroku_app_git_url>');
    process.exit(1);
  }

  if (settings) {
    (0, _crossSpawn2.default)('heroku', ['config:set', 'APPLICATION_SETTINGS=' + JSON.stringify(settings)], { stdio: 'inherit' });
  }

  (0, _child_process.execSync)('git push ' + serverGitRemote + ' `git subtree split --prefix ' + directory + '`:master --force', {
    stdio: 'inherit'
  });
});

_commander2.default.command('lint <directory> [otherDirectories...]').action(function (directory, otherDirectories) {
  (0, _crossSpawn2.default)(eslint(), [directory].concat(_toConsumableArray(otherDirectories)), { stdio: 'inherit' });
});

_commander2.default.command('mongo').action(function () {
  (0, _crossSpawn2.default)(mongo(), ['start', '--name=dev', '--purge', 'false'], { stdio: 'inherit' });
});
_commander2.default.parse(process.argv);