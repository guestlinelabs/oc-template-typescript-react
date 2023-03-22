import vite from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs/promises'
import EnvironmentPlugin from 'vite-plugin-environment'

const clientName = 'clientBundle';

async function main() {
  const result = await vite.build({
    root: './guest-balance-activator/src',
    mode: 'production',
    plugins: [react(), EnvironmentPlugin(['NODE_ENV'])],
    logLevel: 'silent',
    build: {
      lib: { entry: 'simpleapp.tsx', formats: ['iife'], name: clientName },
      write: false,
      minify: true,
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM'
          }
        }
      }
    }
  });
  const val = Array.isArray(result) ? result[0] : result;
  const out: vite.Rollup.RollupOutput = val as any;
  const wat: vite.Rollup.RollupWatcher = val as any;
  
  const clientCode = out.output[0].code;
  const iife = 
`(function() {
  ${clientCode}

  window.oc = window.oc || {};
  window.oc.components = window.oc.components || {};
  window.oc.components['asd'] = ${clientName};
})()`;

  await fs.writeFile('./code.js', iife, 'utf-8');
}

main().catch(console.error);

