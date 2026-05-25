import fs from 'fs';
import path from 'path';
import { rimrafSync } from 'rimraf';
import webpackPaths from '../configs/webpack.paths.js';

export default function deleteSourceMaps() {
  try {
    if (fs.existsSync(webpackPaths.distMainPath))
      rimrafSync(path.join(webpackPaths.distMainPath, '*.js.map'), {
        glob: true,
      });
    if (fs.existsSync(webpackPaths.distRendererPath))
      rimrafSync(path.join(webpackPaths.distRendererPath, '*.js.map'), {
        glob: true,
      });
  } catch (e) {
    // ignore permission errors
  }
}
