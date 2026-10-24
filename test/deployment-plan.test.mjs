import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AbiCoder, Interface, ZeroHash, id, keccak256 } from 'ethers';
import { BASE_USDC, sourceLock, validateConfig, loadArtifacts, verifyArtifact, buildDeploymentPlan } from '../scripts/deployment-plan-lib.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const marketRoot = path.join(root, '.deployment-source');
const hasArtifacts = existsSync(path.join(marketRoot, sourceLock.contracts.campaign.artifact));
const integration = { skip: !hasArtifacts && 'Compile the pinned checkout into .deployment-source; CI runs these real-artifact checks in the deployment-plan job' };
const fixture = () => ({
  schemaVersion: 1, reviewed: true, chainId: 8453, token: BASE_USDC,
  router: '0x1111111111111111111111111111111111111111',
  djuke: '0x2222222222222222222222222222222222222222',
  admin: '0x3333333333333333333333333333333333333333',
  scheduler: '0x4444444444444444444444444444444444444444',
  fulfiller: '0x5555555555555555555555555555555555555555',
  funds: { playback: 'synthetic-playback', topTen: 'synthetic-top10', pinners: 'synthetic-pinners', repo: 'synthetic-repo' },
  serviceUrl: 'https://worker.fixture.example', workerQueueSigner: 'scheduler',
});
const campaignConfirmation = () => ({
  address: '0x6666666666666666666666666666666666666666',
  transactionHash: `0x${'a'.repeat(64)}`, blockNumber: 123, reviewed: true,
});
const queueConfirmation = () => ({
  address: '0x7777777777777777777777777777777777777777',
  transactionHash: `0x${'b'.repeat(64)}`, blockNumber: 124, reviewed: true,
});

test('independent plan config refuses unreviewed examples, secrets, non-Base token and ambiguous roles/funds', () => {
  assert.throws(() => validateConfig(JSON.parse(readFileSync(new URL('../examples/deployment.operator.json', import.meta.url))), 'campaign'), /reviewed/);
  const bad = [
    c => { c.reviewed = false; },
    c => { c.schemaVersion = 2; },
    c => { c.chainId = '8453'; },
    c => { c.chainId = 1; },
    c => { c.privateKey = 'never accepted'; },
    c => { c.admin = 'decentagency.eth'; },
    c => { c.router = null; },
    c => { c.token = c.router; },
    c => { c.scheduler = c.admin; },
    c => { c.fulfiller = c.scheduler; },
    c => { c.djuke = c.router; },
    c => { c.admin = `0x${'0'.repeat(40)}`; },
    c => { c.token = '0x833589fcd6edb6e08f4c7c32d4f71b54bda0291A'; },
    c => { c.funds.topTen = c.funds.playback; },
    c => { delete c.funds.repo; },
    c => { c.funds.repo = ZeroHash; },
    c => { c.funds.unused = 'unknown'; },
    c => { c.serviceUrl = 'http://worker.fixture.example'; },
    c => { c.serviceUrl = 'https://user:password@worker.fixture.example'; },
    c => { c.serviceUrl = 'https://worker.fixture.example/?key=secret'; },
    c => { c.serviceUrl = 'https://worker.fixture.example/path'; },
    c => { c.workerQueueSigner = 'automatic'; },
  ];
  for (const mutate of bad) { const config = fixture(); mutate(config); assert.throws(() => validateConfig(config, 'campaign'), String(mutate)); }
  assert.throws(() => validateConfig(fixture(), 'broadcast'), /Stage/);
  assert.deepEqual(validateConfig(fixture(), 'campaign').fundIds,
    ['synthetic-playback', 'synthetic-top10', 'synthetic-pinners', 'synthetic-repo'].map(id));
});

