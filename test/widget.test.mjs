import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { mount, defaults } from '../widget.js';
import { submitDvertMedia } from '../media-submission.js';

const address = '0x1111111111111111111111111111111111111111';
const cid = `bafy${'a'.repeat(40)}`;
const settle = () => new Promise(resolve => setImmediate(resolve));
const active = [];
test.afterEach(async () => {
  for (const cleanup of active.splice(0)) await cleanup();
});
async function fixture({ connected = false, pending = false, ...options } = {}) {
  const dom = new JSDOM('<!doctype html><button id="outside">Host button</button><main id="widget"></main>', { url: 'https://host.example/' });
  const { window } = dom;
  window.AbortSignal.any = signals => {
    const controller = new window.AbortController();
    for (const signal of signals) {
      if (signal.aborted) { controller.abort(signal.reason); break; }
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true, signal: controller.signal });
    }
    return controller.signal;
  };
  window.HTMLMediaElement.prototype.pause = function () {};
  window.HTMLMediaElement.prototype.load = function () {};
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.window = window;
  const calls = { connect: 0, signer: 0, sign: 0, jsonUpload: 0, binaryUpload: 0, unsubscribe: 0, refunds: 0, campaigns: [], paid: [] };
  const provider = {
    getNetwork: async () => ({ chainId: 8453n }),
    getSigner: async () => { calls.signer++; throw new Error('Do not use BrowserProvider.getSigner'); },
    getFeeData: async () => ({ maxFeePerGas: 2_000_000_000n, maxPriorityFeePerGas: 1_000_000n }),
    getBalance: async () => 10n ** 18n,
    getBlock: async () => ({ timestamp: Math.floor(Date.now() / 1000) }),
  };
  let state = { connected, address: connected ? address : null, chainId: connected ? 8453 : null, provider: connected ? provider : null };
  const listeners = new Set();
  const wallet = { snapshot: () => state, connect: () => { calls.connect++; }, ensureChain: () => { calls.connect++; } };
  const ipfs = { snapshot: () => ({ provider: 'pinata' }), upload: () => { calls.jsonUpload++; throw new Error('Never JSON-serialize a File'); } };
  const head = {
    getWallet: () => wallet, getIpfs: () => ipfs,
    on(type, callback) { assert.equal(type, 'wallet'); listeners.add(callback); return () => { calls.unsubscribe++; listeners.delete(callback); }; },
  };
  const timers = new Set();
  const nativeInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);
  const nativeTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  window.setInterval = (...args) => { const id = nativeInterval(...args); timers.add(id); return id; };
  window.clearInterval = id => { timers.delete(id); nativeClearInterval(id); };
  window.setTimeout = (callback, delay) => {
    const id = nativeTimeout(() => { timers.delete(id); callback(); }, delay);
    timers.add(id);
    return id;
  };
  window.clearTimeout = id => { timers.delete(id); nativeClearTimeout(id); };
  const requests = [];
  const campaign = { campaignId: '1', title: 'Synthetic test ad', advertiser: address, audioURI: `ipfs://${cid}`, offerUnits: '5000000',
    startedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() };
  const catalog = { chainId: 8453, contractAddress: defaults.campaignAddress, paused: false, snapshotAt: new Date().toISOString(),
    campaigns: [campaign], market: { slots: 1 } };
  const paid = { configured: true, chainId: 8453, contractAddress: defaults.queueAddress, version: 2, paused: false,
    paymentsEnabled: true, playbackReady: true, pendingCount: 0, priceUnits: '1000000', immediatePriceUnits: '2000000',
    requests: [], recentRefunds: [], approvedCampaignIds: ['1'] };
  window.fetch = (url, init = {}) => {
    requests.push({ url, init });
    if (pending) return new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true }));
    const data = url.endsWith('/queue') ? paid : url.includes('/ads?')
      ? { ads: [{ title: 'Synthetic test ad', state: 'ready', ipfsCid: cid, tokenId: '999' }] }
      : url.endsWith('/loop') ? { ready: true } : url.endsWith('/submit') ? { submitted: true } : catalog;
    return Promise.resolve({ ok: true, status: 200, json: async () => data });
  };
  class JsonRpcSigner {
    constructor(p, a) { assert.equal(p, provider); assert.equal(a, address); calls.signer++; this.provider = p; }
    async getAddress() { return address; }
    async signMessage() { calls.sign++; return 'synthetic-signature'; }
  }
  const queued = { payer: address, campaignId: 1n, status: 0, removed: true };
  class Contract {
    constructor(target, abi, signer) {
      this.target = target;
      this.signer = signer;
      this.getRequest = async () => queued;
      this.removedCampaigns = async () => queued.removed;
      this.claimRefund = async () => { calls.refunds++; return { hash: '0xsynthetic', wait: async () => ({ status: 1 }) }; };
      this.decimals = async () => 6;
      this.balanceOf = async () => 100_000_000n;
      this.allowance = async () => 100_000_000n;
      this.queueVersion = async () => 2;
      this.paymentToken = async () => '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      this.quoteForTier = async tier => tier === 1 ? 2_000_000n : 1_000_000n;
      this.requestAd = async (...args) => {
        calls.paid.push(args);
        return { hash: `0xsynthetic${args[1]}`, wait: async () => ({ status: 1, logs: [{ address: target }] }) };
      };
      this.requestAd.staticCall = async () => {};
      this.interface = { parseLog: () => ({ name: 'AdRequested', args: { requestId: 7n } }) };
      this.campaignWeek = async () => 1n;
      this.quoteCampaign = async () => ({ minimumOfferUnits: 1_000_000n });
      this.quoteSchedulerGasTopUp = async () => 1000n;
      this.createCampaign = async (...args) => {
        calls.campaigns.push(args);
        return { hash: '0xsyntheticcampaign', wait: async () => ({ status: 1 }) };
      };
      this.createCampaign.staticCall = async () => {};
    }
  }
  const element = window.document.getElementById('widget');
  const controller = mount(element, { head, ethers: { Contract, JsonRpcSigner }, ...options });
  active.push(async () => { controller.destroy(); await settle(); dom.window.close(); });
  await settle();
  return { dom, window, element, root: element.shadowRoot, controller, calls, requests, listeners, timers, head, ipfs, wallet, paid, catalog,
    queued, ethers: { Contract, JsonRpcSigner },
    state(next) { state = next; for (const callback of listeners) callback(state); },
    async close() { controller.destroy(); await settle(); dom.window.close(); } };
}

