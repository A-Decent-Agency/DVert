# Independent Base contracts and worker: operator runbook

**Reproducible unsigned deployment plans, not automatic deployment.** DVert
includes a key-free CLI that encodes the exact reviewed DecentMarket campaign
and queue constructors using operator-reviewed configuration. No project-owner
deployer script needs to be edited/replayed. Compile the pinned source locally,
generate plans, and later use an explicitly authorized wallet to deploy them.
The full DecentBusking worker/playback/mirror and approval/NFT infrastructure
remain operator prerequisites. Wallet actions are paused; no real deployment,
signature, pin, mint or role grant was performed for this guide.

## Verified sources, not imagined Escrow scripts

- [DecentBusking `701b931d`](https://github.com/TheJollyLaMa/DecentBusking/tree/701b931d3f197b0addcfba192d2be5d25ff5dfb4):
  `discord-bot/index.js`, `config.js`, `.env.example`, `ipfs-worker.js`,
  `checkpoint-mirror-client.js`, `devert.js`, `devert-queue.js`, `devert-playback.js`,
  `devert-removals.js`, `devert-loop.js`; `docs/DVERT-PAID-QUEUE.md`.
  This is the product's source-lock version, not a claim it is the latest worker.
- [DecentMarket `094b4acc`](https://github.com/TheJollyLaMa/DecentMarket/tree/094b4acca947437d4a3b1344ddd75441ddb18f2d):
  `hardhat.config.js`, `scripts/deploy_devert_base.js`,
  `scripts/devert_deploy_policy.js`, `scripts/deploy_devert_queue.js`,
  `contracts/DeVert_v0.1.sol`, `contracts/DeVertQueue_v0.2.sol`.
  First inspected read-only in `_wt/market-playlist-review`, then freshly cloned
  and compiled at the same exact commit inside this product's ignored
  `.deployment-source/`. Actual upstream deployment scripts live in **DecentMarket**,
  not DecentEscrow. DecentEscrow's inspected tree contains legacy `.sol`
  sources only, no package/build/deployment workflow. Do not invent
  `npm run deploy` in Escrow.

`deployment-source-lock.json` independently pins that commit, compiler
`0.8.26+commit.8a97fa7a`, optimizer 200, Cancun EVM, build settings, artifact
ABI/creation/runtime-bytecode hashes, the exact transitive contract source
closure (including OpenZeppelin), and package/lock/compiler-config hashes.
No contract bytecode or private key is bundled here. The frozen frontend
`source-lock.json`/vendor closure is separate and remains unchanged.

## 1. Establish the contract dependencies

The campaign constructor uses native Base USDC, a settlement router, a DJuke
contract, four router fund IDs, an admin and a dedicated scheduler. The queue
constructor uses USDC, the campaign source, that router, four fund IDs, an
admin and a separate fulfiller. Do not use an NFT admin/owner private key as
the live worker scheduler.

### 1a. Clone and compile the exact source without wallet configuration

From the DVert product root, on Node 24 with Git/npm available:

```sh
npm ci --ignore-scripts --no-audit --no-fund
git clone https://github.com/TheJollyLaMa/DecentMarket.git .deployment-source
git -C .deployment-source checkout --detach 094b4acca947437d4a3b1344ddd75441ddb18f2d
(
  cd .deployment-source
  npm ci --ignore-scripts --no-audit --no-fund
  env -u PRIVATE_KEY -u MINT_OWNER_PRIVATE_KEY -u BASE_FORK_RPC -u NODE_OPTIONS \
    ./node_modules/.bin/hardhat compile
)
mkdir -p .deployment-plans
cp examples/deployment.operator.json .deployment-plans/operator.json
```

Use a **fresh clone without `.env`**. Hardhat's config loads dotenv, so removing
shell keys alone is not protection if you add an environment file. Do not add
one, configure accounts, run upstream deploy scripts, or supply signing keys.
Compilation downloads dependencies/compiler as needed, but performs no chain
deployment or RPC fork. Retain upstream licenses. Both ignored directories
must stay out of releases/static deployments.

The existing `deploy_devert_base.js`/`deploy_devert_queue.js` still hard-code
the project owner/contracts, sample campaign #1 and legacy-drain/manifest
policies. They are **not** the independent deployment path. The new CLI uses
the actual ABI/bytecode instead, so it needs neither that owner key nor a
legacy campaign/sample or deletion of existing upstream manifests.

### 1b. Review public operator configuration

The example deliberately contains `null` addresses/service URL and
`reviewed:false`: **it refuses to produce a deployable plan**. Fill the copy
with independently verified public values; do not put secrets in it.

| Field | Required review |
| --- | --- |
| `schemaVersion`, `chainId`, `token` | `1`, numeric `8453`, native Base USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` only. |
| `router`, `djuke` | Actual code-bearing, ABI-compatible Base dependencies selected by this operator, not invented addresses. Router must accept USDC and the chosen funds. |
| `admin`, `scheduler`, `fulfiller` | Three distinct nonzero wallets; none may duplicate a dependency. Use checksummed or lowercase addresses, not ENS. The CLI does not assume Agency is an admin of any existing NFT. |
| `funds.playback`, `funds.topTen`, `funds.pinners`, `funds.repo` | Four distinct router fund **slugs** in exact 45/45/8/2 order, hashed using Ethereum `keccak256(UTF-8 slug)`. Example project slugs are not evidence your router registered them. |
| `serviceUrl` | Operator's planned actual public HTTPS worker **origin**, without credentials/path/query. Planning this URL does not deploy it. |
| `workerQueueSigner` | Explicitly `scheduler` (compatible with the existing one-key worker after the generated role grant), or `fulfiller` (requires a separately reviewed queue-signer runtime adapter). |
| `reviewed` | Set `true` only after reviewing all the public choices. Unknown fields, including private keys, are rejected. |

The CLI is **offline**: it validates input shapes and exact artifact/source
provenance, not current chain code/balances/receipts. `reviewed` flags and receipt
fields are **operator assertions**, never an independent chain attestation.
Independently verify contract code, native-USDC decimals 6, router unpaused,
approved USDC, all four fund IDs existing/active, and DJuke ABI compatibility
before any eventual wallet authorization. No router/fund/DJuke deployment or
guessed configuration calldata is generated by this tool.

### 1c. Generate the campaign plan

```sh
npm run deployment:plan -- --stage campaign \
  --config .deployment-plans/operator.json --market .deployment-source \
  --out .deployment-plans/campaign.unsigned.json
```

Output files are exclusive-created: existing plans are never overwritten.
Omit `--out` for JSON on stdout (use `node scripts/deployment-plan.mjs` directly
if consuming stdout without npm's log banner). There is no RPC URL, private-key,
sign, estimate, send, broadcast, `CONFIRM_DEPLOY` or automatic-deployment option.
The CLI does not read wallet environment variables or load Hardhat/dotenv.

The output contains the exact constructor types/values/ABI-encoded suffix,
creation-bytecode fingerprint, initcode keccak256, and one unsigned descriptor:
`{chainId:8453, value:"0", data:<creation bytecode + constructor encoding>}`.
**No `to` field** means contract creation. Wallet/deployer, nonce, gas and fee
fields are deliberately absent; these must be reviewed/furnished by the wallet.
This is review JSON, not a signed raw transaction, Safe batch or executable
wallet-link format.

Actual constructor order:

```text
DeVert_v0_1(
  address token, address router, address djukeAddress,
  bytes32 playbackId, bytes32 topTenId, bytes32 pinnerId, bytes32 repoId,
  address admin, address scheduler
)
```

The constructor grants `DEFAULT_ADMIN_ROLE` to the configured admin and
`SCHEDULER_ROLE` to the configured scheduler, and starts **paused**. No
additional duplicate role grant is needed; no role is granted merely by
generating this plan.

### 1d. Wallet deployment, then the queue plan (later authority only)

**While signatures are paused, stop at plan review.** After separate explicit
wallet authority, use an audited wallet/deployment UI that supports raw
contract creation on Base. Independently compare its initcode against this
plan, ensure it does not add a destination, confirm chain 8453/zero value,
and review the wallet-provided gas/fees/nonce. Some wallet send screens cannot
create contracts: do not send the initcode to your wallet or a random address
as a substitute. No private key belongs in this CLI.

After the campaign transaction succeeds, independently verify the receipt
`status=1`, chain, created address, deployment input, compiler/constructor
arguments, sufficient confirmations, role holders, and `paused()=true`. Record
the **actual receipt** in the operator config as:

```text
"confirmedCampaign": {
  "address": "<actual checksummed campaign address>",
  "transactionHash": "<actual 0x-prefixed 32-byte deployment transaction hash>",
  "blockNumber": <actual positive deployment block>,
  "reviewed": true
}
```

This is schema notation, not sample chain evidence or valid copy/paste JSON.
The queue planner rejects missing/unreviewed records, placeholder address/hash
shapes and predicted-address fields. It does not query RPC to prove the record.
Campaign planning refuses a config already recording a campaign; preserve
historical plans and receipts instead of bypassing duplicate protection.

```sh
npm run deployment:plan -- --stage queue \
  --config .deployment-plans/operator.json --market .deployment-source \
  --out .deployment-plans/queue.unsigned.json
```

Actual constructor order:

```text
DeVertQueue_v0_2(
  address token, address campaignContract, address router,
  bytes32 playbackFund, bytes32 topTenFund, bytes32 pinnerFund, bytes32 repoFund,
  address admin, address fulfiller
)
```

It uses the **confirmed** campaign, the same native USDC/router/funds and
distinct admin/fulfiller. After a later wallet deployment, independently verify
receipt/code/constructor values, `queueVersion()=2`, `paymentToken()`,
`campaigns()`, `fundRouter()`, four `*FundId()` getters, `DEFAULT_ADMIN_ROLE`
and `FULFILLER_ROLE`. Store the real receipt as `confirmedQueue` with the same
four keys as `confirmedCampaign`; it must be a different address/transaction
and not an earlier block.

**The queue constructor starts unpaused**, unlike the campaign. Keep the
campaign paused, worker payments false, and do not approve campaigns while
staging. Setup generates an explicit queue pause; there is no pretend
constructor pause flag.

### 1e. Unsigned setup and worker handoff

```sh
npm run deployment:plan -- --stage setup \
  --config .deployment-plans/operator.json --market .deployment-source \
  --out .deployment-plans/setup.unsigned.json
```

This requires both confirmed records and encodes these ABI-verified calls
**to the confirmed queue**, with `requiredSender` equal to its configured admin:

1. `setPaused(true)` to hold staged checkout.
2. If `workerQueueSigner="scheduler"`, `grantRole(keccak256("FULFILLER_ROLE"),
   scheduler)` so the existing worker's one scheduler signer can also fulfill
   the queue. This is an **explicit additional privilege** (queue approval,
   removal and settlement), not automatic inference. The distinct constructor
   fulfiller retains its role; no admin/fulfiller is revoked.

If `workerQueueSigner="fulfiller"`, no bridging grant is generated. The source
worker uses **one** `DEVERT_SCHEDULER_PRIVATE_KEY` for both contracts: an
operator must supply a separately reviewed queue-signer runtime adapter for
that mode. Do not invent a `DEVERT_QUEUE_PRIVATE_KEY` environment setting.
Choosing the scheduler mode plus its explicit grant avoids that adapter
requirement without making any of the three constructor wallets identical.

After later separately authorized execution, verify `paused()=true` and
`hasRole(FULFILLER_ROLE, runtimeWallet)` via actual Base reads. The plan's
`workerConfig.public` maps **actual confirmed** campaign/queue addresses to
`DEVERT_CONTRACT_ADDRESS`, `DEVERT_QUEUE_CONTRACT_ADDRESS`, version `2`,
confirmations `2` and payments `false`. Its `widgetConfig` similarly supplies
the three public mount/preflight fields. Null addresses in earlier-stage
plans are deliberately not deployable widget/worker configuration.

The output never includes an activation/unpause call. Keep both contracts
paused and payments off until separately authorized full playback, durable
checkpoint/settlement, restart/no-replay and removal/refund acceptance.
Activation is then a separate admin/operations review; do not treat a
constructor test or signed receipt as proof playback is ready.

## 2. Install the actual full worker, not an invented DVert service

The existing worker is the Node ESM **Discord/radio application** under
DecentBusking `discord-bot/`, with native audio dependencies and FFmpeg.
Review its README/lockfile/runtime requirements; its package declares Node
`>=18`, but operators must select a runtime satisfying the installed dependency
engines and the used Web APIs (the product tests use Node 24).

Real commands, for the operator's later deployment:

```sh
# From the full reviewed DecentBusking checkout, not from DVert:
cd discord-bot
npm ci
# Configure the ignored .env from .env.example through your private secret store.
# npm start                 # runs node index.js; can start worker writes
# npm run checkpoint-mirror -- --watch # separate trusted loopback-Kubo machine
```

Do not run `npm start` as a supposedly harmless preflight: an authorized
scheduler can settle/write to contracts. `PORT` defaults to `10000`; put TLS
and your service origin in front of it. There is no supplied one-command
isolated DVert-only worker/container in this product.

| Environment/config | Required operational meaning |
| --- | --- |
| `DISCORD_TOKEN`, `JUKEBOX_CHANNEL_ID` | Main Discord application and media/radio catalog intake; use operator-owned IDs and server permissions. |
| `IPFS_UPLOAD_PROVIDER=pinata`, `PINATA_JWT` | Existing paid-journal/removal/approval persistence requires Pinata; JWT stays server-side. A header's JSON backup transport is not a substitute. |
| `PINATA_API_URL`, `PINATA_SIGN_URL`, `PINATA_FILES_API_URL` | Existing `.env.example` endpoints default to Pinata v3 files/sign/files APIs. |
| `PUBLIC_WORKER_URL`, `IPFS_ALLOWED_ORIGINS` | Actual TLS worker origin and exact allowed browser origins; update them deliberately, not by wildcard inference. |
| `MINT_OWNER_WALLET` | Existing worker/NFT owner authorization address. Agency ENS is **not** currently an NFT admin; a planned non-revoking role grant is not an executed grant. Do not substitute identities blindly. |
| `BASE_RPC_URL`, `BASE_LOGS_RPC_URL`, `BASE_PUBLIC_RPC_URLS` | Existing worker RPC routing overrides; paid endpoints/keys remain private. See actual config and RPC docs for routing, budget and log limits. |
| `DEVERT_CONTRACT_ADDRESS`, `DEVERT_CONFIRMATIONS=2` | Verified independent campaign address and confirmation depth. |
| `DEVERT_SCHEDULER_PRIVATE_KEY` | Dedicated low-balance role wallet; existing fallback is `DJUKE_FULFILLER_PRIVATE_KEY`. No keys are used/provisioned in this task. |
| `DEVERT_QUEUE_CONTRACT_ADDRESS`, `DEVERT_QUEUE_VERSION=2` | Verified v0.2 independent queue address; `.env.example` defaults to legacy `1`, which is not two-tier checkout. |
| `DEVERT_QUEUE_PAYMENTS_ENABLED=false` | Keep false until playback/restart/durable-journal acceptance; a true env flag alone does not make checkout ready. |
| `CHECKPOINT_MIRROR_SECRET` | Same dedicated random non-wallet secret on worker and a live trusted mirror client; client requires at least 32 bytes and loopback Kubo (`IPFS_API_URL`). |
| `DVERT_LOOP_DISCORD_TOKEN`, `VERT_LOOP_CHANNEL_ID`, `VERTLOOP_VOICE_CHANNEL_ID` | Separate ad-only Discord bot/channels for VertLoop; main-radio paid priority still depends on a real active main JukeLoop session. |

Keep unneeded DJuke/playlist payment flags off. Review **all** actual `.env.example`
radio/voice/catalog settings, rather than treating this table as a complete
worker config. The main JukeLoop session, Discord permissions, selected
voice/text channels, valid approved media and private owner-review/NFT flow
must be functioning; a static widget cannot create them.

The mirror command without `--watch` polls only once; use `-- --watch` for its
five-second continuous loop. It reads `PUBLIC_WORKER_URL`, `CHECKPOINT_MIRROR_SECRET` and
`IPFS_API_URL` from its environment. It is a separate durable local-pin
participant, not simply a second Node process on ephemeral cloud disk.
Paid readiness requires configured reader/scheduler/mirror/Pinata/removal
state, the correct queue role/link, an available mirror and an actual active
radio playback session. Verify restarts do not replay settled requests.

## 3. Wire the independently verified deployment to the widget

Use your actual values, not the existing service defaults:

```js
import { mount } from './dvert/widget.js';
import { createWorkerBinaryUpload } from './dvert/binary-upload.js';
import { preflight } from './dvert/preflight.js';

// deployment is your reviewed public config: serviceUrl, campaignAddress, queueAddress.
const report = await preflight(deployment);
if (!report.ok) throw new Error(report.errors.join('; '));
const widget = mount(document.getElementById('advertising'), {
  ...deployment,
  // Optional only after explicit upload authorization:
  uploadMedia: createWorkerBinaryUpload()
});
```

This code only prepares UI; mount does not sign. The optional binary adapter
will ask for a message signature if a user later submits. The GET preflight
does not verify bytecode, roles, origin authorization, NFT stock or funds.
Use the hosted onboarding checklist with **your** actual service and record
evidence. Do not enable/announce purchasing from a successful snapshot alone.

## Release blockers to record, not conceal

The old project-specific deploy-script blocker is replaced by a verified,
reproducible offline constructor/setup-plan path; no edits to those deploy
scripts are required. The planner does not provision a router/DJuke or run
an operator's service. No independent production addresses/receipts, approved
media, actual worker URL, origin authorization or playback/mirror evidence
were supplied or invented here. No real wallet signature, grant, upload,
mint or paid acceptance occurred. Local simulated constructor/behavior tests
and exact encoded-shape tests are separate evidence, not a fake independent
production deployment.
