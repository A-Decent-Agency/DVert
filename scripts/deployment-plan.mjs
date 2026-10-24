import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildDeploymentPlan } from './deployment-plan-lib.mjs';

try {
  const options = {};
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    if (!['--stage', '--config', '--market', '--out'].includes(key) || options[key] || !args[index + 1] || args[index + 1].startsWith('--')) {
      throw new Error('Usage: npm run deployment:plan -- --stage campaign|queue|setup --config FILE --market CHECKOUT [--out NEW_FILE]');
    }
    options[key] = args[index + 1];
  }
  if (!options['--config'] || !options['--market'] || !options['--stage']) throw new Error('Explicit --stage, --config and --market are required');
  const input = JSON.parse(readFileSync(options['--config'], 'utf8'));
  const plan = await buildDeploymentPlan(input, { stage: options['--stage'], marketRoot: options['--market'] });
  const encoded = `${JSON.stringify(plan, null, 2)}\n`;
  if (options['--out']) {
    const output = path.resolve(options['--out']);
    const parent = realpathSync(path.dirname(output));
    const root = realpathSync(process.cwd());
    if (!output.startsWith(`${root}${path.sep}`) || (parent !== root && !parent.startsWith(`${root}${path.sep}`))) {
      throw new Error('--out must be within the current project directory, without a parent symlink escape');
    }
    writeFileSync(output, encoded, { flag: 'wx', mode: 0o600 });
    console.log(`Unsigned ${options['--stage']} plan written; no wallet or RPC used. Existing files are never overwritten.`);
  } else {
    console.log(encoded.trimEnd());
  }
} catch (error) {
  console.error(`Deployment plan refused: ${error.message}`);
  process.exitCode = 1;
}
