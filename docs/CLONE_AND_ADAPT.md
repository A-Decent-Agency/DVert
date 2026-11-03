# Clone, adapt and support DVert

Reuse the existing [DVert repository](https://github.com/A-Decent-Agency/DVert),
not a duplicate product or supporter token. Need: an independently embeddable,
customizable advert panel with explicit payment/upload consent and teardown.
The receiving adapter is `widget.js` (`mount`, `defaults`);
`source-lock.json` pins its existing DecentBusking closure at
`948289670ed43678ea0dcaeafd8ea487bd78a2b0`. Reuse/adapt this adapter and closure,
not a new shared extraction or a copy of the full website.

## Clone and customize

Follow [clone/run and the mount example](../README.md#clone-and-run).
Static preview needs no install/build. Customize `title`, `label`, `theme`
and `--dvert-*` tokens while preserving prices, accessible controls and errors.
Use one existing DecentHead session; call the returned `destroy()` on route
disposal. Mount cannot connect, switch chains, sign, upload or send payments.
Binary uploads need an explicit host capability and public-IPFS user consent;
never substitute the header's JSON-backup API.

A frontend clone does not deploy contracts or a worker. Choose
[hosted onboarding](ONBOARDING.md) or [independent deployment](INDEPENDENT-DEPLOYMENT.md).
[Host integration](HOST-INTEGRATION.md) specifies ethers, media and radio adapters.
Exact-origin approval, compatible Base contracts, operator funding and actual
write/delivery tests remain deployment-specific. Keep failure/disabled states;
do not fabricate uploads, receipts or refunds. Never copy signing secrets.

## Existing ENS and supporter evidence

Published release: [v0.2.1](https://github.com/A-Decent-Agency/DVert/releases/tag/v0.2.1),
source commit `bf3a26d102629f1d72a3655187b098da3bcf4eaa`.
The following are public release snapshots, inspected 2026-11-02, not a fresh
RPC verification or a promise of present stock:

- [Mint/ENS evidence](https://github.com/A-Decent-Agency/DVert/releases/download/v0.2.1/supporter-mint-evidence.json),
  verified `2026-10-24T19:50:25.400Z`: **100** minted editions, token **73** on Base;
  ENS **`dvert.decentagency.eth`**, owner
  `0xcAeEd8422fB5682C298B7F0971906d446fFd4e7a`, resolver
  `0xF29100983E058B709F3D539b0c765937B804AC15`, contenthash for site
  `bafybeig3ttjl47f2fk4pbpg5aoooyqzpxaxzteq6fp3awofk4nzahhvvzy`.
- [Later listing evidence](https://github.com/A-Decent-Agency/DVert/releases/download/v0.2.1/supporter-listing-evidence.json),
  verified `2026-10-24T19:59:23.565Z`: listing **3**, initially **99**
  editions at **10 native Base USDC**, one personal reserve.
  Proceeds are **retained in community escrow**, not automatically paid to
  the minting/royalty wallet. Secondary royalty: **1,000 bps (10%)**.

Existing NFT: `0xe63EC9f8228720bAAC2fD528C0A6d06B3Dc5439B`.
Escrow: `0x31b07b83e99A9bdF379bf40225b8A80d3804C89d`.
[Support the existing listing](https://thejollylama.github.io/DecentHead/supporter/buy.html?chainId=8453&escrow=0x31b07b83e99A9bdF379bf40225b8A80d3804C89d&listingId=3).
Verify chain, token, active listing, current quantity, price and destination in
the wallet before buying. Support is not a campaign purchase, ownership,
investment or required software license. Do not register/mint a duplicate.
The earlier mint snapshot's “not listed” status predates the later listing;
historical preparation instructions and draft JSON do not override receipts.

## Validation and support

Run `npm ci --ignore-scripts --no-audit --no-fund`, `npm test` and `npm run verify`.
Real-artifact deployment tests additionally require the reviewed compiled
Market checkout in the independent guide. Lifecycle, upload-consent and
synthetic financial tests do not establish live deployment or delivery.

[Report product issues](https://github.com/A-Decent-Agency/DVert/issues)
with version, host origin, browser, visible error and public transaction hash;
never include secrets or private files. Retain Apache-2.0 code, CC-BY-4.0
original creative-content attribution and upstream LICENSE/NOTICE. Advert
media have separate rights.
