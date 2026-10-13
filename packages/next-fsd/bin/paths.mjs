import { readFile, realpath, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import validatePackageName from 'validate-npm-package-name';

async function canonicalPath(location) {
  const suffix = [];
  let parent = path.resolve(location);
  while (true) {
    try {
      return path.join(await realpath(parent), ...suffix.reverse());
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      suffix.push(path.basename(parent));
      const next = path.dirname(parent);
      if (next === parent) {
        throw error;
      }
      parent = next;
    }
  }
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

export async function validateProjectPaths(cwd, projectName, sourceDir) {
  const targetDir = path.resolve(cwd, projectName);
  const [target, current, userHome] = await Promise.all([
    canonicalPath(targetDir),
    canonicalPath(cwd),
    canonicalPath(os.homedir()),
  ]);
  if (contains(target, current) || contains(target, userHome) || target === path.parse(target).root) {
    throw new Error('Refusing to use the current directory, home directory, filesystem root, or their parents as the project target.');
  }
  if (sourceDir) {
    const source = await canonicalPath(sourceDir);
    if (!(await stat(source)).isDirectory()) {
      throw new Error('The local template must be a directory.');
    }
    if (contains(source, target) || contains(target, source)) {
      throw new Error('The project target and local template must be separate directories; neither can contain the other.');
    }
    try {
      const metadata = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        throw new Error('Expected a package object.');
      }
    } catch (error) {
      throw new Error('The local template must contain a valid package.json.', { cause: error });
    }
  }
  const packageName = path.basename(targetDir);
  const validation = validatePackageName(packageName);
  if (!validation.validForNewPackages) {
    throw new Error(`Invalid project name "${packageName}": ${[...(validation.errors || []), ...(validation.warnings || [])].join(' ')}`);
  }
  return { targetDir, packageName };
}
