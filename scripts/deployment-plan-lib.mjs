import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { AbiCoder, ContractFactory, Interface, ZeroHash, getAddress, id, keccak256 } from 'ethers';

export const sourceLock = JSON.parse(readFileSync(new URL('../deployment-source-lock.json', import.meta.url)));
export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const hash = value => createHash('sha256').update(value).digest('hex');
const json = file => JSON.parse(readFileSync(file, 'utf8'));
const fail = message => { throw new Error(message); };
const requireValue = (condition, message) => { if (!condition) fail(message); };
const fundKeys = ['playback', 'topTen', 'pinners', 'repo'];

function fields(value, allowed, label) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  for (const key of Object.keys(value)) requireValue(allowed.includes(key), `Unknown ${label} field: ${key}`);
}

function address(value, label) {
  let normalized;
  try { normalized = getAddress(value); } catch { fail(`${label} requires a checksummed or lowercase address, not ENS/placeholders`); }
  requireValue(!/^0x0{40}$/i.test(normalized), `${label} must not be zero`);
  return normalized;
}

function confirmation(value, label) {
  fields(value, ['address', 'transactionHash', 'blockNumber', 'reviewed'], label);
  requireValue(value.reviewed === true, `${label} must be explicitly reviewed after receipt/chain checks`);
  requireValue(/^0x[0-9a-f]{64}$/i.test(value.transactionHash || '') && !/^0x0{64}$/i.test(value.transactionHash), `${label} requires a real deployment transaction hash`);
  requireValue(Number.isSafeInteger(value.blockNumber) && value.blockNumber > 0, `${label} requires a positive deployment block`);
  return { ...value, address: address(value.address, `${label}.address`) };
}

export function validateConfig(input, stage) {
  requireValue(['campaign', 'queue', 'setup'].includes(stage), 'Stage must be campaign, queue or setup');
  fields(input, ['schemaVersion', 'reviewed', 'chainId', 'token', 'router', 'djuke', 'admin',
    'scheduler', 'fulfiller', 'funds', 'serviceUrl', 'workerQueueSigner', 'confirmedCampaign', 'confirmedQueue'], 'config');
  requireValue(input.schemaVersion === 1 && input.reviewed === true, 'schemaVersion 1 and explicit reviewed:true are required');
  requireValue(input.chainId === 8453, 'Only native Base mainnet chainId 8453 is supported');
  const config = { ...input };
  for (const name of ['token', 'router', 'djuke', 'admin', 'scheduler', 'fulfiller']) config[name] = address(input[name], name);
  requireValue(config.token === BASE_USDC, 'Only native Base USDC is supported');
  requireValue(new Set(['token', 'router', 'djuke', 'admin', 'scheduler', 'fulfiller'].map(key => config[key].toLowerCase())).size === 6,
    'Token/router/DJuke and admin/scheduler/fulfiller must all be distinct');
  fields(input.funds, fundKeys, 'funds');
  config.fundIds = fundKeys.map(key => {
    const slug = input.funds[key];
    requireValue(typeof slug === 'string' && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug) && !slug.startsWith('0x') && slug.length <= 80,
      `funds.${key} requires an operator-reviewed router fund slug`);
    return id(slug);
  });
  requireValue(new Set(config.fundIds).size === 4, 'Router fund slugs/IDs must be distinct');
  let service;
  try { service = new URL(input.serviceUrl); } catch { fail('Set a public HTTPS serviceUrl'); }
  requireValue(service.protocol === 'https:' && !service.username && !service.password && !service.search && !service.hash &&
    service.pathname === '/' && !['localhost', '127.0.0.1', '[::1]'].includes(service.hostname),
  'serviceUrl must be a public HTTPS origin without credentials, path, query or fragment');
  config.serviceUrl = service.origin;
  requireValue(['scheduler', 'fulfiller'].includes(input.workerQueueSigner), 'workerQueueSigner must explicitly select scheduler or fulfiller');
  if (input.confirmedCampaign !== undefined) config.confirmedCampaign = confirmation(input.confirmedCampaign, 'confirmedCampaign');
  if (input.confirmedQueue !== undefined) config.confirmedQueue = confirmation(input.confirmedQueue, 'confirmedQueue');
  if (stage === 'campaign') requireValue(!config.confirmedCampaign && !config.confirmedQueue, 'Campaign already recorded; refuse another campaign deployment');
  if (stage !== 'campaign') requireValue(config.confirmedCampaign, 'Queue/setup requires a confirmed deployed campaign; predicted addresses are not accepted');
  if (stage === 'queue') requireValue(!config.confirmedQueue, 'Queue already recorded; refuse another queue deployment');
  if (stage === 'setup') requireValue(config.confirmedQueue, 'Setup requires a confirmed deployed queue');
  const usedAddresses = [config.token, config.router, config.djuke, config.admin, config.scheduler, config.fulfiller];
  for (const key of ['confirmedCampaign', 'confirmedQueue']) {
    if (!config[key]) continue;
    requireValue(!usedAddresses.some(value => value === config[key].address), `${key} duplicates another deployment/config address`);
    usedAddresses.push(config[key].address);
  }
  if (config.confirmedQueue) {
    requireValue(config.confirmedCampaign, 'Queue confirmation requires campaign confirmation');
    requireValue(config.confirmedCampaign.transactionHash.toLowerCase() !== config.confirmedQueue.transactionHash.toLowerCase(),
      'Campaign and queue need different deployment transactions');
    requireValue(config.confirmedQueue.blockNumber >= config.confirmedCampaign.blockNumber, 'Queue must not predate its campaign');
  }
  return config;
}

