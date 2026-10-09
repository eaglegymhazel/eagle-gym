/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { planMetadata } = require('../scripts/backfill-stripe-student-metadata.cjs');
const row = { childId: 'child', accountId: 'parent', bookingType: 'recreational', stripeCustomerId: 'cus_parent', Children: { firstName: ' Miley ', lastName: ' King ' } };
const subscription = { customer: 'cus_parent', status: 'active', metadata: { externalReference: 'keep-me' } };
test('backfill adds student identity without sending unrelated metadata', () => {
  assert.deepEqual(planMetadata([row], subscription).metadata, { childId: 'child', accountId: 'parent', bookingType: 'recreational', childFirstName: 'Miley', childLastName: 'King' });
});
for (const [name, rows, sub] of [
  ['multiple children', [row, { ...row, childId: 'sibling' }], subscription],
  ['multiple accounts', [row, { ...row, accountId: 'other' }], subscription],
  ['wrong customer', [row], { ...subscription, customer: 'cus_other' }],
  ['conflicting metadata', [row], { ...subscription, metadata: { childId: 'other' } }],
  ['missing names', [{ ...row, Children: { firstName: 'Miley', lastName: null } }], subscription],
  ['cancelled subscription', [row], { ...subscription, status: 'canceled' }],
]) test(`backfill skips ${name}`, () => assert.ok(planMetadata(rows, sub).skip));
test('backfill is idempotent', () => {
  const metadata = planMetadata([row], subscription).metadata;
  assert.equal(planMetadata([row], { ...subscription, metadata }).skip, 'already up to date');
});
test('backfill protects the metadata key limit', () => {
  const metadata = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`key${i}`, 'value']));
  assert.equal(planMetadata([row], { ...subscription, metadata }).skip, 'metadata key limit');
});
for (const programme of ['recreational', 'competition']) test(`${programme} checkout sends names and references to session and subscription`, () => {
  const source = ts.createSourceFile('route.ts', fs.readFileSync(`app/api/checkout/${programme}/route.ts`, 'utf8'), ts.ScriptTarget.Latest, true);
  let initializer; let config;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'bookingMetadata') initializer = node.initializer.getText(source);
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'stripe.checkout.sessions.create') config = node.arguments[0];
    ts.forEachChild(node, visit);
  }
  visit(source);
  const metadata = vm.runInNewContext(`(${initializer})`, { child: { firstName: ' Miley ', lastName: ' King ' }, childId: 'child', draftRecord: { childId: 'child' }, bookingContext: { accountId: 'parent' }, bookingGroupId: 'group', quantity: 2, uniqueClassIds: ['class'], pricingTier: 'standard', selections: ['class'], totalHours: 2, priceId: 'price', draftId: 'draft' });
  assert.equal(metadata.childFirstName, 'Miley'); assert.equal(metadata.childLastName, 'King'); assert.equal(metadata.childId, 'child'); assert.equal(metadata.bookingType, programme);
  assert.equal(config.properties.find(p => p.name?.getText(source) === 'metadata').initializer.getText(source), 'bookingMetadata');
  assert.equal(config.properties.find(p => p.name?.getText(source) === 'subscription_data').initializer.properties[0].initializer.getText(source), 'bookingMetadata');
});
