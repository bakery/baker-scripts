import path from 'path';
import fs from 'fs';

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