import * as esbuild from 'esbuild';

type BuildTarget = 'frontend' | 'backend';

const getBuildOptions = (target: BuildTarget): esbuild.BuildOptions => {
  const commonOptions: esbuild.BuildOptions = {
    entryPoints: [`./src/${target}/index.ts`],
    bundle: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('development'),
    },
    packages: target === 'backend' ? 'external' : undefined,
  };

  return commonOptions;
}

async function build(target: BuildTarget): Promise<void> {
  const options = getBuildOptions(target);
  
  await Promise.all([
    esbuild.build({
      ...options,
      outdir: `./dist/${target}`,
      format: 'cjs',
    }),
    esbuild.build({
      ...options,
      outdir: `./cjs/${target}`,
      format: 'cjs',
      outExtension: { '.js': '.cjs' },
    }),
    esbuild.build({
      ...options,
      outdir: `./esm/${target}`,
      format: 'esm',
      outExtension: { '.js': '.mjs' },
    })
  ]);
}

Promise.all([
  build('backend'),
  build('frontend'),
]).catch(console.error);
