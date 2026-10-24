import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const json = file => JSON.parse(readFileSync(new URL(`../releases/v0.1.0-draft/${file}`, import.meta.url)));
const text = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('supporter callers share immutable DecentHead pin and announcements default off', () => {
  const sha = '3b2a72f7f8c49fb2af89ea7df2ead8e338e0e870';
  for (const [file, workflow] of [['supporter-release.yml', 'prepare'], ['supporter-announce.yml', 'announce']]) {
    const caller = text(`.github/workflows/${file}`);
    assert.ok(caller.includes(`product-supporter-${workflow}.yml@${sha}`));
    assert.ok(caller.includes(`head_ref: ${sha}`));
    assert.ok(!caller.includes('secrets: inherit'));
  }
  assert.ok(text('.github/workflows/supporter-announce.yml').includes("if: ${{ vars.SUPPORTER_DISCORD_ENABLED == 'true' }}"));
  assert.ok(text('.github/workflows/supporter-release.yml').includes('product_name: DVert'));
});

test('release root renders the actual widget rather than a supporter-card landing page', () => {
  assert.match(text('index.html'), /import \{ mount \} from '\.\/widget\.js'/);
  assert.match(text('index.html'), /widget = mount\(element/);
  assert.match(text('index.html'), /id="advertising"/);
  assert.equal(text('index.html'), text('widget.html'));
});

test('supporter/ENS preparation records requested terms without inventing release evidence', () => {
  const inputs = json('supporter-inputs.json');
  const metadata = json('metadata.draft.json');
  const evidence = json('supporter-evidence.draft.json');
  assert.equal(inputs.editions, 1000);
  assert.equal(inputs.chainId, 8453);
  assert.equal(inputs.unitPrice.units, '10000000');
  assert.equal(inputs.royalty.basisPoints, 1000);
  assert.equal(inputs.royalty.recipientIdentity, 'decentagency.eth');
  assert.equal(inputs.royalty.recipient, '0xcAeEd8422fB5682C298B7F0971906d446fFd4e7a');
  assert.equal(inputs.royalty.recipientVerified, true);
  assert.equal(inputs.royalty.verification.block, 26262074);
  assert.equal(inputs.primarySalesRouting.status, 'unconfirmed');
  assert.equal(inputs.primarySalesRouting.recipient, null);
  assert.equal(inputs.nftAdminPlan.currentlyAgencyAdmin, false);
  assert.equal(inputs.nftAdminPlan.revokeExistingAdmin, false);
  assert.equal(inputs.nftAdminPlan.status, 'unsigned-not-executed');
  assert.deepEqual(inputs.distributionModes, ['hosted-service-embed', 'documented-independent-deployment']);
  assert.match(inputs.publicationGate, /Wallet signatures remain paused/);
  assert.equal(inputs.creatorIdentity, 'thejollylama.eth');
  assert.equal(inputs.displayIdentity, 'DVert.decentagency.eth');
  assert.equal(inputs.ens.ownershipVerified, false);
  assert.equal(inputs.ens.transactionHash, null);
  assert.equal(inputs.tokenId, null);
  assert.equal(inputs.listingId, null);
  assert.equal(metadata.image, null);
  assert.equal(metadata.animation_url, null);
  assert.equal(metadata.fee_recipient, inputs.royalty.recipient);
  assert.equal(evidence.status, 'unminted-unreleased');
  assert.equal(evidence.stockVerified, false);
  assert.equal(evidence.listingVerified, false);
  assert.deepEqual(evidence.transactionReceipts, []);
});
