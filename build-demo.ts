import * as esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['./demo/index.ts'],
  outfile: './demo/dist/index.js',
  format: 'iife',
  target: 'chrome58',
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  bundle: true,
});
