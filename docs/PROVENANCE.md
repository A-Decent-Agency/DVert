# Source and artwork provenance

The product freezes DecentBusking commit
`701b931d3f197b0addcfba192d2be5d25ff5dfb4` from
<https://github.com/TheJollyLaMa/DecentBusking>.
The source branch and extraction PR are published; no merge/tag/release is implied.

Immutable source archive:
<https://github.com/TheJollyLaMa/DecentBusking/archive/701b931d3f197b0addcfba192d2be5d25ff5dfb4.tar.gz>.
This is an upstream archive URL, not a claim that an IPFS source archive was pinned.
`source-lock.json` records exact SHA-256 hashes/byte lengths for all copied inputs
and generated panel/style outputs. `npm run verify` checks the stored closure;
`npm run vendor -- PATH EXACT_SHA` reproduces it from that Git object.

## Exact dependency closure

Byte-for-byte JS modules under `vendor/busking/js/`:

1. `devert-tab.mjs`
2. `devert-radio-adapter.mjs`
3. `ipfs-upload.js`
4. `ipfs-gateway.js`
5. `mint-submission.js`
6. `base-chain.mjs`
7. `devert-scheduler.mjs`
8. `devert-payment.mjs`
9. `payment-celebration.mjs`
10. `usdc-format.mjs`
11. `devert-campaigns.mjs`
12. `devert-paid-queue.mjs`
13. `devert-queue.mjs`
14. `usdc-abi.mjs`
15. `devert-history.mjs`

`payment-celebration.mjs` is an optional lazy upstream dependency retained for
source fidelity. The widget always passes a scoped confirmation handler; it
does not load that module or install global celebration DOM/styles.
`ipfs-upload.js` remains reachable through the unchanged upstream controller
and is available to an explicit host binary adapter. The widget itself will
not invoke its default transport, infer a transport from session state or
fall back to DecentHead JSON upload.

Other frozen inputs: `LICENSE`, `NOTICE`, `LICENSES/CC-BY-4.0.txt`,
`index.html`, `css/styles.css`. The HTML/CSS are generation inputs, not copied
full-site pages. `panel.mjs` extracts the DVert tab/panel/instructions; `styles.mjs`
extracts DVert-related selectors/media/keyframes, then scopes them in Shadow DOM.
No full-site iframe, radio-sync, DJuke, worker service, artist recording, private
configuration or third-party runtime bundle is included.

External runtime boundaries:

- Existing DecentHead 2.0.0 session API, referenced at immutable
  `072a5206489d0e4a3f2576c56f8debb729d933c9`; not vendored or recreated.
- Host-provided local ethers v6 `Contract`/`JsonRpcSigner`; no CDN.
- Existing configured Busking worker, Base contracts, public gateway and wallet
  provider. Their compatibility/CORS/availability remain deployment prerequisites.
- Optional binary-media capability explicitly supplied by the host.
- JSDOM is a **test-only** dependency; its exact transitive lock is package-lock.json.

## Draft artwork

`art/dvert-v0.1.0-draft-front.png` is an actual screenshot of this product's
dedicated localhost demo, taken 2026-10-24. It shows the real worker's public
queue snapshot (0 pending; 1.00/2.00 USDC quotes; no active approved adverts).
The demo had no host wallet session. No wallet action, vote, upload or payment
was performed. Public runtime snapshots are not durable financial evidence.

`art/dvert-v0.1.0-draft-back.svg` is original provenance-card artwork for this
unreleased development draft, attributed to The Jolly LaMa / A Decent Agency.
Neither asset has been pinned; neither supplies a token URI or proves minting.
No artist media is incorporated. Original non-code screenshot/card/documentation:
CC BY 4.0. Source code: Apache-2.0. Preserve upstream NOTICE and attribution.
