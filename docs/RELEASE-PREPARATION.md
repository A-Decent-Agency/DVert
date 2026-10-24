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
token/listing addresses and IDs are unset. Approved royalty recipient
`decentagency.eth` resolved to `0xcAeEd8422fB5682C298B7F0971906d446fFd4e7a`
in the parent coordinator's latest read-only Ethereum block **26262247**
resolution and parent-name-owner verification.
The draft metadata now records that recipient, not a fabricated contract address.
Recheck resolution before any eventual signature. The royalty field is a signal,
not a guaranteed payment. **Primary-sales routing is unconfirmed**; the existing
escrow retains proceeds, and royalty intent does not reroute primary sales.
The user also explicitly chose that same Agency wallet as the **initial
recipient of all 1,000 editions**. Draft inputs/evidence now record the intended
address/quantity, not a null placeholder. `onchainConfigured`/
`onchainVerified` remain false: no mint, transfer, royalty setup or role grant
has executed. Refresh ENS resolution, parent/name control and Base role state
before any eventual signature. The kit's protocol creator identity remains
unchanged; the initial-recipient intent is not a protocol CREATOR override.
No investment, financial return or buyer purchase is represented.

The user approved both hosted-service embeds and documented independent
deployments, with publication only after verification and **wallet signatures
still paused**. At the parent coordinator's Base block **53025207** check, the
Agency wallet was **not** a current NFT admin. The requested plan is to add it
as another `DEFAULT_ADMIN_ROLE` holder without revoking the personal admin;
the parent prepares that verified unsigned grant plan. No grant is executed
or implied here, and the product does not duplicate a transaction plan.

`metadata.draft.json` is not a deployable/pinned token URI. `image`,
`animation_url`, mint/listing data and release date remain null. The front is an
actual-product read-only screenshot; the back is a versioned provenance SVG.
`presentation.html` references those local files. None has been pinned.

## Pinned product release pipeline (not executed)

The two `.github/workflows/supporter-*.yml` callers use the real DecentHead
[product kit](https://github.com/TheJollyLaMa/DecentHead/blob/3b2a72f7f8c49fb2af89ea7df2ead8e338e0e870/docs/SUPPORTER-PRODUCTS.md).
Both `uses` and `head_ref` are pinned to
`3b2a72f7f8c49fb2af89ea7df2ead8e338e0e870`. The product root `index.html`
renders the actual widget; `widget.html` remains its tested equivalent alias.
The kit screenshots the tagged root site rather than our old draft artwork.

After a **verified** source release, the preparation caller runs on a published
release or explicit tag dispatch. It needs the repository `PINATA_JWT` secret,
renders the product, pins the source/site/art/metadata, attaches
`supporter-release.json`, and opens the mint checklist. It submits no chain
transactions but **does publish/pin**, so it has not been dispatched here.
Parent coordination handles credentials and release authority; no secret
value is copied. Missing configured credentials remain a release blocker.

Set `SUPPORTER_ENS_NAME=dvert.decentagency.eth` only after the steward's name
control is verified. The scheduled/release/manual announce caller stays
**disabled unless `SUPPORTER_DISCORD_ENABLED` is exactly `true`**. Keep it off
until a separately authorized announcement is ready. Later it requires
`DISCORD_SUPPORTER_WEBHOOK`, verified mint/listing evidence and (when configured)
ENS content pointing at the pinned exact-version site. No workflow execution,
Discord post, ENS edit or verified release manifest is claimed by adding callers.

The kit's mint issue requires the actual royalty receiver to be chosen by the
steward; carry the approved Agency royalty address from our release inputs into
that separately signed plan. Do not infer changed primary-sales routing or an
already-granted Agency admin role from generated metadata or the issue.

## Remaining gates (later explicit authority required)

- Review source PRs and their required tests before a steward-authorized merge.
  This product task does not merge; the source lock remains the original exact
  extraction even when an integration commit later incorporates that source.
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