test('actual mount is inert financially, shares one host session, and exposes real controllers', async () => {
  const ui = await fixture({ connected: true });
  assert.equal(ui.root.querySelector('#devert-paid-queue-button').disabled, false);
  assert.equal(ui.root.querySelector('#devert-purchase').disabled, false);
  assert.match(ui.root.textContent, /DVert\.decentagency\.eth/);
  assert.equal(ui.calls.connect, 0);
  assert.equal(ui.calls.signer, 0);
  assert.equal(ui.calls.sign, 0);
  assert.equal(ui.calls.jsonUpload, 0);
  assert.equal(ui.calls.binaryUpload, 0);
  assert.ok(ui.requests.some(request => request.url.endsWith('/api/devert/queue')));
  assert.ok(ui.requests.every(request => !request.init.method || request.init.method === 'GET'));
  assert.equal(ui.listeners.size, 1);
  await ui.close();
  assert.equal(ui.calls.unsubscribe, 1);
});

test('destroy aborts outstanding reads, listeners and timers; repeat mounts do not leak', async () => {
  const ui = await fixture({ pending: true });
  const oldButton = ui.root.querySelector('#devert-tab');
  assert.ok(ui.requests.length > 0);
  assert.ok(ui.timers.size > 0);
  assert.throws(() => mount(ui.element, {}), /already mounted/);
  ui.controller.destroy();
  ui.controller.destroy();
  await settle();
  assert.equal(ui.listeners.size, 0);
  assert.equal(ui.timers.size, 0);
  assert.ok(ui.requests.every(request => request.init.signal.aborted));
  const count = ui.requests.length;
  oldButton.click();
  ui.window.dispatchEvent(new ui.window.CustomEvent('decenthead:ready'));
  await settle();
  assert.equal(ui.requests.length, count);
  assert.equal(ui.root.querySelectorAll('style').length, 0);
  for (let index = 0; index < 3; index++) {
    const next = mount(ui.element, { head: ui.head, open: false });
    next.destroy();
    assert.equal(ui.listeners.size, 0);
    assert.equal(ui.timers.size, 0);
  }
  await ui.close();
});

