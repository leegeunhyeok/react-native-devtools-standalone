import * as esbuild from 'esbuild';

const commonOptions: esbuild.BuildOptions = {
  entryPoints: [
    './src/frontend/index.ts',
    './src/backend/index.ts',
  ],
  bundle: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  packages: 'external',
};

Promise.all([
  esbuild.build({
    ...commonOptions,
    outdir: './dist',
    format: 'cjs',
  }),
  esbuild.build({
    ...commonOptions,
    outdir: './cjs',
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
  }),
  esbuild.build({
    ...commonOptions,
    outdir: './esm',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
  }),
]);