function inside(root, file) {
  const resolved = realpathSync(path.resolve(root, file));
  requireValue(resolved.startsWith(`${realpathSync(root)}${path.sep}`), 'Artifact/source path escapes the reviewed checkout');
  return resolved;
}

export function verifyArtifact(artifact, build, stage) {
  const expected = sourceLock.contracts[stage];
  requireValue(expected, 'Unknown artifact stage');
  requireValue(artifact._format === 'hh-sol-artifact-1' && artifact.contractName === expected.contractName &&
    artifact.sourceName === expected.sourceName, 'Unexpected artifact contract/source identity');
  requireValue(build.solcLongVersion === sourceLock.solcLongVersion &&
    isDeepStrictEqual(build.input?.settings, sourceLock.settings), 'Compiler version/settings differ from the reviewed build');
  requireValue(build.input.language === 'Solidity', 'Unexpected compiler input language');
  for (const [key, digest] of Object.entries({ abi: expected.abiSha256, bytecode: expected.bytecodeSha256,
    deployedBytecode: expected.deployedBytecodeSha256 })) {
    requireValue(hash(key === 'abi' ? JSON.stringify(artifact[key]) : artifact[key] || '') === digest, `Pinned ${key} mismatch`);
  }
  requireValue(isDeepStrictEqual(artifact.linkReferences, {}) && isDeepStrictEqual(artifact.deployedLinkReferences, {}),
    'Linked library placeholders are not supported');
  const compiled = build.output?.contracts?.[expected.sourceName]?.[expected.contractName];
  requireValue(compiled && isDeepStrictEqual(compiled.abi, artifact.abi) &&
    `0x${compiled.evm?.bytecode?.object}` === artifact.bytecode &&
    `0x${compiled.evm?.deployedBytecode?.object}` === artifact.deployedBytecode, 'Artifact differs from build-info output');
  const metadata = JSON.parse(compiled.metadata);
  requireValue(metadata.compiler?.version === sourceLock.solcLongVersion, 'Metadata compiler mismatch');
  const sources = Object.keys(metadata.sources);
  const expectedSources = Object.keys(sourceLock.sources).filter(name => name.startsWith('@') || name === expected.sourceName ||
    (stage === 'queue' && name === 'contracts/DeVertQueue_v0.1.sol'));
  requireValue(isDeepStrictEqual(sources.sort(), expectedSources.sort()), 'Unexpected transitive contract source closure');
  for (const name of sources) {
    const content = build.input.sources?.[name]?.content;
    requireValue(typeof content === 'string' && hash(content) === sourceLock.sources[name], `Build source mismatch: ${name}`);
    requireValue(keccak256(Buffer.from(content)) === metadata.sources[name].keccak256, `Metadata source mismatch: ${name}`);
  }
  return artifact;
}

