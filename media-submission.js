import { buildSubmissionAuthorizationMessage } from './vendor/busking/js/mint-submission.js?v=20261017-mercury-release';

function delay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, milliseconds);
    signal.addEventListener('abort', abort, { once: true });
  });
}

// Same signed payload and worker endpoint as Busking, with cancellable retries.
export async function submitDvertMedia({ serviceUrl, signer, address, origin, media, fetchImpl, signal }) {
  if (!serviceUrl || !signer || !address) throw new Error('Connect the host wallet and configure the media submission service');
  for (let attempt = 0; ; attempt++) {
    signal.throwIfAborted();
    try {
      const payload = { ...media, address, origin, issuedAt: new Date().toISOString() };
      const signature = await signer.signMessage(buildSubmissionAuthorizationMessage(payload));
      signal.throwIfAborted();
      const response = await fetchImpl(`${serviceUrl.replace(/\/$/, '')}/api/media/submit`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, signature }), signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(result.error || `Submission failed (${response.status})`);
        error.retryable = response.status >= 500 || response.status === 429 || response.status === 408;
        throw error;
      }
      return result;
    } catch (error) {
      if (signal.aborted) throw signal.reason;
      if (attempt >= 2 || !(error.retryable || /Failed to fetch|NetworkError|network|load failed|fetch failed/i.test(error.message))) throw error;
      await delay(250 * 2 ** attempt, signal);
    }
  }
}
