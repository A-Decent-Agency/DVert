import { initDevertTab } from './vendor/busking/js/devert-tab.mjs';
import { initDevertPaidQueue } from './vendor/busking/js/devert-paid-queue.mjs';
import { initDevertHistory } from './vendor/busking/js/devert-history.mjs';
import { claimDevertRefund, devertQueueAbi } from './vendor/busking/js/devert-queue.mjs?v=20261017-mercury-release';
import { panel } from './vendor/busking/panel.mjs';
import { styles } from './vendor/busking/styles.mjs';
import { widgetStyles } from './widget-styles.js';
import { submitDvertMedia } from './media-submission.js';

export { claimDevertRefund };
export const identity = 'DVert.decentagency.eth';
export const defaults = Object.freeze({
  serviceUrl: 'https://decentbusking.onrender.com',
  campaignAddress: '0x135Cbc573F87637158eb3186C87c584fb0B34CD9',
  queueAddress: '0xe54609f022A8D760417E7cc0Eea6360b6E1D11Bb',
  gateway: 'https://gateway.pinata.cloud/ipfs/',
});
const instances = new WeakMap();
const ownedRoots = new WeakSet();

function serviceUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new Error('DVert service must use HTTPS (or loopback HTTP for development)');
  }
  if (url.username || url.password || url.search || url.hash) throw new Error('Do not put credentials or query strings in the DVert service URL');
  return url.href.replace(/\/$/, '');
}

