import { readFile } from 'node:fs/promises';
import { preflight } from '../preflight.js';

try {
  const options = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8')) : {};
  const report = await preflight(options);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
