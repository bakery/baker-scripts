var babel = require("babel-core");

import path from 'path';
import fs from 'fs';
import glob from 'glob';
import mkdirp from 'mkdirp';

function rmdir(dir) {
  try {
    fs.statSync(dir);
  } catch (e) {
    return;
  }

  var list = fs.readdirSync(dir);
  
  list.forEach(item => {
    var filename = path.join(dir, item);
    var stat = fs.statSync(filename);

    if (filename === '.' || filename === '..') {
      // pass these files
    } else if (stat.isDirectory()) {
      // rmdir recursively
      rmdir(filename);
    } else {
      // rm fiilename
      fs.unlinkSync(filename);
    }
  });
};

export function findExecutable(paths, name){
  const locations = paths.map(p => path.resolve(p, name));
  const location = locations.find(function(p) {
    try {
      fs.accessSync(p);
      return true;
    } catch(e) {
      return false;
    }
  });

  if (!location) {
    throw new Error(`Cannot find ${name}. Looked here: ${locations.join(', ')}`);
  }

  return location;
};

export function transpileJS(source, target) {
  var sourceDirectory = path.resolve(source);
  var targetDirectory = path.resolve(target);
  var files = glob.sync(path.resolve(sourceDirectory, '**/*.js'));

  // remove target dir + all subdirs
  rmdir(targetDirectory);

  // recreate target dir
  mkdirp.sync(targetDirectory);

  files.forEach(function (file) {
    var code = babel.transformFileSync(file, {
      presets: ['babel-preset-es2015','babel-preset-react','babel-preset-stage-0'].map(require.resolve),
    }).code;
    var targetFile = path.join(targetDirectory, file.split(sourceDirectory)[1]);
    var targetFileDir = path.dirname(targetFile);

    try {
      fs.statSync(targetFileDir);
    } catch (e) {
      mkdirp.sync(targetFileDir);
    }

    fs.writeFileSync(
      path.join(targetDirectory, file.split(sourceDirectory)[1]),
      code
    );
  });
};
