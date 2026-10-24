# DVert

**Cloneable advertising widget · `DVert.decentagency.eth` · v0.1.0 development draft**

A plain ES-module advertising panel, extracted from the real
[DecentBusking DVert controllers](https://github.com/TheJollyLaMa/DecentBusking/pull/281).
This is not an iframe, mock checkout, replacement worker or new contract.
The product supports real campaign purchases, both paid priority tiers, availability
gates, wallet-owned adverts, removal, eligible refunds and public funding history.

**Status:** open-PR source, not a tagged release. The identity above is a confirmed
display name, not a claim that ENS records were registered or changed.
No supporter token, stock, listing, IPFS pin or release transaction is claimed.

## Clone and run

```sh
git clone https://github.com/A-Decent-Agency/DVert.git
cd DVert
# Until reviewed/merged, check out the standalone product PR branch:
git checkout feat/standalone-dvert
npm run serve
# http://127.0.0.1:8792/widget.html
```

There is no runtime package install or build step. Serve over HTTP(S), not `file:`.
The customizable demo reads the **existing real worker**. Without an existing
connected DecentHead session it is read-only; its empty/error states are genuine.
The browser smoke check did not test real payment, refund, vote or upload writes.
The product itself is not read-only: a correctly integrated host enables the
existing financial actions on explicit user gestures.

For native DOM tests only (Node 24):

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run verify
```

## Embed in an existing host

Copy this repository under a stable asset path, preserving the relative files.
Do not copy `node_modules` into a deployment. Your page retains **one existing
DecentHead 2.0.0 header and session**, not another header inside the widget.

```html
<div id="advertising"></div>
<script type="module">
  import { mount } from './dvert/widget.js';
  const widget = mount(document.getElementById('advertising'), {
    title: 'Community advertising',
    theme: { accent: '#7af0c6', maxWidth: '480px' }
  });
  // SPA teardown:
  // widget.destroy();
</script>
```

`mount(element, options = {})` returns `{refresh(), destroy()}`. `destroy()` is
idempotent, aborts widget reads/submission retries/listeners, clears timers and stops
media. It unsubscribes from the host and supports remounting the same element.
Already-broadcast transactions or already-uploaded public data cannot be undone.
Hosts must also honor the abort signal of any supplied media capability.

The widget resolves `window.DecentHead` and waits for `decenthead:ready` when needed.
It subscribes only through `head.on('wallet', callback)` and uses
`head.getWallet().snapshot()`; no connect, account request, chain switch, signer,
signature, transaction or upload occurs at mount. A connected **Base** snapshot
is required for writes. Only explicit user actions construct an ethers v6
`JsonRpcSigner` from the shared BrowserProvider and address, without calling
`BrowserProvider.getSigner()` or `eth_requestAccounts`.

See [the pinned real host API and ready-to-copy example](docs/HOST-INTEGRATION.md).
The optional `head` option exists for test injection, not a second session.
The host must supply local ethers v6 `Contract` and `JsonRpcSigner`, either through
`options.ethers` or its existing `window.ethers`. Late loading by DecentHead works.
No ethers/CDN, wallet modal, credential storage or global host config is bundled.

## Options and customization

| Option | Default / meaning |
| --- | --- |
| `serviceUrl` | `https://decentbusking.onrender.com` |
| `campaignAddress` | Base `0x135Cbc573F87637158eb3186C87c584fb0B34CD9` |
| `queueAddress` | Base two-tier v0.2 `0xe54609f022A8D760417E7cc0Eea6360b6E1D11Bb` |
| `gateway` | `https://gateway.pinata.cloud/ipfs/` |
| `title`, `label` | Panel title and accessible widget label |
| `open` | `true`; set `false` for collapsed startup |
| `theme` | `accent`, `background`, `text`, `maxWidth` |
| `ethers` | Optional existing host ethers v6 implementation |
| `uploadMedia` | Explicit host binary-media capability; absent means **no new media uploads** |
| `radio` | Optional host playback coordination adapter; see host guide |

The ShadowRoot scopes all styles, IDs and drawer events. No global resets,
host-global namespace mutation or cross-widget CSS is used. Inherited
`--dvert-accent`, `--dvert-background`, `--dvert-text` and `--dvert-max-width`
also customize the panel; explicit `theme` values take precedence. The demo
switches themes and demonstrates destroy/remount. Native labels/status regions,
dialog semantics, keyboard controls and reduced-motion styles are retained.

`dvert:payment-confirmed` is emitted on the mount element **only after** the
original helper verifies a confirmed receipt. Listen to it for a host-owned
celebration. The widget does not install Busking's global celebration UI.

## Media and financial behavior

**Never pass File/Blob/audio/video to `DecentHead.getIpfs().upload()`.** That API
serializes JSON backups, not binary adverts. New ad submissions require the
public-IPFS consent checkbox and an explicit host `uploadMedia(file, context)`
capability. The context includes the existing IPFS session, existing wallet
session, guarded signer, abort signal, service URL and submission purpose.
Unsupported/missing capabilities fail explicitly; there is no fabricated CID
or successful fallback. The host is responsible for a binary-capable transport,
provider consent, backend origin authorization and respecting cancellation.

- Campaign: **5 USDC/week**, current quote and duplicate paid-term checks,
  scheduler-gas **ETH** top-up and separate Base transaction gas.
- Queue bump: current tiered quote, starting at 1 USDC, doubling each 7 pending
  requests. After-song priority costs 2×. Neither buys/extends a campaign.
- Existing worker scheduling, approved/active advert checks, protected shows,
  playback availability and receipt reconciliation remain authoritative.
- Campaign removal is signed and **does not refund the campaign** or end its term.
- Recovery UI calls the unchanged refund helper: only the paying wallet, a
  pending request and a removed campaign can yield an eligible full refund.
  There are no expiry refunds or automatic refunds. `claimDevertRefund` is
  additionally exported for host recovery tooling.
- Settlement deposits are not final fund-beneficiary payouts. A supporter
  edition is unrelated to campaign/priority fees and promises no return.

## Self-host prerequisites

Static hosting alone does not provide a worker, media approval/minting,
playback or settlement. Reuse the configured existing services, or deliberately
configure compatible Base contracts and an authorized worker with:

- `/api/devert`, `/api/devert/queue`, `/api/devert/ads`, `/api/devert/remove`,
  `/api/devert/loop`, loop vote endpoints, `/api/funds`, and `/api/media/submit`;
- CORS and signed-message origin authorization for **your exact host origin**;
- the existing approval/catalog index, scheduler, radio/checkpoint mirror and
  settlement/worker-gas setup. A missing mirror intentionally blocks paid checkout;
- native Base USDC, correct contract roles and the existing two-tier queue version.

Backend-origin approval is a deployment prerequisite; this PR does not change
production CORS, contracts, workers, pins or environment variables.
Never put worker signing keys, Pinata credentials or RPC secrets in static code.
Use HTTPS (loopback HTTP is allowed for development). Failures are visible;
there is no mock backend, optimistic successful payment or synthetic queue fallback.

## Source, support and release gates

`source-lock.json` freezes upstream commit
**`701b931d3f197b0addcfba192d2be5d25ff5dfb4`**, exact file SHA-256 hashes and
the immutable upstream archive URL. Fifteen reachable JS modules are copied
byte-for-byte, along with licenses; only the panel and DVert-only CSS are generated
from frozen HTML/CSS inputs. See [provenance](docs/PROVENANCE.md).

To update intentionally from a reviewed source commit:

```sh
npm run vendor -- /path/to/DecentBusking EXACT_40_CHARACTER_COMMIT
npm run verify
npm test
```

Do not hand-edit `vendor/`; change upstream or the product adapter and review
the lock diff. No automatic mutable-branch fetch happens at runtime.

Support: [DVert issues](https://github.com/A-Decent-Agency/DVert/issues).
Upstream financial behavior: [Busking #246](https://github.com/TheJollyLaMa/DecentBusking/issues/246).
Report version, source SHA, origin, visible error and public transaction/request
IDs only; never submit secrets, private files or wallet recovery phrases.
`docs/RELEASE-PREPARATION.md` and `releases/v0.1.0-draft/` contain **unsigned,
unminted draft inputs**, not release evidence.

Code: Apache-2.0. Original non-code art/documentation: CC BY 4.0.
Retain [LICENSE](LICENSE), [NOTICE](NOTICE), upstream provenance and attribution:
**The Jolly LaMa / A Decent Agency**. Artist recordings/NFT media are not
redistributed here and are not licensed by this repository.
