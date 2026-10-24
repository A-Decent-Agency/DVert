# Validation scope — 2026-10-24

## Native tests

- Product: `npm test` → **14/14 passing**, using native `node --test`.
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

Integrated-browser trusted pointer/keyboard automation was not verified:
pointer actionability checks timed out despite a visible/hit-testable button,
so those checks used native DOM dispatch/programmatic clicks, not claimed
physical input success. Native DOM tests separately cover dialog keyboard
behavior. This is a validation limitation, not permission to perform wallet
writes to “prove” functionality.

No production service was restarted/deployed and no state-mutating backend
or blockchain request was authorized. The temporary local smoke server is
stopped after verification.
