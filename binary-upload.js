import { createBrowserIpfsUploader } from './vendor/busking/js/ipfs-upload.js?v=20261015-mime-sniff';

// Deliberate host opt-in, never the header's JSON backup uploader.
export function createWorkerBinaryUpload({ origin = globalThis.location?.origin, fetchImpl = globalThis.fetch } = {}) {
  return async (file, { session, signer, wallet, signal, serviceUrl }) => {
    signal.throwIfAborted();
    if (session?.snapshot?.().provider !== 'pinata') {
      throw new Error('This binary adapter requires the host-configured Pinata worker');
    }
    const state = wallet?.snapshot?.();
    if (!state?.connected || Number(state.chainId) !== 8453 || !state.address || !signer) {
      throw new Error('Connect the host wallet on Base before uploading');
    }
    if (!origin || origin === 'null') throw new Error('A real host origin is required for upload authorization');
    const upload = createBrowserIpfsUploader({
      provider: 'pinata', serviceUrl, signer, address: state.address, origin,
      purpose: 'submission', retries: 0,
      fetchImpl: (url, init = {}) => {
        signal.throwIfAborted();
        return fetchImpl(url, { ...init, signal: AbortSignal.any([signal, ...(init.signal ? [init.signal] : [])]) });
      },
    });
    const uri = await upload(file);
    signal.throwIfAborted();
    return uri;
  };
}
