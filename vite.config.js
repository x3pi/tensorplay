import { defineConfig } from 'vite';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function findHtmlFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) findHtmlFiles(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        ['index.html', ...findHtmlFiles('examples')].map((f) => [
          f.replace(/[\\/]/g, '_').replace(/\.html$/, ''),
          f
        ])
      )
    }
  },
  server: {
    port: 3000,
    open: false,
    host: true
  },
  test: {
    environment: 'node',
    globals: true
  }
});
