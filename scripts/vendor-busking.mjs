import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [repository, requestedRef] = process.argv.slice(2);
if (!repository || !/^[a-f0-9]{40}$/.test(requestedRef || '')) {
  throw new Error('Usage: npm run vendor -- /path/to/DecentBusking EXACT_40_CHARACTER_COMMIT');
}
const read = file => execFileSync('git', ['-C', repository, 'show', `${requestedRef}:${file}`], { maxBuffer: 10 * 1024 * 1024 });
const digest = data => createHash('sha256').update(data).digest('hex');
const files = {};
const save = (destination, content) => {
  mkdirSync(path.dirname(path.join(root, destination)), { recursive: true });
  writeFileSync(path.join(root, destination), content);
};
const collect = file => {
  if (files[file]) return;
  const content = read(file);
  files[file] = { sha256: digest(content), bytes: content.length };
  save(`vendor/busking/${file}`, content);
  if (!/\.(?:mjs|js)$/.test(file)) return;
  for (const match of content.toString().matchAll(/\b(?:from\s*|import\s*\()\s*['"](\.[^'"]+)/g)) {
    const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1].split('?')[0]));
    if (dependency.startsWith('../')) throw new Error('Unexpected dependency outside repository');
    collect(dependency);
  }
};
for (const entry of ['js/devert-tab.mjs', 'js/devert-paid-queue.mjs', 'js/devert-history.mjs',
  'LICENSE', 'NOTICE', 'LICENSES/CC-BY-4.0.txt']) collect(entry);

const html = read('index.html');
const css = read('css/styles.css');
files['index.html'] = { sha256: digest(html), bytes: html.length, generatedInput: true };
files['css/styles.css'] = { sha256: digest(css), bytes: css.length, generatedInput: true };
const source = html.toString();
const start = source.indexOf('<button id="devert-tab"');
const end = source.indexOf('</dialog>', source.indexOf('<dialog id="devert-instructions"', start)) + '</dialog>'.length;
if (start < 0 || end < start) throw new Error('DVert source template markers changed; review export');
save('vendor/busking/panel.mjs', `// Generated from the frozen Busking index.html; do not hand-edit.\nexport const panel = ${JSON.stringify(source.slice(start, end))};\n`);

function extractCss(source) {
  let result = '';
  let start = 0;
  let depth = 0;
  let open = -1;
  let quote = '';
  let comment = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (comment) {
      if (source.slice(index, index + 2) === '*/') { comment = false; index++; }
      continue;
    }
    if (quote) { if (char === quote && source[index - 1] !== '\\') quote = ''; continue; }
    if (source.slice(index, index + 2) === '/*') { comment = true; index++; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '{') { if (depth++ === 0) open = index; }
    if (char === '}' && --depth === 0) {
      const header = source.slice(start, open).replace(/\/\*[\s\S]*?\*\//g, '').trim();
      const body = source.slice(open + 1, index);
      if (/^@(?:media|supports|layer)\b/.test(header)) {
        const nested = extractCss(body);
        if (nested) result += `${header} {\n${nested}}\n`;
      } else if (/devert/i.test(header)) result += `${header} {${body}}\n`;
      start = index + 1;
    }
  }
  return result;
}
save('vendor/busking/styles.mjs', `// Generated DVert-only source rules; scoped inside Shadow DOM.\nexport const styles = ${JSON.stringify(extractCss(css.toString()))};\n`);
const generated = {};
for (const [name, content] of [
  ['panel.mjs', `// Generated from the frozen Busking index.html; do not hand-edit.\nexport const panel = ${JSON.stringify(source.slice(start, end))};\n`],
  ['styles.mjs', `// Generated DVert-only source rules; scoped inside Shadow DOM.\nexport const styles = ${JSON.stringify(extractCss(css.toString()))};\n`],
]) generated[`vendor/busking/${name}`] = digest(content);
save('source-lock.json', `${JSON.stringify({
  repository: 'https://github.com/TheJollyLaMa/DecentBusking',
  commit: requestedRef,
  archiveUrl: `https://github.com/TheJollyLaMa/DecentBusking/archive/${requestedRef}.tar.gz`,
  license: 'Apache-2.0; non-code creative content CC-BY-4.0',
  files, generated,
}, null, 2)}\n`);
console.log(`Vendored ${Object.keys(files).length} frozen inputs from ${requestedRef}`);