export function mount(element, options = {}) {
  if (!element?.attachShadow || !element.ownerDocument) throw new TypeError('mount requires a DOM element');
  if (instances.has(element)) throw new Error('DVert is already mounted here; destroy it before mounting again');
  const config = Object.freeze({
    ipfsUploadServiceUrl: serviceUrl(options.serviceUrl ?? defaults.serviceUrl),
    devertContractAddress: options.campaignAddress ?? defaults.campaignAddress,
    devertQueueContractAddress: options.queueAddress ?? defaults.queueAddress,
    ipfsGateway: serviceUrl(options.gateway ?? defaults.gateway) + '/',
  });
  for (const address of [config.devertContractAddress, config.devertQueueContractAddress]) {
    if (!/^0x[0-9a-f]{40}$/i.test(address)) throw new Error('DVert requires explicit valid Base campaign and queue addresses');
  }
  if (element.shadowRoot && !ownedRoots.has(element.shadowRoot)) throw new Error('The mount element already has another ShadowRoot');
  const ownerDocument = element.ownerDocument;
  const host = ownerDocument.defaultView;
  const root = element.shadowRoot || element.attachShadow({ mode: 'open' });
  ownedRoots.add(root);
  const lifecycle = new host.AbortController();
  const timers = new Map();
  const cleanups = [];
  let destroyed = false;
  let head;
  let sharedWallet;
  let walletGeneration = 0;
  let wallet = null;
  let refundBusy = false;
  const controllers = [];
  const style = ownerDocument.createElement('style');
  style.textContent = `${styles}\n${widgetStyles}`;
  const shell = ownerDocument.createElement('section');
  shell.className = 'dvert-widget';
  shell.setAttribute('aria-label', options.label || 'DVert advertising widget');
  shell.innerHTML = `<p class="dvert-identity"></p><p class="dvert-session" role="status" aria-live="polite"></p>${panel}`;
  root.replaceChildren(style, shell);
  const byId = id => root.getElementById(id);
  shell.querySelector('.dvert-identity').textContent = identity;
  const sessionStatus = shell.querySelector('.dvert-session');
  byId('devert-panel').querySelector('h2').textContent = options.title || 'DVert';
  const theme = { accent: '--dvert-accent', background: '--dvert-background', text: '--dvert-text', maxWidth: '--dvert-max-width' };
  for (const [key, variable] of Object.entries(theme)) {
    if (options.theme?.[key]) shell.style.setProperty(variable, String(options.theme[key]));
  }
  const consent = ownerDocument.createElement('label');
  consent.className = 'dvert-upload-consent';
  const checkbox = ownerDocument.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'dvert-upload-consent';
  consent.append(checkbox, ownerDocument.createTextNode(' I consent to uploading this media publicly to IPFS and submitting it for review. Public copies may remain permanently retrievable.'));
  byId('devert-ad-queue').before(consent);
  const uploadNotice = ownerDocument.createElement('p');
  uploadNotice.className = 'devert-checkout-status';
  uploadNotice.textContent = typeof options.uploadMedia === 'function'
    ? 'Binary media upload is provided by this host; review its provider and privacy settings in the shared header.'
    : 'This host has not provided binary media upload. Existing approved advert campaigns and paid queue remain available.';
  consent.before(uploadNotice);

  const refund = ownerDocument.createElement('details');
  refund.className = 'devert-disclosure';
  refund.innerHTML = `<summary>Removal refund recovery</summary><p>Only the paying wallet can claim an unplayed request after its campaign is removed. Campaign purchases themselves are not refundable.</p><form><label>Paid request ID<input name="requestId" type="text" inputmode="numeric" pattern="[0-9]+" required></label><button type="submit">Claim eligible refund</button></form><p role="status" aria-live="polite"></p>`;
  byId('devert-history').after(refund);
  refund.querySelector('button').disabled = true;
  const emit = (type, detail) => {
    if (!destroyed) root.dispatchEvent(new host.CustomEvent(type, { detail }));
  };
  const scopedDocument = {
    getElementById: byId,
    createElement: ownerDocument.createElement.bind(ownerDocument),
    body: shell,
    addEventListener: root.addEventListener.bind(root),
    dispatchEvent: root.dispatchEvent.bind(root),
  };
  const listen = (target, type, callback, listenerOptions = {}) => target?.addEventListener(type, callback, {
    ...(typeof listenerOptions === 'boolean' ? { capture: listenerOptions } : listenerOptions),
    signal: lifecycle.signal,
  });
  const scopeFetch = (url, init = {}) => {
    if (destroyed) return Promise.reject(new Error('DVert was destroyed'));
    return host.fetch(url, { ...init, signal: host.AbortSignal.any([lifecycle.signal, ...(init.signal ? [init.signal] : [])]) });
  };
  const schedule = (repeat, callback, delay) => {
    if (destroyed) return undefined;
    const id = (repeat ? host.setInterval : host.setTimeout)(() => {
      if (!repeat) timers.delete(id);
      if (!destroyed) callback();
    }, delay);
    timers.set(id, repeat);
    return id;
  };
  const clearTimer = id => {
    host.clearTimeout(id);
    host.clearInterval(id);
    timers.delete(id);
  };
  function assertWallet(expected) {
    if (destroyed) throw new Error('DVert was destroyed; inspect any pending transaction before retrying');
    const current = sharedWallet?.snapshot();
    if (!current?.connected || !current.provider || !current.address) throw new Error('Connect your wallet using the host DecentHead header first');
    if (Number(current.chainId) !== 8453) throw new Error('Switch to Base using the host header first');
    if (expected && (current.address.toLowerCase() !== expected.address.toLowerCase() || current.provider !== expected.provider)) {
      throw new Error('Host wallet changed; inspect pending transactions before retrying');
    }
    return current;
  }
  async function getSigner() {
    const snapshot = assertWallet();
    const ethers = options.ethers || host.ethers;
    if (typeof ethers?.Contract !== 'function' || typeof ethers?.JsonRpcSigner !== 'function') {
      throw new Error('Host must provide ethers v6 Contract and JsonRpcSigner for wallet actions');
    }
    // JsonRpcSigner does not call eth_requestAccounts, unlike BrowserProvider.getSigner.
    const raw = new ethers.JsonRpcSigner(snapshot.provider, snapshot.address);
    const signer = new Proxy(raw, {
      get(target, property) {
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? (...args) => {
          assertWallet(snapshot);
          return value.apply(target, args);
        } : value;
      },
    });
    assertWallet(snapshot);
    wallet.signer = signer;
    return signer;
  }
  const localWindow = {
    DecentConfig: config,
    get _wallet() { return wallet; },
    location: host.location,
    confirm: host.confirm.bind(host),
  };
  const radio = options.radio || {
    canSetDevertListenMode: () => true,
    getRadioStateSnapshot: () => null,
    setDevertListenMode: () => true,
    formatMainRadioAdCountdown: () => 'Playback scheduling is provided by the configured Busking worker.',
  };
  const environment = {
    document: scopedDocument, window: localWindow,
    ethers: { get Contract() { return (options.ethers || host.ethers)?.Contract; } },
    fetch: scopeFetch, listen, radio, getSigner, destroyed: () => destroyed,
    setTimeout: (callback, delay) => schedule(false, callback, delay),
    setInterval: (callback, delay) => schedule(true, callback, delay),
    clearTimeout: clearTimer, clearInterval: clearTimer,
    onConfirmed: payment => {
      if (destroyed) return;
      element.dispatchEvent(new host.CustomEvent('dvert:payment-confirmed', { detail: payment }));
    },
    submitMedia: request => submitDvertMedia({ ...request, signal: lifecycle.signal }),
    uploadMedia: async (file, context) => {
      if (!checkbox.checked) throw new Error('Check public IPFS upload consent before submitting media');
      if (typeof options.uploadMedia !== 'function') throw new Error('Binary media upload is not supported by this host; DecentHead JSON backup upload cannot accept audio or video');
      const snapshot = assertWallet();
      const session = head?.getIpfs?.();
      if (!session) throw new Error('The shared DecentHead IPFS session is unavailable');
      const result = await options.uploadMedia(file, { ...context, session, wallet: sharedWallet,
        signer: wallet.signer, signal: lifecycle.signal, serviceUrl: config.ipfsUploadServiceUrl });
      assertWallet(snapshot);
      return result;
    },
  };
  controllers.push(initDevertTab(environment), initDevertPaidQueue(environment), initDevertHistory(environment));
  listen(byId('devert-instructions'), 'keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      byId('devert-instructions').close();
    }
  });

  function syncWallet(state = sharedWallet?.snapshot()) {
    walletGeneration++;
    wallet = state?.connected && state.provider && state.address
      ? { address: state.address, chainId: Number(state.chainId), signer: { availableOnUserAction: true } } : null;
    refund.querySelector('button').disabled = refundBusy || !wallet || wallet.chainId !== 8453;
    sessionStatus.textContent = wallet
      ? `${state.ensName || wallet.address} · ${wallet.chainId === 8453 ? 'Base' : 'switch to Base in the host header'}. No separate DVert login.`
      : 'Read-only. Connect a Base wallet using the host DecentHead header for campaign and queue actions.';
    emit(wallet ? 'wallet-connected' : 'wallet-disconnected');
  }
  function attachHead(candidate) {
    if (destroyed || head || !candidate?.getWallet || !candidate?.on) return;
    head = candidate;
    sharedWallet = head.getWallet();
    const off = head.on('wallet', syncWallet);
    if (typeof off !== 'function') throw new Error('DecentHead wallet subscription must return an unsubscribe function');
    cleanups.push(off);
    syncWallet();
  }
  sessionStatus.textContent = 'Read-only. Waiting for the host DecentHead session; no second wallet connection is created.';
  listen(host, 'decenthead:ready', () => attachHead(options.head || host.DecentHead));
  attachHead(options.head || host.DecentHead);
  if (typeof radio.subscribe === 'function') {
    const off = radio.subscribe(state => emit('dbusk-radio-state', state));
    if (typeof off === 'function') cleanups.push(off);
  }
  listen(refund.querySelector('form'), 'submit', async event => {
    event.preventDefault();
    if (refundBusy) return;
    refundBusy = true;
    const button = refund.querySelector('button');
    const status = refund.querySelector('[role=status]');
    button.disabled = true;
    const check = walletGeneration;
    try {
      const signer = await getSigner();
      const ethers = options.ethers || host.ethers;
      const queue = new ethers.Contract(config.devertQueueContractAddress, devertQueueAbi(2), signer);
      const txHash = await claimDevertRefund({
        signer, queue, requestId: refund.querySelector('input').value,
        onStep(message) {
          if (destroyed || walletGeneration !== check) throw new Error('Wallet changed or widget closed; check pending transactions before retrying');
          status.textContent = message;
        },
      });
      if (!destroyed) status.textContent = `Refund confirmed: ${txHash}`;
    } catch (error) { if (!destroyed) status.textContent = error.shortMessage || error.message; }
    finally { refundBusy = false; button.disabled = false; }
  });
  if (options.open !== false) {
    byId('devert-tab').setAttribute('aria-expanded', 'true');
    byId('devert-tab').setAttribute('aria-label', 'Close DVert advertising');
    byId('devert-panel').classList.add('is-open');
    byId('devert-panel').setAttribute('aria-hidden', 'false');
    byId('devert-panel').inert = false;
    for (const controller of controllers) controller?.refresh?.();
  }
  const controller = Object.freeze({
    refresh() { if (!destroyed) for (const item of controllers) item?.refresh?.(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      walletGeneration++;
      lifecycle.abort();
      for (const item of controllers) item?.destroy?.();
      for (const id of timers.keys()) clearTimer(id);
      for (const cleanup of cleanups.splice(0)) cleanup();
      wallet = null;
      sharedWallet = null;
      root.replaceChildren(ownerDocument.createElement('slot'));
      instances.delete(element);
    },
  });
  instances.set(element, controller);
  return controller;
}
