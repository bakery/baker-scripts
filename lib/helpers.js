'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findExecutable = findExecutable;
exports.transpileJS = transpileJS;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var babel = require("babel-core");

function rmdir(dir) {
  try {
    _fs2.default.statSync(dir);
  } catch (e) {
    return;
  }

  var list = _fs2.default.readdirSync(dir);

  list.forEach(function (item) {
    var filename = _path2.default.join(dir, item);
    var stat = _fs2.default.statSync(filename);

    if (filename === '.' || filename === '..') {
      // pass these files
    } else if (stat.isDirectory()) {
      // rmdir recursively
      rmdir(filename);
    } else {
      // rm fiilename
      _fs2.default.unlinkSync(filename);
    }
  });
};

function findExecutable(paths, name) {
  var locations = paths.map(function (p) {
    return _path2.default.resolve(p, name);
  });
  var location = locations.find(function (p) {
    try {
      _fs2.default.accessSync(p);
      return true;
    } catch (e) {
      return false;
    }
  });

  if (!location) {
    throw new Error('Cannot find ' + name + '. Looked here: ' + locations.join(', '));
  }

  return location;
};

function transpileJS(source, target) {
  var sourceDirectory = _path2.default.resolve(source);
  var targetDirectory = _path2.default.resolve(target);
  var files = _glob2.default.sync(_path2.default.resolve(sourceDirectory, '**/*.js'));

  // remove target dir + all subdirs
  rmdir(targetDirectory);

  // recreate target dir
  _mkdirp2.default.sync(targetDirectory);

  files.forEach(function (file) {
    var code = babel.transformFileSync(file, {
      presets: ['babel-preset-es2015', 'babel-preset-react', 'babel-preset-stage-0'].map(require.resolve)
    }).code;
    var targetFile = _path2.default.join(targetDirectory, file.split(sourceDirectory)[1]);
    var targetFileDir = _path2.default.dirname(targetFile);

    try {
      _fs2.default.statSync(targetFileDir);
    } catch (e) {
      _mkdirp2.default.sync(targetFileDir);
    }

    _fs2.default.writeFileSync(_path2.default.join(targetDirectory, file.split(sourceDirectory)[1]), code);
  });
};