test('queue/setup require explicit confirmed campaign and queue records; duplicate deployment plans fail closed', () => {
  assert.throws(() => validateConfig(fixture(), 'queue'), /confirmed deployed campaign/);
  assert.throws(() => validateConfig({ ...fixture(), confirmedCampaign: campaignConfirmation() }, 'setup'), /confirmed deployed queue/);
  const config = { ...fixture(), confirmedCampaign: campaignConfirmation() };
  for (const mutate of [
    c => { c.confirmedCampaign.reviewed = false; },
    c => { c.confirmedCampaign.transactionHash = null; },
    c => { c.confirmedCampaign.transactionHash = `0x${'0'.repeat(64)}`; },
    c => { c.confirmedCampaign.predicted = true; },
    c => { c.confirmedCampaign.blockNumber = 0; },
    c => { c.confirmedCampaign.blockNumber = 1.2; },
    c => { c.confirmedCampaign.address = c.router; },
  ]) {
    const next = structuredClone(config); mutate(next);
    assert.throws(() => validateConfig(next, 'queue'));
  }
  assert.throws(() => validateConfig(config, 'campaign'), /already recorded/);
  config.confirmedQueue = queueConfirmation();
  assert.throws(() => validateConfig(config, 'queue'), /already recorded/);
  assert.ok(validateConfig(config, 'setup'));
  for (const mutate of [
    c => { c.confirmedQueue.address = c.confirmedCampaign.address; },
    c => { c.confirmedQueue.blockNumber = 122; },
    c => { c.confirmedQueue.transactionHash = c.confirmedCampaign.transactionHash; },
  ]) {
    const next = structuredClone(config); mutate(next);
    assert.throws(() => validateConfig(next, 'setup'));
  }
});

test('actual pinned artifacts encode exact 9/9 constructor arguments, create-only initcode and ordered funds', integration, async () => {
  const artifacts = loadArtifacts(marketRoot);
  for (const stage of ['campaign', 'queue']) {
    const input = fixture();
    if (stage === 'queue') input.confirmedCampaign = campaignConfirmation();
    const plan = await buildDeploymentPlan(input, { stage, marketRoot });
    const artifact = artifacts[stage];
    const ctor = new Interface(artifact.abi).deploy;
    const expected = stage === 'campaign'
      ? [input.token, input.router, input.djuke, ...validateConfig(input, stage).fundIds, input.admin, input.scheduler]
      : [input.token, input.confirmedCampaign.address, input.router, ...validateConfig(input, stage).fundIds, input.admin, input.fulfiller];
    assert.equal(ctor.inputs.length, 9);
    assert.deepEqual(plan.deployment.constructorTypes, ctor.inputs.map(item => item.type));
    assert.deepEqual(plan.deployment.constructorArguments, expected);
    const tx = plan.transactions[0];
    assert.deepEqual(Object.keys(tx).sort(), ['chainId', 'data', 'purpose', 'value']);
    assert.equal(tx.chainId, 8453);
    assert.equal(tx.value, '0');
    assert.equal(tx.to, undefined);
    const encoded = AbiCoder.defaultAbiCoder().encode(ctor.inputs, expected);
    assert.equal(tx.data, artifact.bytecode + encoded.slice(2));
    assert.equal(plan.deployment.encodedConstructorArguments, encoded);
    assert.equal(plan.deployment.initcodeKeccak256, keccak256(tx.data));
    assert.deepEqual([...AbiCoder.defaultAbiCoder().decode(ctor.inputs, encoded)], expected);
    assert.equal(plan.constructorRoles.campaign.startsPaused, true);
    assert.equal(plan.constructorRoles.queue.startsPaused, false);
    assert.equal(plan.roleIds.DEFAULT_ADMIN_ROLE, ZeroHash);
    assert.equal(plan.workerConfig.public.DEVERT_QUEUE_PAYMENTS_ENABLED, 'false');
    assert.match(plan.operatorReview, /operator assertions/);
    assert.equal(plan.source.commit, sourceLock.commit);
  }
});

