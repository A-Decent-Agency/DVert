import { defaults } from './widget.js';

export async function preflight(options = {}, { fetchImpl = globalThis.fetch, signal } = {}) {
  const config = { ...defaults, ...options };
  const url = new URL(config.serviceUrl);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) ||
      url.username || url.password || url.search || url.hash) {
    throw new Error('Use an HTTPS worker URL (loopback HTTP is allowed), without credentials, query or fragment');
  }
  for (const field of ['campaignAddress', 'queueAddress']) {
    if (!/^0x[0-9a-f]{40}$/i.test(config[field]) || /^0x0{40}$/i.test(config[field])) {
      throw new Error(`Set a nonzero Base ${field}`);
    }
  }
  const errors = [];
  const states = await Promise.all(['', '/queue'].map(async suffix => {
    try {
      const response = await fetchImpl(`${url.href.replace(/\/$/, '')}/api/devert${suffix}`, {
        method: 'GET', cache: 'no-store',
        signal: AbortSignal.any([AbortSignal.timeout(12000), ...(signal ? [signal] : [])]),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      errors.push(`${suffix ? 'queue' : 'campaign'} read failed: ${error.message}`);
      return null;
    }
  }));
  const [campaign, queue] = states;
  for (const [label, state, expected] of [['campaign', campaign, config.campaignAddress], ['queue', queue, config.queueAddress]]) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      errors.push(`${label} snapshot missing or malformed`);
      continue;
    }
    if (state.chainId !== 8453 || typeof state.contractAddress !== 'string' || state.contractAddress.toLowerCase() !== expected.toLowerCase()) {
      errors.push(`${label} chain/address mismatch`);
    }
    if (typeof state.paused !== 'boolean') errors.push(`${label} pause state missing`);
  }
  if (campaign && (!Array.isArray(campaign.campaigns) || !Number.isFinite(Date.parse(campaign.snapshotAt)))) {
    errors.push('Invalid campaign snapshot');
  }
  if (queue && (queue.configured !== true || queue.version !== 2 || !Array.isArray(queue.approvedCampaignIds))) {
    errors.push('Configured v2 queue snapshot required');
  }
  return {
    ok: errors.length === 0,
    errors,
    campaignReady: errors.length === 0 && campaign?.paused === false,
    priorityReady: errors.length === 0 && campaign?.paused === false && queue?.paused === false &&
      queue?.paymentsEnabled === true && queue?.playbackReady === true,
    scope: 'Read-only worker snapshots only; not chain bytecode, wallet, CORS write authorization, upload, playback or release acceptance.',
  };
}
