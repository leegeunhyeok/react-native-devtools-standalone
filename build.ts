import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['./src/index.ts'],
  outfile: './dist/index.js',
  format: 'iife',
  bundle: true,
});
