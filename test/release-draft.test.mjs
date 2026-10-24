import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const json = file => JSON.parse(readFileSync(new URL(`../releases/v0.1.0-draft/${file}`, import.meta.url)));

test('supporter/ENS preparation records requested terms without inventing release evidence', () => {
  const inputs = json('supporter-inputs.json');
  const metadata = json('metadata.draft.json');
  const evidence = json('supporter-evidence.draft.json');
  assert.equal(inputs.editions, 1000);
  assert.equal(inputs.chainId, 8453);
  assert.equal(inputs.unitPrice.units, '10000000');
  assert.equal(inputs.royalty.basisPoints, 1000);
  assert.equal(inputs.creatorIdentity, 'thejollylama.eth');
  assert.equal(inputs.displayIdentity, 'DVert.decentagency.eth');
  assert.equal(inputs.ens.ownershipVerified, false);
  assert.equal(inputs.ens.transactionHash, null);
  assert.equal(inputs.tokenId, null);
  assert.equal(inputs.listingId, null);
  assert.equal(metadata.image, null);
  assert.equal(metadata.animation_url, null);
  assert.equal(metadata.fee_recipient, null);
  assert.equal(evidence.status, 'unminted-unreleased');
  assert.equal(evidence.stockVerified, false);
  assert.equal(evidence.listingVerified, false);
  assert.deepEqual(evidence.transactionReceipts, []);
});