test('late DecentHead readiness attaches exactly once, and disconnect removes action capability', async () => {
  const ui = await fixture({ head: undefined, open: false });
  assert.equal(ui.listeners.size, 0);
  ui.window.DecentHead = ui.head;
  ui.window.dispatchEvent(new ui.window.CustomEvent('decenthead:ready'));
  ui.window.dispatchEvent(new ui.window.CustomEvent('decenthead:ready'));
  assert.equal(ui.listeners.size, 1);
  ui.state({ connected: false });
  assert.equal(ui.root.querySelector('#devert-purchase').disabled, true);
  assert.equal(ui.calls.signer, 0);
  await ui.close();
});

test('binary upload requires a user action, explicit consent and an explicit host capability; never JSON upload', async () => {
  let supplied;
  const ui = await fixture({ connected: true, uploadMedia: async (file, context) => {
    ui.calls.binaryUpload++;
    supplied = { file, context };
    return `ipfs://${cid}`;
  } });
  const file = new ui.window.File(['synthetic audio'], 'ad.mp3', { type: 'audio/mpeg' });
  const input = ui.root.querySelector('#devert-ad-file');
  Object.defineProperty(input, 'files', { value: [file] });
  ui.root.querySelector('#devert-title').value = 'Synthetic test ad';
  input.dispatchEvent(new ui.window.Event('change', { bubbles: true }));
  assert.equal(ui.calls.binaryUpload, 0);
  ui.root.querySelector('#devert-ad-queue').click();
  await settle();
  assert.match(ui.root.querySelector('#devert-ad-queue-status').textContent, /consent/);
  assert.equal(ui.calls.binaryUpload, 0);
  ui.root.querySelector('#dvert-upload-consent').checked = true;
  ui.root.querySelector('#devert-ad-queue').click();
  await settle();
  await settle();
  assert.equal(ui.calls.binaryUpload, 1);
  assert.equal(ui.calls.jsonUpload, 0);
  assert.equal(supplied.file, file);
  assert.equal(supplied.context.session, ui.ipfs);
  assert.equal(supplied.context.wallet, ui.wallet);
  assert.equal(ui.calls.sign, 1);
  assert.match(ui.root.querySelector('#devert-ad-queue-status').textContent, /Submitted for review/);
  const submit = ui.requests.find(request => request.url.endsWith('/api/media/submit'));
  assert.equal(JSON.parse(submit.init.body).isDevertAd, true);
  assert.equal(JSON.parse(submit.init.body).ipfsCid, `ipfs://${cid}`);
  assert.equal(ui.calls.connect, 0);
  await ui.close();
  assert.equal(supplied.context.signal.aborted, true);
});

