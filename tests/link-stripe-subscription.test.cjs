/* eslint-disable @typescript-eslint/no-require-imports -- Test harness loads the TypeScript route with mocked services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const bookingId = '11111111-1111-4111-8111-111111111111';
function fixture(options = {}) {
  const calls = { writes: [], stripe: 0 };
  const booking = { id: bookingId, accountId: 'parent', childId: 'child', status: 'active', bookingType: 'recreational', stripeCustomerId: null, stripeSubscriptionId: null, ...options.booking };
  const customer = { id: 'cus_parent', name: 'Parent', email: 'parent@example.com', metadata: {}, ...options.customer };
  const subscription = { metadata: {}, id: 'sub_test', status: 'active', customer, items: { data: [] }, cancel_at_period_end: false, ...options.subscription };
  const iterable = values => ({ async *[Symbol.asyncIterator]() { yield* values; } });
  class Stripe { constructor() {
    this.customers = { retrieve: async () => customer, list: () => iterable(options.customers ?? [customer]) };
    this.subscriptions = { retrieve: async () => { calls.stripe++; return subscription; }, list: () => iterable(options.subscriptions ?? [subscription]) };
  } }
  Stripe.errors = { StripeInvalidRequestError: class extends Error {} };
  const db = { from(table) {
    const query = { mutation: false, select() { return this; }, eq() { return this; }, neq() { return this; }, is() { return this; },
      update(value) { calls.writes.push(value); this.mutation = true; return this; },
      maybeSingle: async function () { return { data: this.mutation ? (options.stale ? null : { id: bookingId }) : table === 'Accounts' ? { id: 'parent', email: 'parent@example.com' } : booking, error: null }; },
      then(resolve) { return Promise.resolve({ data: options.linked ?? [], error: null }).then(resolve); },
    }; return query;
  } };
  const mocks = {
    stripe: { default: Stripe },
    '@/lib/admin': { supabaseAdmin: db },
    '@/lib/server/authRouteClient': { createAuthRouteClient: () => ({ supabase: { auth: { getUser: async () => ({ data: { user: options.signedOut ? null : { id: 'admin' } } }) } }, applyCookies: response => response }) },
    '@/lib/server/webAccountRole': { getWebAccountRoleForUser: async () => options.nonAdmin ? 'parent' : 'admin', isAdminRole: role => role === 'admin' },
  };
  const code = ts.transpileModule(fs.readFileSync('app/api/admin/link-stripe-subscription/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { process: { env: { LIVE_REC_STRIPE_SECRET_KEY: 'test' } }, console: { info() {}, error() {} } })(name => mocks[name] ?? require(name), mod, mod.exports);
  return { calls, post: (confirm = false, origin = 'https://gym.test', includeLinked = false) => mod.exports.POST(new NextRequest('https://gym.test/api/admin/link-stripe-subscription', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(confirm === 'list' ? { bookingId, action: 'list', includeLinked } : { bookingId, subscriptionId: 'sub_test', confirm }) })) };
}
test('preview never writes; confirmation saves both IDs', async () => {
  const f = fixture();
  const preview = await f.post(); assert.equal(preview.status, 200); assert.equal((await preview.json()).preview.customerId, 'cus_parent'); assert.equal(f.calls.writes.length, 0);
  assert.equal((await f.post(true)).status, 200); assert.equal(f.calls.writes[0].stripeSubscriptionId, 'sub_test'); assert.equal(f.calls.writes[0].stripeCustomerId, 'cus_parent');
});
for (const [name, options, status] of [
  ['signed out', { signedOut: true }, 401], ['non-admin', { nonAdmin: true }, 403],
  ['cancelled booking', { booking: { status: 'cancelled' } }, 409],
  ['existing link', { booking: { stripeSubscriptionId: 'sub_old' } }, 409],
  ['cancelled subscription', { subscription: { status: 'canceled' } }, 409],
  ['wrong customer', { customer: { email: 'other@example.com' } }, 409],
  ['conflicting account metadata despite matching email', { customer: { metadata: { accountId: 'other' } } }, 409],
  ['subscription linked to another account', { linked: [{ accountId: 'other', bookingType: 'recreational' }] }, 409],
]) test(`rejects ${name} without writing`, async () => { const f = fixture(options); assert.equal((await f.post(true)).status, status); assert.equal(f.calls.writes.length, 0); });
test('rejects a foreign request origin', async () => { const f = fixture(); assert.equal((await f.post(true, 'https://other.test')).status, 403); assert.equal(f.calls.stripe, 0); });
test('permits shared family subscription and displays other bookings', async () => {
  const f = fixture({ linked: [{ accountId: 'parent', bookingType: 'recreational', Children: { firstName: 'Sibling' }, Classes: { className: 'Tuesday' } }] });
  const result = await (await f.post()).json(); assert.match(result.preview.linkedBookings[0], /Sibling/); assert.equal((await f.post(true)).status, 200);
});
test('reports a booking changed during confirmation', async () => { const f = fixture({ stale: true }); assert.equal((await f.post(true)).status, 409); });
test('confirmation rechecks Stripe ownership after preview', async () => {
  const customer = { id: 'cus_parent', name: 'Parent', email: 'parent@example.com', metadata: {} };
  const f = fixture({ subscription: { customer } });
  assert.equal((await f.post()).status, 200);
  customer.email = 'someone-else@example.com';
  assert.equal((await f.post(true)).status, 409);
  assert.equal(f.calls.writes.length, 0);
});

test('list returns eligible subscriptions without writing', async () => {
  const f = fixture(); const response = await f.post('list');
  assert.equal(response.status, 200); const result = await response.json();
  assert.equal(result.subscriptions.length, 1); assert.equal(result.subscriptions[0].id, 'sub_test');
  assert.equal(f.calls.writes.length, 0);
});
test('list excludes customers with conflicting ownership', async () => {
  const f = fixture({ customer: { metadata: { accountId: 'other' } } });
  assert.equal((await (await f.post('list')).json()).subscriptions.length, 0);
});
test('list excludes cancelled subscriptions', async () => {
  const f = fixture({ subscription: { status: 'canceled' } });
  assert.equal((await (await f.post('list')).json()).subscriptions.length, 0);
});
test('list is restricted to admins', async () => {
  const f = fixture({ nonAdmin: true }); assert.equal((await f.post('list')).status, 403);
});
test('list can find a customer through booking history when email lookup is empty', async () => {
  const f = fixture({ customers: [], linked: [{ stripeCustomerId: 'cus_parent' }] });
  assert.equal((await (await f.post('list')).json()).subscriptions.length, 1);
});

const activeSiblingLink = { stripeSubscriptionId: 'sub_test', stripeCustomerId: 'cus_parent', status: 'active', Children: { firstName: 'Amelia', lastName: 'King' }, Classes: { className: 'Wednesday 6:30pm' } };
test('list hides subscriptions with active booking links by default', async () => {
  const f = fixture({ linked: [activeSiblingLink] });
  const response = await f.post('list'); assert.equal(response.status, 200);
  const result = await response.json(); assert.equal(result.subscriptions.length, 0); assert.equal(result.hiddenLinkedCount, 1);
  assert.equal(f.calls.writes.length, 0);
});
test('include linked option returns student and class labels', async () => {
  const f = fixture({ linked: [activeSiblingLink] });
  const result = await (await f.post('list', 'https://gym.test', true)).json();
  assert.equal(result.subscriptions.length, 1); assert.equal(result.hiddenLinkedCount, 0);
  assert.equal(result.subscriptions[0].linkedBookings[0], 'Amelia King - Wednesday 6:30pm');
});
test('cancelled booking links do not hide an otherwise eligible subscription', async () => {
  const f = fixture({ linked: [{ ...activeSiblingLink, status: 'cancelled' }] });
  const result = await (await f.post('list')).json();
  assert.equal(result.subscriptions.length, 1); assert.equal(result.subscriptions[0].linkedBookings.length, 0);
});
test('hiding linked choices preserves the unlinked choice', async () => {
  const unlinked = { id: 'sub_unlinked', metadata: {}, status: 'active', items: { data: [] } };
  const f = fixture({ linked: [activeSiblingLink], subscriptions: [{ ...unlinked, id: 'sub_test' }, unlinked] });
  const result = await (await f.post('list')).json();
  assert.equal(result.subscriptions.length, 1); assert.equal(result.subscriptions[0].id, 'sub_unlinked');
  assert.equal(result.hiddenLinkedCount, 1);
});
