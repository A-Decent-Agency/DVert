# Independent Base contracts and worker: operator runbook

**Documented path, not a turnkey deployer.** DVert bundles a static widget and
frozen frontend controllers, not contracts, Hardhat or a worker. An independent
operator needs a reviewed/adapted DecentMarket contract deployment, a full
DecentBusking worker/playback/mirror installation and an approval/NFT workflow.
Changing mount options alone is insufficient. No commands in this task deploy,
sign, pin, mint, grant roles or use keys. All such operations remain paused.

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
  Inspected read-only in `_wt/market-playlist-review`; the DVert deploy scripts
  are unchanged there. Actual deployment scripts live in **DecentMarket**,
  not DecentEscrow. DecentEscrow's inspected tree contains legacy `.sol`
  sources only, no package/build/deployment workflow. Do not invent
  `npm run deploy` in Escrow.

Choose exact reviewed commits for any later operator deployment and retain
their hashes, ABI/compiler settings and licenses. These sources are not copied
into DVert and no independent deployment is attested by this document.

## 1. Establish the contract dependencies

The campaign constructor uses native Base USDC, a settlement router, a DJuke
contract, four router fund IDs, an admin and a dedicated scheduler. The queue
constructor uses USDC, the campaign source, that router, four fund IDs, an
admin and a separate fulfiller. Do not use an NFT admin/owner private key as
the live worker scheduler.

The inspected campaign script is **project-specific**, not configurable
solely by environment:

| Script | Actual constraints |
| --- | --- |
| `deploy_devert_base.js` | Named network `base`, chain 8453; hard-coded project owner, Base USDC, settlement router and DJuke v0.2; funds `dbusk-playback`, `dbusk-top10`, `dbusk-pinners`, `dbusk-repo-dev`; `DEVERT_SCHEDULER_ADDRESS` must be nonzero and separate from owner. Refuses existing `deployments/devert-v01-base.json`. Even dry-run requires an owner signer/account and balance checks. |
| `deploy_devert_queue.js` | Chain 8453; hard-coded existing campaign/router/USDC/fund slugs and known campaign #1 ABI probe; `DBUSK_ADMIN` and separate `DBUSK_FULFILLER`; `DEVERT_QUEUE_VERSION=2` for two tiers. Checks the hard-coded legacy queue's pending count and USDC reserves are zero. Refuses existing `deployments/devert-queue-v02-base.json`. |

A fresh independent operator must review/adapt these literal dependencies,
owner checks, sample campaign probe, legacy-drain policy and manifest paths
in **their own fork**. Retain duplicate-deployment protection; never delete a
real manifest merely to bypass it. Establish the chosen router, approved USDC
asset and active fund IDs first. An independent router/DJuke installation is
another deployment prerequisite, not supplied by this product. The queue
script cannot be aimed at a new campaign using an undocumented environment
variable. Reconcile the worker's project-specific `payroll-assets.json`,
NFT catalog/config and journal names with the chosen contracts and namespaces.

Actual script entry points in a reviewed DecentMarket checkout are:

```sh
npm ci
npx hardhat compile
# Inspect and adapt scripts first. Do not run these while keys/signatures are paused:
# npx hardhat run scripts/deploy_devert_base.js --network base
# npx hardhat run scripts/deploy_devert_queue.js --network base
```

Hardhat uses `BASE_RPC_URL` (default `https://mainnet.base.org`) and reads
`PRIVATE_KEY` **before** `MINT_OWNER_PRIVATE_KEY`. These are source facts, not
a request to provide keys. Both scripts dry-run unless `CONFIRM_DEPLOY` is
exactly `yes`; the campaign dry-run still accesses the configured signer,
so it was **not executed here**. The queue's dry-run does not need a signer
until broadcasting, but still performs chain reads/gas/balance checks and
refuses the already-existing manifest. `BASE_FORK_RPC` selects the Hardhat
Base-fork setup for controlled rehearsals; no fork was started here.

After separate authorization, verify constructor arguments, receipts, bytecode,
admin/worker roles and deployment blocks from actual chain reads. The campaign
script requires the new campaign to remain paused and verifies `SCHEDULER_ROLE`.
The worker requires the paid queue's `FULFILLER_ROLE` and checks that
`queue.campaigns()` equals its configured campaign. Keep checkout disabled
until full staging/playback/durable-settlement/refund acceptance passes.

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

No independent contract addresses, deployment receipts, approved test media,
worker URL, secrets, origin authorization or playback/mirror evidence have
been provided for a new operator. The project-specific contract scripts need
reviewed adaptation; Escrow offers no deploy script to fill that gap.
No independent stack was deployed or proved end-to-end here. No wallet
signature, grant, upload, mint or paid acceptance was attempted. Hosted reads
and local UI tests are separate evidence, not a fake independent deployment.
