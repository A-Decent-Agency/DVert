# Validation scope — 2026-10-24

## Native tests

- Product: `npm test` → **20/20 passing**, using native `node --test`.
- Freeze: `npm run verify` → every copied source and generated panel/style
  hash matches `source-lock.json` at upstream
  `701b931d3f197b0addcfba192d2be5d25ff5dfb4`.
- Upstream extraction: `node --test test/devert-*.test.js` → **97/97 passing**.
- `git diff --check` and editor diagnostics passed for the changed controllers
  and product modules.

Mounted JSDOM tests exercise actual controller initialization and events, not
only source regexes:

- Financially inert mount, connected/shared session, no signer/connect/switch/
  sign/upload at mount; delayed header readiness and exactly one unsubscribe.
- Delayed host ethers load, repeated mount/destroy, disabled duplicate mount,
  request cancellation, listener/timer cleanup and detached-button inactivity.
- Stale host chain snapshot fails closed instead of allowing the inherited Base
  helper to switch an unrelated globally injected wallet.
- Explicit user gesture + public consent + real host binary capability boundary;
  missing capability errors, never passing a File to the JSON backup API.
- Destroy during pending media upload and during retry delay prevents later
  submission/signature; original submission authorization builder is reused.
- Actual inherited campaign helper through the mounted form: duplicate-term
  refusal, exact 5 USDC/week and scheduler ETH top-up.
- Both inherited paid-queue tiers through mounted buttons, exact quote limits,
  confirmed-receipt notifications and playback-availability gate.
- Original refund helper through mounted recovery: successful synthetic receipt
  and refusal for different payer, settled request or unremoved campaign.
- Scoped DOM/styles/theme, native labels/dialog, Escape handler and reduced
  motion; supporter draft terms and deliberately null release facts.
- GET-only deployment preflight: chain/address/queue-version/snapshot guards,
  malformed/unavailable endpoint refusal and disabled-playback gating.
- Explicit worker binary adapter: original signed submission-upload route,
  actual File multipart bytes to the returned URL (synthetic fetch/signature
  fixture only), cancellation, and refusal to infer a local/JSON transport.
- Both immutable DecentHead caller pins, default-off announcement guard and
  actual root widget entrypoint matching the preserved `widget.html` alias.

These tests use synthetic contracts/signatures/receipts only. They do not send
on-chain transactions or attest to current production write authorization.

## Dedicated browser smoke

A separate browser page at `http://127.0.0.1:8792/widget.html` read the existing
`https://decentbusking.onrender.com` public worker on 2026-10-24. It displayed
queue 0, next-break quote 1.00 USDC and after-song quote 2.00 USDC, with no active
approved adverts. This is a time-specific read-only observation, not absence of
financial capability, a fabricated advert catalog or write-flow acceptance.

No wallet was connected and no payment, refund, vote, signature or upload
was performed. The front artwork is a real screenshot of this dedicated demo.
Programmatic browser DOM-handler checks confirmed destroy/remount and actual
instruction-dialog opening. At a 390×844 viewport, content width was 350px,
no horizontal page overflow, reduced-motion media preference was active, and
paid checkout remained disabled without the host wallet.

### Trusted-input follow-up: previous pointer gap resolved

A **fresh dedicated page**, opened with `forceNew: true` at
`http://127.0.0.1:8794/widget.html?release-check=20261024-dvert`, resolved the
stale integrated-tab actionability problem. Standard browser locator pointer
clicks succeeded for instructions, advert search, Price Model disclosure,
destroy and remount. Actual keyboard Escape closed the native dialog.
Search input changed to `nonexistent smoke advert` and showed `0 matching adverts`.
Price Model expanded to its real table. Destroy exposed the slot; remount
restored exactly one widget. This follow-up used **no DOM dispatch or
programmatic `.click()`** to substitute for user actions.

An event audit on the page recorded **13 trusted events** (`isTrusted: true`):
instruction/search/disclosure/destroy/remount/theme pointer events, search
input and keyboard events. Theme select was interacted with, but its value
remained gold, so no theme-change success is claimed from that browser action.
At **390×844**, native locator click reopened instructions and keyboard Escape
closed it. Widget width was **350px**, document scroll width **390px** (no
horizontal page overflow), reduced-motion preference was active, and both paid
buttons remained disabled without a wallet. Network audit recorded **zero
non-GET/HEAD/OPTIONS requests**. No wallet provider was installed or connected;
there were no signatures, uploads, votes or transactions.

The earlier stale tab still timed out on some locator stability checks. A
bounding-box `page.mouse.click` did produce a trusted instruction click there,
but the successful fresh-page checks above use normal locator actions and are
the evidence closing the original gap. This is UI acceptance only, not real
campaign/paid-play/upload or independent worker acceptance.

After adding `index.html` and restarting the loopback server, GET `/` matched
the exact index file bytes, and navigating that root displayed the actual
widget. A normal locator pointer click opened its native instructions dialog.
This separately checks the entrypoint used by the pinned product renderer.

## Read-only hosted-service preflight

`npm run preflight` on 2026-10-24 returned `ok: true`, no errors,
`campaignReady: true`, `priorityReady: true` for the existing default worker.
These are time-specific worker snapshots, not a promise of continuous playback
or verification of bytecode, roles, signed POST access or new-origin approval.
During browser polling, the real worker also briefly reported waiting for a
durable checkpoint/settlement and disabled checkout; availability is dynamic.
Agency Pages/ENS signed submission/removal acceptance remains **unverified**.
Exact routes and origin requirements are documented in [ONBOARDING](ONBOARDING.md).

## Release preparation boundary

Both release callers use DecentHead
`3b2a72f7f8c49fb2af89ea7df2ead8e338e0e870` for `uses` and `head_ref`.
No caller was dispatched. `PINATA_JWT` provisioning is coordinated separately;
no secret value was read/copied. Announcements default off, primary-sale
routing remains unconfirmed, and the Agency NFT admin grant remains unsigned,
not a current-role claim. Draft royalty resolution evidence is attributed to
the parent coordinator's Ethereum block 26262074 verification.

No production service was restarted/deployed and no state-mutating backend
or blockchain request was authorized. The temporary local smoke server is
stopped after verification.
