import * as esbuild from 'esbuild';

async function build(): Promise<void> {
  await esbuild.build({
    entryPoints: ['./demo/index.ts'],
    outfile: './demo/dist/index.js',
    format: 'iife',
    target: 'chrome58',
    define: {
      'process.env.NODE_ENV': JSON.stringify('development'),
    },
    bundle: true,
  });
}

build().catch(console.error);