test('unsupported binary upload is an explicit error and never falls back to JSON backup', async () => {
  const ui = await fixture({ connected: true });
  const file = new ui.window.File(['audio'], 'ad.mp3', { type: 'audio/mpeg' });
  Object.defineProperty(ui.root.querySelector('#devert-ad-file'), 'files', { value: [file] });
  ui.root.querySelector('#devert-title').value = 'Test';
  ui.root.querySelector('#dvert-upload-consent').checked = true;
  ui.root.querySelector('#devert-ad-file').dispatchEvent(new ui.window.Event('change'));
  ui.root.querySelector('#devert-ad-queue').click();
  await settle();
  assert.match(ui.root.querySelector('#devert-ad-queue-status').textContent, /not supported/);
  assert.equal(ui.calls.jsonUpload, 0);
  assert.equal(ui.calls.sign, 0);
  await ui.close();
});

test('destroy during host media upload prevents subsequent signing/submission', async () => {
  let finish;
  const ui = await fixture({ connected: true, uploadMedia: () => new Promise(resolve => { finish = resolve; }) });
  Object.defineProperty(ui.root.querySelector('#devert-ad-file'), 'files', {
    value: [new ui.window.File(['audio'], 'ad.mp3', { type: 'audio/mpeg' })],
  });
  ui.root.querySelector('#devert-title').value = 'Test';
  ui.root.querySelector('#dvert-upload-consent').checked = true;
  ui.root.querySelector('#devert-ad-file').dispatchEvent(new ui.window.Event('change'));
  ui.root.querySelector('#devert-ad-queue').click();
  await settle();
  ui.controller.destroy();
  finish(`ipfs://${cid}`);
  await settle();
  assert.equal(ui.calls.sign, 0);
  assert.equal(ui.requests.filter(request => request.url.endsWith('/api/media/submit')).length, 0);
  await ui.close();
});

test('mounted refund recovery invokes the original payer/removal-gated helper only on submit', async () => {
  const ui = await fixture({ connected: true });
  const form = ui.root.querySelector('input[name=requestId]').closest('form');
  ui.root.querySelector('input[name=requestId]').value = '0';
  assert.equal(ui.calls.refunds, 0);
  form.dispatchEvent(new ui.window.Event('submit', { bubbles: true, cancelable: true }));
  await settle();
  assert.equal(ui.calls.refunds, 1);
  assert.match(form.nextElementSibling.textContent, /Refund confirmed/);
  await ui.close();
});

test('mounted queue submits both unchanged tiers and blocks checkout on playback availability failure', async () => {
  const ui = await fixture({ connected: true });
  const confirmations = [];
  ui.element.addEventListener('dvert:payment-confirmed', event => confirmations.push(event.detail));
  ui.root.querySelector('#devert-paid-queue-button').click();
  await settle();
  assert.deepEqual(ui.calls.paid[0], [1n, 0, 1_000_000n]);
  ui.root.querySelector('#devert-paid-immediate-button').click();
  await settle();
  assert.deepEqual(ui.calls.paid[1], [1n, 1, 2_000_000n]);
  assert.equal(confirmations.length, 2);
  ui.paid.playbackReady = false;
  ui.paid.playbackReason = 'Synthetic checkpoint mirror offline';
  ui.controller.refresh();
  await settle();
  assert.equal(ui.root.querySelector('#devert-paid-queue-button').disabled, true);
  assert.equal(ui.root.querySelector('#devert-paid-immediate-button').disabled, true);
  ui.root.querySelector('#devert-paid-immediate-button').click();
  assert.equal(ui.calls.paid.length, 2);
  assert.equal(ui.calls.connect, 0);
  await ui.close();
});

test('host ethers can load after mount without creating a second session', async () => {
  const ui = await fixture({ connected: true, ethers: undefined });
  assert.equal(ui.calls.signer, 0);
  ui.window.ethers = ui.ethers;
  ui.root.querySelector('#devert-paid-queue-button').click();
  await settle();
  assert.equal(ui.calls.paid.length, 1);
  assert.equal(ui.calls.connect, 0);
  await ui.close();
});

