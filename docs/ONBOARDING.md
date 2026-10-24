# Hosted-service onboarding

This mode reuses the existing DecentBusking worker, approval catalog, Base
campaign/queue contracts and playback service. It does **not** give each embed
an independent campaign market, schedule, treasury or backend. Independent
operators must use [the deployment boundary/runbook](INDEPENDENT-DEPLOYMENT.md).
Both distribution modes are approved; publication still requires verification.
This guide performs no deployment, signatures, uploads or transactions.

## 1. Serve a reviewed static snapshot

Follow the README clone instructions and freeze the product commit you reviewed.
`npm run serve` serves loopback for development only. Deploy static modules,
`widget-styles.js`, `media-submission.js`, optional `binary-upload.js`/`preflight.js`,
and the complete `vendor/busking` closure at one stable relative asset path.
Preserve LICENSE/NOTICE/LICENSES and source-lock.json. Do not deploy node_modules,
Git state, environment files, credentials or signing keys. This is a source
snapshot until a real verified release tag/archive exists; do not invent one.

Mount using the README example. The defaults are the **existing shared service**:

| Input | Value |
| --- | --- |
| Worker | `https://decentbusking.onrender.com` |
| Base campaign | `0x135Cbc573F87637158eb3186C87c584fb0B34CD9` |
| Base v0.2 queue | `0xe54609f022A8D760417E7cc0Eea6360b6E1D11Bb` |
| Chain | Base mainnet, `8453` |

If any override is used, supply all three together and verify their association.
Changing the worker URL alone does not create an independent deployment.

## 2. Verify public reads first

```sh
npm run verify
npm test
npm run preflight
# For a separately configured service, use a public, non-secret JSON file:
# npm run preflight -- ./deployment.public.json
```

The optional JSON has `serviceUrl`, `campaignAddress` and `queueAddress` keys.
The preflight issues **GET only** to `/api/devert` and `/api/devert/queue`;
chain/address mismatch, legacy queue, malformed snapshots and service errors
fail closed. `ok` means those snapshot checks passed, **not** independent chain
verification. `priorityReady` also requires unpaused campaign/queue,
`paymentsEnabled` and `playbackReady`; it may legitimately change during
checkpoint/settlement or Discord outages. It is not upload/CORS or paid-play
acceptance. No wallet/provider is needed for this check.

## 3. Reuse the host header, not another wallet

Install the real pinned DecentHead release per [HOST-INTEGRATION](HOST-INTEGRATION.md)
if this is a new host. Existing hosts keep one header, wallet session, IPFS
session and ethers v6 implementation. The widget waits for header readiness.
It never connects or switches a wallet at mount. A disconnected reader can
inspect instructions, prices, history, availability and campaign catalog.
Financial actions require the host's Base session and explicit later gestures.
Keep signatures paused during this onboarding/review.

## 4. Opt into binary submissions deliberately

The default embed has **no binary upload capability**. Do not hand a File to
DecentHead's JSON backup API. After operator approval, use the tested
`createWorkerBinaryUpload()` example in HOST-INTEGRATION. That adapter supports
the host's selected **Pinata worker only**, not local Kubo or automatic failover.
The shared header needs to expose the selected session; it does not share
credentials with the widget.

The service operator must independently authorize the host's exact origin in
`IPFS_ALLOWED_ORIGINS` and verify the real submission/removal authorization
policy. An HTTPS page does not inherit authorization by copying this widget.
No service settings were changed for this task. Successful public reads or an
OPTIONS response do not prove signed POST access.

For Agency GitHub Pages, the origin is `https://a-decent-agency.github.io`
(the `/DVert/` path is not part of the origin). Also authorize the **actual
HTTPS product ENS access origin(s)** used by the host, for example
`https://dvert.decentagency.eth` when directly served, or
`https://dvert.decentagency.eth.limo` if that gateway is chosen. Do not assume
ENS contenthash changes automatically authorize an origin, or that these
example access routes are already live. The operator must verify the final
browser `location.origin` and TLS/access route.

The exact signed DVert POST acceptance routes at the configured worker are:

| Route | What later separately authorized acceptance must check |
| --- | --- |
| `/api/ipfs/submission-upload-url` | Host origin + Base wallet's original artist-upload message; real binary signed URL response. The subsequent multipart POST goes to the returned Pinata URL, not the worker or Head JSON API. |
| `/api/media/submit` | Original signed submission, matching media URI/type and host origin; durable approval intake. |
| `/api/devert/remove` | Original signed campaign-removal payload; actual advertiser/admin policy and durable removal. This is a destructive operation, not a safe authorization probe. |

`/api/devert/loop/vote` is an additional user-triggered vote POST; do not use
it as a harmless read-only CORS probe. The local preflight does **not** issue
any POST, sign messages or prove any of these routes are currently approved
for Agency Pages or ENS hosts. Production signed authorization is **unverified**
in this task; Render configuration was not changed.

Later separately authorized acceptance must verify:
public-media consent → signed upload URL → real File multipart upload →
signed `/api/media/submit` → durable review/approval → minted/owned advert →
campaign purchase → actual playback/settlement and receipt reconciliation.
Use original media you may publish; IPFS copies may persist. Submission alone
does not mint an NFT, approve an advert or buy a campaign.

## 5. Integrate and review lifecycle

If the host has a player, provide the documented `radio` coordination adapter
to avoid competing playback. Destroy on SPA navigation/pagehide. Confirm
instruction dialog pointer/keyboard controls, disclosures, mobile layout,
disabled disconnected checkout and destroy/remount with your real host.
Do not claim paid-flow acceptance from the synthetic DOM tests or read-only
browser smoke. Existing campaign cost (5 USDC/week plus ETH scheduler top-up)
and paid-queue prices are unrelated to the supporter edition (10 USDC).
