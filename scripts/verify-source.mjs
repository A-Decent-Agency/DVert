import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(readFileSync(path.join(root, 'source-lock.json')));
const digest = file => createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex');
for (const [name, record] of Object.entries(lock.files)) {
  if (record.generatedInput) continue;
  if (digest(`vendor/busking/${name}`) !== record.sha256) throw new Error(`Frozen source changed: ${name}`);
}
for (const [name, hash] of Object.entries(lock.generated)) {
  if (digest(name) !== hash) throw new Error(`Generated source changed: ${name}`);
}
console.log(`Verified frozen DVert closure: ${lock.commit}`);
