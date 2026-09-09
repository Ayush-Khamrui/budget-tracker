import { cp, mkdir, readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
const html = await readFile('index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
for (const [, script] of scripts) new Script(script);
new Script(await readFile('sw.js', 'utf8'));
JSON.parse(await readFile('manifest.webmanifest', 'utf8'));
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'sw.js', 'manifest.webmanifest', 'icons']) {
  await cp(file, `dist/${file}`, { recursive: true });
}
console.log('Static app validated and built in dist/');
