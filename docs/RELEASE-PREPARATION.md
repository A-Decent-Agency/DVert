# DVert ENS and supporter release preparation

The [v0.1.0 release](https://github.com/A-Decent-Agency/DVert/releases/tag/v0.1.0)
is published with frozen source, runnable site, artwork, presentation and metadata
assets. Preparation passed; **no supporter registration, mint, transfer, listing
or ENS write is claimed**. Tracking:
[DecentBusking #246](https://github.com/TheJollyLaMa/DecentBusking/issues/246).

## First mint candidate: v0.2.1

The v0.2.0 render exposed an obsolete v0.1.0 development-draft label in the
demo. Remove that stale label in a new immutable patch release before minting;
v0.2.0 pins remain preserved and are not mint candidates.

The steward reduced supply to **100 editions at 10 Base USDC** and requested
verified ENS/IPFS sites before minting. Publish a new immutable version; the
v0.1.0 1,000-edition preparation is superseded, not rewritten or minted.
Source now pins Busking `948289670ed43678ea0dcaeafd8ea487bd78a2b0` (PR #287).
The existing closure generator was reused; DVert does not import the site's
radio player, so the host's current shared radio adapter remains its boundary.
Apache-2.0/CC-BY-4.0 notices and explicit binary media adapter are preserved.

## Wallet responsibilities

The steward corrected the earlier Agency-admin/recipient proposal:

- **thejollylama.eth**, `0x807061DF657A7697c04045dA7d16D941861cAABc`,
  remains the existing Base NFT admin and handles supporter registration,
  minting, initial editions and royalties.
- **decentagency.eth**, `0xcAeEd8422fB5682C298B7F0971906d446fFd4e7a`,
  is the Ethereum parent for `dvert.decentagency.eth` and the other widget
  subnames. Its wallet is needed for ENS, not supporter-token administration.
- The proposed Agency NFT-admin grant is **withdrawn**. Do not sign it, revoke
  the personal admin, or transfer NFT administration.

Recheck ENS resolution, name ownership and Base role state before signing.
The local `releases/v0.1.0-draft/` JSON files are unsigned planning inputs updated
to the corrected intent, not replacements for the immutable public assets.
Null draft IDs, receipts and verification fields must not be filled speculatively.

## Supporter transactions

Terms are **100 Base ERC-1155 Product editions at 10 native Base USDC,
1,000 bps (10%) secondary royalties**. Support does not promise product ownership
or financial return; royalties are not universally enforced.

1. Verify the reviewed metadata URI and duplicate-mint history.
2. From the personal NFT admin, register Product kind `0`, supply `100`,
   exact frozen metadata and the personal royalty recipient at `1000` bps.
3. Read the token ID from the confirmed registration receipt; never predict it.
4. Mint `100` to the personal wallet. Verify receipt, URI, supply, balance and
   `royaltyInfo`.
5. **Stop before stock transfer/listing.** Primary-sale routing remains
   unconfirmed. The existing community escrow retains purchase USDC; neither
   a royalty recipient nor the minting wallet changes that behavior.
6. After a separately approved sale route, verify stock, listing, unpaused state,
   10-USDC-only price and actual purchase destination before announcing sales.

Every transaction requires the controlling wallet's explicit signature.
No keys belong in CI, this repository, chat or browser evaluation.

## ENS and immutable preparation

Create/configure `dvert.decentagency.eth` on Ethereum from its parent controller,
not from the personal Base NFT admin. Set a reviewed resolver and the exact
approved pinned site contenthash, then independently verify receipts and
resolution. Display text is not proof of ENS registration or resolution.

Both supporter workflow callers pin `uses` and `head_ref` to DecentHead
`a0f3bdebcbb5ded8437446797fcba28272af8098`. `index.html` mounts the real widget;
`widget.html` remains its equivalent alias. The preparation workflow uses the
configured `PINATA_JWT` secret, pins tagged assets, freezes the manifest and opens
a mint checklist. It does not sign or broadcast transactions.

Never re-prepare or overwrite a frozen release. Corrections to released source
or artwork require a new reviewed version. Inspect exact metadata/art/source
linkage before signing; use the public release manifest, not a local draft URI.

Keep `SUPPORTER_DISCORD_ENABLED=false` until mint/listing evidence, the configured
ENS content and an explicitly approved notification destination are verified.
No Discord post, financial transaction or ENS write is performed by this guide.
