# Unsigned ENS and S11 supporter release preparation

**Development draft only. Nothing in this repository authorizes signing,
minting, registering, transferring, listing, pinning or announcing.**

Product: `A-Decent-Agency/DVert`. Display identity confirmed by the steward:
`DVert.decentagency.eth`. Proposed first product version: `0.1.0`.
Creator identity: `thejollylama.eth`. Planning date: 2026-10-24; release date unset.
Tracking: [DecentBusking #246](https://github.com/TheJollyLaMa/DecentBusking/issues/246).
The issue remains open because its on-chain/release acceptance is not completed.

## ENS preparation (no signatures performed)

1. Independently read ownership, expiry, wrapper/registrar status and permissions
   for `decentagency.eth` and normalized `dvert.decentagency.eth`.
2. Decide the actual controller, resolver and target content. Display text is not
   proof of ENS availability, ownership, resolution or registration.
3. Freeze/review a product source commit and release assets first. No contenthash
   value can truthfully be filled until the chosen content is actually published.
4. Prepare unsigned transaction inputs only after those decisions and read-only
   verification. Current registrar/resolver addresses, owner and contenthash are
   deliberately null in draft inputs; do not guess them.
5. A later separately authorized steward may sign any required registration/
   resolver/record transactions. Verify receipts and resolution afterward.

No ENS namehash, transaction hash, CID or token ID is invented here.

## S11 input draft

`releases/v0.1.0-draft/supporter-inputs.json` records the requested **1,000 editions,
10 USDC each, Base chain 8453, 1,000 bps (10%) royalty signal**. ERC-1155 edition
token/listing addresses and IDs are unset; the royalty recipient must be
confirmed by the steward. The royalty field is a signal, not a guaranteed payment.
No investment, financial return or buyer purchase is represented.

`metadata.draft.json` is not a deployable/pinned token URI. `image`,
`animation_url`, mint/listing data and release date remain null. The front is an
actual-product read-only screenshot; the back is a versioned provenance SVG.
`presentation.html` references those local files. None has been pinned.

## Remaining gates (later explicit authority required)

- Review/merge source PRs only if the steward later authorizes it; no merge now.
- Select the exact final **product** commit, version tag and archive checksum.
  The current source lock already pins the upstream extraction, not a tagged
  product release. Do not rewrite that distinction.
- Review front/back accessibility, provenance, metadata and source-license bundle.
- Publish versioned archive/art/HTML/metadata to the chosen durable location and
  independently verify actual CIDs/checksums. No pinning has been performed here.
- Steward separately signs the required register → mint 1,000 → transfer 1,000 →
  list at 10 native Base USDC flow on the approved supporter contracts.
- Independently verify receipts, edition/token identity, owner stock, listing
  price, currency, active state and purchase route before claiming availability.
- Fill a real per-version `supporter-evidence.json` only with verified facts.
  The supplied draft records null facts and `unminted-unreleased` status.
- Only under separate authority: adopt notifier, verify exactly one actual Discord
  post, then update Canopy/Market/passport/Project/Planning Office references.
  No announcement or production restart is part of this task.

Do not put provider credentials or signing keys in these inputs. No worker
may sign or move funds on behalf of the steward.