export function loadArtifacts(marketRoot) {
  const root = realpathSync(marketRoot);
  const commit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  requireValue(commit === sourceLock.commit, 'DecentMarket checkout must be at the exact deployment source-lock commit');
  for (const [name, digest] of Object.entries({ ...sourceLock.files, ...sourceLock.sources })) {
    const file = name.startsWith('@') ? `node_modules/${name}` : name;
    requireValue(hash(readFileSync(inside(root, file))) === digest, `Reviewed checkout file mismatch: ${name}`);
  }
  return Object.fromEntries(Object.entries(sourceLock.contracts).map(([stage, record]) => {
    const file = inside(root, record.artifact);
    const dbg = json(file.replace(/\.json$/, '.dbg.json'));
    requireValue(dbg._format === 'hh-sol-dbg-1' && typeof dbg.buildInfo === 'string', 'Missing Hardhat build-info reference');
    const buildPath = path.relative(root, path.resolve(path.dirname(file), dbg.buildInfo));
    const resolved = inside(root, buildPath);
    requireValue(resolved.startsWith(`${root}/artifacts/build-info/`), 'Unexpected build-info location');
    return [stage, verifyArtifact(json(file), json(resolved), stage)];
  }));
}

export async function buildDeploymentPlan(input, { stage, marketRoot }) {
  const config = validateConfig(input, stage);
  const artifacts = loadArtifacts(marketRoot);
  const args = {
    campaign: [config.token, config.router, config.djuke, ...config.fundIds, config.admin, config.scheduler],
    queue: [config.token, config.confirmedCampaign?.address, config.router, ...config.fundIds, config.admin, config.fulfiller],
  };
  const plan = {
    schemaVersion: 1, status: 'unsigned-not-broadcast', stage, chainId: 8453,
    source: { repository: sourceLock.repository, commit: sourceLock.commit, solcLongVersion: sourceLock.solcLongVersion },
    operatorReview: 'reviewed:true and receipt fields are operator assertions, not independent RPC verification',
    transactions: [],
    constructorRoles: {
      campaign: { DEFAULT_ADMIN_ROLE: config.admin, SCHEDULER_ROLE: config.scheduler, startsPaused: true },
      queue: { DEFAULT_ADMIN_ROLE: config.admin, FULFILLER_ROLE: config.fulfiller, startsPaused: false },
    },
    prerequisites: [
      'Independently verify Base 8453; token/router/DJuke have code, USDC decimals=6, router unpaused, asset approved and all four exact fund IDs active.',
      'Verify DJuke compatibility with the reviewed campaign interface and your NFT/catalog/radio configuration.',
      'Wallet deployment has no to field; wallet supplies deployer, nonce, gas and fees. Do not send initcode to a normal contract.',
      'Verify successful confirmed receipts, actual deployed addresses/constructor arguments/roles before filling confirmations; no predicted campaign is accepted.',
      'Campaign starts paused; queue starts UNPAUSED. Keep campaign paused and worker payments off; after queue receipt execute reviewed setup pause before activation.',
    ],
    fundIds: Object.fromEntries(fundKeys.map((key, index) => [key, { slug: config.funds[key], id: config.fundIds[index] }])),
    warnings: ['No RPC, key, signer, wallet connection, signature, estimation, broadcast or deployment occurs in this CLI.',
      'Wallet signatures/actions remain paused. The JSON is a review artifact, not authority to transact.'],
  };
  if (stage !== 'setup') {
    const artifact = artifacts[stage];
    const factory = new ContractFactory(artifact.abi, artifact.bytecode);
    const request = await factory.getDeployTransaction(...args[stage]);
    const constructorTypes = factory.interface.deploy.inputs.map(input => input.type);
    plan.deployment = {
      contractName: artifact.contractName, sourceName: artifact.sourceName,
      constructorTypes, constructorArguments: args[stage],
      encodedConstructorArguments: AbiCoder.defaultAbiCoder().encode(constructorTypes, args[stage]),
      creationBytecodeSha256: sourceLock.contracts[stage].bytecodeSha256,
      initcodeKeccak256: keccak256(request.data),
      immutableReferences: 'Runtime bytecode includes constructor immutables; verify via build-info/verified compiler, not a naive runtime hash equality.',
    };
    plan.transactions.push({ purpose: `Deploy ${artifact.contractName}`, chainId: 8453, value: '0', data: request.data });
  } else {
    const queue = new Interface(artifacts.queue.abi);
    plan.transactions.push({ purpose: 'Pause new queue for staging', requiredSender: config.admin, chainId: 8453,
      to: config.confirmedQueue.address, value: '0', data: queue.encodeFunctionData('setPaused', [true]) });
    if (config.workerQueueSigner === 'scheduler') {
      plan.transactions.push({ purpose: 'Explicitly authorize the existing shared scheduler to fulfill the queue; retains the dedicated fulfiller',
        requiredSender: config.admin, chainId: 8453, to: config.confirmedQueue.address, value: '0',
        data: queue.encodeFunctionData('grantRole', [id('FULFILLER_ROLE'), config.scheduler]) });
      plan.warnings.push('This reviewed grant also gives the scheduler queue approval/removal/fulfillment powers; it does not revoke the original fulfiller or any admin.');
    } else {
      plan.warnings.push('The frozen Busking worker uses one DEVERT_SCHEDULER_PRIVATE_KEY for campaign and queue. A separate queue-signer runtime adapter is required for workerQueueSigner=fulfiller; no invented env variable is supplied.');
    }
  }
  plan.roleIds = { DEFAULT_ADMIN_ROLE: ZeroHash, SCHEDULER_ROLE: id('SCHEDULER_ROLE'), FULFILLER_ROLE: id('FULFILLER_ROLE') };
  plan.confirmations = { campaign: config.confirmedCampaign || null, queue: config.confirmedQueue || null };
  plan.activation = 'No unpause transaction is generated. Only separately authorized, verified playback/mirror/settlement/refund acceptance may activate campaign+queue and worker payments.';
  plan.workerConfig = {
    public: { PUBLIC_WORKER_URL: config.serviceUrl, DEVERT_CONTRACT_ADDRESS: config.confirmedCampaign?.address || null,
      DEVERT_QUEUE_CONTRACT_ADDRESS: config.confirmedQueue?.address || null, DEVERT_QUEUE_VERSION: '2',
      DEVERT_QUEUE_PAYMENTS_ENABLED: 'false', DEVERT_CONFIRMATIONS: '2' },
    schedulerWallet: config.scheduler,
    queueConstructorFulfiller: config.fulfiller,
    queueRuntimeWallet: config.workerQueueSigner === 'scheduler' ? config.scheduler : config.fulfiller,
    privateProvisioning: 'Operator provisions the dedicated runtime key, Pinata and mirror secrets separately, never in this file. No key value is read or generated.',
  };
  plan.widgetConfig = { serviceUrl: config.serviceUrl, campaignAddress: config.confirmedCampaign?.address || null,
    queueAddress: config.confirmedQueue?.address || null };
  return plan;
}
