import vite from 'vite'
import fs from 'fs/promises'
import {readFileSync} from 'fs'

const pkg = JSON.parse(readFileSync('./guest-balance-activator/package.json', 'utf-8'));
const externals = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];

const mode = 'production';

async function main() {
  const result = await vite.build({
    root: './guest-balance-activator/src',
    mode,
    logLevel: 'silent',
    build: {
      lib: { entry: 'server.ts', formats: ['cjs'] },
      write: false,
      minify: mode === 'production',
      rollupOptions: {
        external: externals,
        plugins: []
      }
    }
  });
  const val = Array.isArray(result) ? result[0] : result;
  const out: vite.Rollup.RollupOutput = val as any;
  
  const serverCode = out.output[0].code;

  await fs.writeFile('./servercode.js', serverCode, 'utf-8');
}

main().catch(console.error);

