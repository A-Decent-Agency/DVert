import test from 'node:test';
import assert from 'node:assert/strict';
import { preflight } from '../preflight.js';
import { defaults } from '../widget.js';
import { createWorkerBinaryUpload } from '../binary-upload.js';

const states = () => [
  { chainId: 8453, contractAddress: defaults.campaignAddress, paused: false, campaigns: [], snapshotAt: new Date().toISOString() },
  { chainId: 8453, contractAddress: defaults.queueAddress, paused: false, configured: true, version: 2,
    approvedCampaignIds: [], paymentsEnabled: true, playbackReady: true },
];
function reader(data, calls = []) {
  return async (url, init) => {
    calls.push({ url, init });
    return { ok: true, json: async () => data[url.endsWith('/queue') ? 1 : 0] };
  };
}

test('preflight reads only public snapshots; disabled playback remains not ready', async () => {
  const data = states();
  const calls = [];
  assert.equal((await preflight({}, { fetchImpl: reader(data, calls) })).priorityReady, true);
  assert.ok(calls.every(({ init }) => init.method === 'GET' && init.signal));
  data[1].playbackReady = false;
  const report = await preflight({}, { fetchImpl: reader(data) });
  assert.equal(report.ok, true);
  assert.equal(report.priorityReady, false);
  data[1].paymentsEnabled = false;
  assert.equal((await preflight({}, { fetchImpl: reader(data) })).priorityReady, false);
});

test('preflight fails closed on mismatched/legacy/malformed worker and unavailable endpoints', async () => {
  for (const mutate of [
    data => { data[0].chainId = 1; },
    data => { data[1].contractAddress = defaults.campaignAddress; },
    data => { data[1].version = 1; },
    data => { delete data[0].paused; },
    data => { data[0].campaigns = null; },
    data => { data[0].snapshotAt = 'invalid'; },
  ]) {
    const data = states(); mutate(data);
    const report = await preflight({}, { fetchImpl: reader(data) });
    assert.equal(report.ok, false);
    assert.equal(report.priorityReady, false);
  }
  assert.equal((await preflight({}, { fetchImpl: async () => ({ ok: false, status: 503 }) })).ok, false);
  for (const snapshot of [null, false, [], {}, 1, '']) {
    assert.equal((await preflight({}, { fetchImpl: reader([snapshot, snapshot]) })).ok, false);
  }
  for (const options of [{ serviceUrl: 'http://example.com' }, { serviceUrl: 'https://user:secret@example.com' },
    { serviceUrl: 'https://example.com/?key=secret' }, { queueAddress: `0x${'0'.repeat(40)}` }]) {
    await assert.rejects(preflight(options, { fetchImpl: () => assert.fail('must validate before fetching') }));
  }
});

test('binary adapter sends an actual File as multipart after explicit worker authorization, not Head JSON', async () => {
  const calls = [];
  let jsonUploads = 0;
  const signer = { async signMessage(message) { calls.push(message); return 'synthetic-signature'; } };
  const file = new File(['synthetic audio fixture'], 'test.mp3', { type: 'audio/mpeg' });
  const adapter = createWorkerBinaryUpload({ origin: 'https://fixture.example', fetchImpl: async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/submission-upload-url')) {
      const payload = JSON.parse(init.body);
      assert.equal(payload.purpose, 'submission');
      assert.equal(payload.size, file.size);
      assert.equal(payload.origin, 'https://fixture.example');
      return { ok: true, json: async () => ({ url: 'https://upload.fixture.example/file' }) };
    }
    assert.ok(init.body instanceof FormData);
    assert.equal(await init.body.get('file').text(), await file.text());
    return { ok: true, json: async () => ({ data: { cid: `bafy${'a'.repeat(40)}` } }) };
  } });
  const context = {
    session: { snapshot: () => ({ provider: 'pinata' }), upload: () => { jsonUploads++; } },
    wallet: { snapshot: () => ({ connected: true, chainId: 8453, address: defaults.campaignAddress }) },
    signer, signal: new AbortController().signal, serviceUrl: 'https://worker.fixture.example',
  };
  assert.equal(await adapter(file, context), `ipfs://bafy${'a'.repeat(40)}`);
  assert.equal(jsonUploads, 0);
  assert.equal(calls.length, 3);
  await assert.rejects(adapter(file, { ...context, session: { snapshot: () => ({ provider: 'local' }) } }), /Pinata worker/);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(adapter(file, { ...context, signal: abort.signal }), /abort/i);
  assert.equal(calls.length, 3);
});