test('setup encodes queue pause and explicit non-revoking worker grant, never activation', integration, async () => {
  const input = { ...fixture(), confirmedCampaign: campaignConfirmation(), confirmedQueue: queueConfirmation() };
  const plan = await buildDeploymentPlan(input, { stage: 'setup', marketRoot });
  const abi = new Interface(loadArtifacts(marketRoot).queue.abi);
  assert.equal(plan.transactions.length, 2);
  const pause = abi.parseTransaction(plan.transactions[0]);
  assert.equal(pause.name, 'setPaused');
  assert.equal(pause.args[0], true);
  const grant = abi.parseTransaction(plan.transactions[1]);
  assert.equal(grant.name, 'grantRole');
  assert.deepEqual([...grant.args], [id('FULFILLER_ROLE'), input.scheduler]);
  for (const tx of plan.transactions) {
    assert.equal(tx.requiredSender, input.admin);
    assert.equal(tx.to, input.confirmedQueue.address);
    assert.equal(tx.value, '0');
    assert.equal(tx.chainId, 8453);
  }
  assert.equal(plan.workerConfig.queueConstructorFulfiller, input.fulfiller);
  assert.equal(plan.workerConfig.queueRuntimeWallet, input.scheduler);
  assert.equal(plan.widgetConfig.campaignAddress, input.confirmedCampaign.address);
  input.workerQueueSigner = 'fulfiller';
  const separate = await buildDeploymentPlan(input, { stage: 'setup', marketRoot });
  assert.equal(separate.transactions.length, 1);
  assert.equal(separate.workerConfig.queueRuntimeWallet, input.fulfiller);
  assert.match(separate.warnings.join('\n'), /separate queue-signer runtime adapter/);
});

test('artifact verifier refuses swapped ABI/bytecode, linking, compiler settings and source tampering', integration, () => {
  for (const stage of ['campaign', 'queue']) {
    const file = path.join(marketRoot, sourceLock.contracts[stage].artifact);
    const artifact = JSON.parse(readFileSync(file));
    const dbg = JSON.parse(readFileSync(file.replace(/\.json$/, '.dbg.json')));
    const build = JSON.parse(readFileSync(path.resolve(path.dirname(file), dbg.buildInfo)));
    for (const mutate of [
      (a, b) => { a.contractName = 'UnreviewedContract'; },
      (a, b) => { a.sourceName = 'contracts/elsewhere.sol'; },
      (a, b) => { a.abi = []; },
      (a, b) => { a.bytecode += '00'; },
      (a, b) => { a.deployedBytecode += '00'; },
      (a, b) => { a.linkReferences = { malicious: {} }; },
      (a, b) => { b.solcLongVersion = '0.8.27'; },
      (a, b) => { b.input.settings.optimizer.runs = 1; },
      (a, b) => { b.input.settings.viaIR = true; },
      (a, b) => { b.input.sources[a.sourceName].content += '\n// unreviewed change'; },
      (a, b) => { b.output.contracts[a.sourceName][a.contractName].evm.bytecode.object += '00'; },
      (a, b) => { b.output.contracts[a.sourceName][a.contractName].metadata = '{}'; },
    ]) {
      const a = structuredClone(artifact), b = structuredClone(build); mutate(a, b);
      assert.throws(() => verifyArtifact(a, b, stage));
    }
  }
});

test('CLI is key-free, refuses unsafe flags/placeholder config and will never overwrite an output', integration, () => {
  const directory = path.join(root, '.deployment-plans', `cli-test-${process.pid}`);
  mkdirSync(directory, { recursive: true });
  try {
    const config = path.join(directory, 'synthetic-config.json');
    const output = path.join(directory, 'unsigned.json');
    writeFileSync(config, JSON.stringify(fixture()), { flag: 'wx' });
    const args = ['scripts/deployment-plan.mjs', '--stage', 'campaign', '--config', config, '--market', marketRoot, '--out', output];
    // Deliberately invalid key-like environment values prove the planner does not parse them.
    const env = { ...process.env, PRIVATE_KEY: 'invalid-do-not-use', MINT_OWNER_PRIVATE_KEY: 'invalid-do-not-use' };
    execFileSync(process.execPath, args, { cwd: root, env, stdio: 'pipe' });
    const plan = JSON.parse(readFileSync(output));
    assert.equal(plan.status, 'unsigned-not-broadcast');
    assert.equal(JSON.stringify(plan).includes('invalid-do-not-use'), false);
    const duplicate = spawnSync(process.execPath, args, { cwd: root, env, encoding: 'utf8' });
    assert.equal(duplicate.status, 1);
    assert.match(duplicate.stderr, /EEXIST/);
    for (const flags of [
      ['--broadcast', 'yes'],
      ['--stage', 'campaign', '--stage', 'queue'],
      ['--stage'],
      ['--config', 'examples/deployment.operator.json', '--stage', 'campaign', '--market', marketRoot],
    ]) {
      assert.equal(spawnSync(process.execPath, ['scripts/deployment-plan.mjs', ...flags], { cwd: root, encoding: 'utf8' }).status, 1);
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});
