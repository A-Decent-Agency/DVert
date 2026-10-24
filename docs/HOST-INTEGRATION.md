# Integrating the existing DecentHead session

Use the real [DecentHead v2.0.0 adoption guide](https://github.com/TheJollyLaMa/DecentHead/blob/072a5206489d0e4a3f2576c56f8debb729d933c9/docs/ADOPTING.md#widget-host-api)
at immutable commit `072a5206489d0e4a3f2576c56f8debb729d933c9`.
This is an API reference, **not a second bundled header**.

For an existing host, retain its one header and configuration. For a new host,
follow that guide's exact vendor manifest and licenses under
`vendor/decent-head/2.0.0/`, copy/configure `decent-head.config.js`, and use
[`examples/host-embed.html`](../examples/host-embed.html). Those optional host
prerequisite files are intentionally not bundled in DVert; the example is not
the zero-setup standalone demo. The supplied `widget.html` needs no header
and provides real read-only public data.

The widget resolves `window.DecentHead`, waits for `decenthead:ready` and subscribes
with `head.on('wallet', cb)`; its returned unsubscribe is called at destroy.
Wallet events contain `connected`, `address`, `chainId`, `provider`, `ensName`,
`ensStatus`; the connected provider is an ethers BrowserProvider, not a new
EIP-1193 connection. The widget never calls the session's `connect()` or
`ensureChain()`. Connect/switch in the existing header first.

The host's existing local ethers v6 must expose `Contract` and `JsonRpcSigner`.
DecentHead's lazy load on its own explicit connect gesture is supported; DVert
looks up the implementation when the user later acts. DVert constructs the
signer without requesting accounts. Synthetic DOM tests assert no signer at
mount, both early/late shared-header readiness, no duplicate subscriptions and
full teardown. These tests do not sign or send real transactions.

## Explicit binary media capability

`head.getIpfs().upload(data)` creates JSON backups. It is **not** a File API.
`head.getIpfs().snapshot().provider` is only a selection identifier, not an
EIP-1193 provider or proof of a binary upload capability.

Only supply a binary adapter deliberately configured/authorized by your host.
The widget already presents public-IPFS consent and only invokes this adapter
from the user's **Submit for Review** action. For a host deliberately using the
existing signed Busking worker, this real adapter reuses its uploader:

```js
import { mount } from './dvert/widget.js';
import { createBrowserIpfsUploader } from './dvert/vendor/busking/js/ipfs-upload.js?v=20261015-mime-sniff';

const widget = mount(document.getElementById('advertising'), {
  async uploadMedia(file, { session, signer, wallet, signal, serviceUrl }) {
    // This host explicitly supports its signed Pinata-worker transport only.
    // No transport is inferred or silently changed from a session identifier.
    if (session.snapshot().provider !== 'pinata') {
      throw new Error('This host binary adapter requires its configured Pinata worker');
    }
    signal.throwIfAborted();
    const state = wallet.snapshot();
    const upload = createBrowserIpfsUploader({
      provider: 'pinata', serviceUrl, signer, address: state.address,
      origin: location.origin, purpose: 'submission', retries: 0,
      fetchImpl: (url, init = {}) => fetch(url, {
        ...init,
        signal: AbortSignal.any([signal, ...(init.signal ? [init.signal] : [])])
      })
    });
    const uri = await upload(file);
    signal.throwIfAborted();
    return uri; // Actual verified worker response, not a manufactured CID.
  }
});
```

This example must still pass the existing worker's authentication, origin,
rate-limit and media restrictions. It cannot self-authorize a new host origin,
mint an advert NFT or bypass approval. No API credentials are copied from the
header. The widget subsequently uses the original submission message builder
and worker endpoint with cancellation-aware retries. Public bytes already
accepted by a provider cannot be recalled by destroying the UI.

## Optional playback coordination

Without a host radio, DVert can mirror the existing VertLoop in its own video
element after a listener gesture. If your host has another player, explicitly
pass a `radio` object with synchronous `canSetDevertListenMode()`,
`setDevertListenMode('ads-only'|'radio')`, `getRadioStateSnapshot()` and
`formatMainRadioAdCountdown(countdown, options)`. It may provide
`subscribe(callback)` returning an unsubscribe. Coordinate hush/resume in
that adapter; never import a second Busking radio player into a host.
Destroy stops widget media and returns an active adapter to `radio`.

## Lifecycle and verification scope

`destroy()` removes all widget listeners (including its late-ready listener),
unsubscribes from the header/optional radio, cancels polling/reads and submission
retry delays, closes the dialog, stops media and restores the host's light DOM.
No post-destroy submission or signature is allowed through the guarded signer.
It cannot revoke a wallet prompt already open, an already-broadcast transaction
or previously uploaded public media. Inspect pending receipts before retrying.

Modern ES modules, Shadow DOM, AbortController, AbortSignal.timeout/any and
native `<dialog>` are required. The DOM test fixture supplies JSDOM's missing
AbortSignal.any browser API; the dedicated browser smoke uses the browser's
native implementation.
