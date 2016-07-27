'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findExecutable = findExecutable;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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