test('mounted refund recovery refuses a different payer, settled request or unremoved campaign', async () => {
  const ui = await fixture({ connected: true });
  const input = ui.root.querySelector('input[name=requestId]');
  const form = input.closest('form');
  input.value = '0';
  for (const next of [
    { payer: `0x${'22'.repeat(20)}`, status: 0, removed: true },
    { payer: address, status: 1, removed: true },
    { payer: address, status: 0, removed: false },
  ]) {
    Object.assign(ui.queued, next);
    form.dispatchEvent(new ui.window.Event('submit', { cancelable: true }));
    await settle();
    assert.equal(ui.calls.refunds, 0);
    assert.match(form.nextElementSibling.textContent, /paying wallet|no removal refund/);
  }
  await ui.close();
});

test('mounted campaign checkout keeps duplicate-term guard and exact 5-USDC/week plus ETH top-up', async () => {
  const ui = await fixture({ connected: true });
  ui.root.querySelector('.devert-library-card').click();
  const form = ui.root.querySelector('#devert-purchase-form');
  form.dispatchEvent(new ui.window.Event('submit', { cancelable: true }));
  await settle();
  assert.equal(ui.calls.campaigns.length, 0);
  assert.match(ui.root.querySelector('#devert-purchase-status').textContent, /already has a paid campaign/);
  ui.catalog.campaigns[0].advertiser = `0x${'22'.repeat(20)}`;
  ui.root.querySelector('#devert-weeks').value = '2';
  form.dispatchEvent(new ui.window.Event('submit', { cancelable: true }));
  await settle();
  assert.equal(ui.calls.campaigns.length, 1);
  assert.equal(ui.calls.campaigns[0][2], 10_000_000n);
  assert.equal(ui.calls.campaigns[0][3], 10_000_000n);
  assert.equal(ui.calls.campaigns[0][4].value, 2000n);
  assert.equal(ui.calls.connect, 0);
  await ui.close();
});

test('submission retry delay aborts cleanly with no later signature or network request', async () => {
  const abort = new AbortController();
  let signs = 0;
  let requests = 0;
  const work = submitDvertMedia({
    serviceUrl: defaults.serviceUrl, signer: { signMessage: async () => { signs++; return 'synthetic'; } },
    address, origin: 'https://host.example', media: { title: 'Synthetic', ipfsCid: cid },
    signal: abort.signal,
    fetchImpl: async () => { requests++; return { ok: false, status: 503, json: async () => ({ error: 'Synthetic offline' }) }; },
  });
  await settle();
  abort.abort();
  await assert.rejects(work, /abort/i);
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(signs, 1);
  assert.equal(requests, 1);
});

test('all presentation is shadow scoped, includes reduced motion and keeps source freeze reproducible', async () => {
  const ui = await fixture({ open: false, title: 'Local adverts', theme: { accent: '#00ffaa' } });
  assert.equal(ui.window.document.querySelector('#devert-tab'), null);
  assert.equal(ui.root.querySelector('#devert-panel h2').textContent, 'Local adverts');
  assert.equal(ui.root.querySelector('.dvert-widget').style.getPropertyValue('--dvert-accent'), '#00ffaa');
  assert.match(ui.root.querySelector('style').textContent, /prefers-reduced-motion/);
  assert.equal(ui.window.document.getElementById('outside').getAttribute('style'), null);
  assert.equal(ui.root.querySelector('#devert-tab').getAttribute('aria-controls'), 'devert-panel');
  assert.equal(ui.root.querySelector('#devert-panel').getAttribute('aria-hidden'), 'true');
  ui.root.querySelector('#devert-info').click();
  const dialog = ui.root.querySelector('#devert-instructions');
  assert.equal(dialog.open, true);
  dialog.dispatchEvent(new ui.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  assert.equal(dialog.open, false);
  execFileSync(process.execPath, ['scripts/verify-source.mjs'], { cwd: new URL('..', import.meta.url) });
  const lock = JSON.parse(readFileSync(new URL('../source-lock.json', import.meta.url)));
  assert.ok(!Object.keys(lock.files).some(file => /radio-sync|djuke|ethers\.umd/.test(file)));
  await ui.close();
});
