/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node maintenance command. */
const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Never infer a child's identity from a parent's email alone.
function planMetadata(rows, subscription) {
  const children = new Set(rows.map(row => row.childId));
  const accounts = new Set(rows.map(row => row.accountId));
  if (children.size !== 1 || accounts.size !== 1 || !rows[0].childId || !rows[0].accountId) return { skip: 'ambiguous booking links' };
  const row = rows[0];
  const child = Array.isArray(row.Children) ? row.Children[0] : row.Children;
  if (!child?.firstName?.trim() || !child?.lastName?.trim()) return { skip: 'missing student name' };
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  if (rows.some(item => !item.stripeCustomerId || item.stripeCustomerId !== customerId)) return { skip: 'customer mismatch' };
  if (!['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)) return { skip: 'subscription no longer current' };
  const expected = { childId: row.childId, accountId: row.accountId, bookingType: row.bookingType };
  if (Object.entries(expected).some(([key, value]) => subscription.metadata[key] && subscription.metadata[key] !== value)) return { skip: 'conflicting Stripe metadata' };
  const metadata = { ...expected, childFirstName: child.firstName.trim().slice(0, 500), childLastName: child.lastName.trim().slice(0, 500) };
  const changes = Object.fromEntries(Object.entries(metadata).filter(([key, value]) => subscription.metadata[key] !== value));
  if (Object.keys(subscription.metadata).length + Object.keys(changes).filter(key => !(key in subscription.metadata)).length > 50) return { skip: 'metadata key limit' };
  return Object.keys(changes).length ? { metadata: changes } : { skip: 'already up to date' };
}

async function main() {
  loadEnvConfig(process.cwd());
  const apply = process.argv.includes('--apply');
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const result = await db.from('Bookings').select('id,childId,accountId,bookingType,status,stripeCustomerId,stripeSubscriptionId,Children(firstName,lastName)')
      .in('bookingType', ['recreational', 'competition']).not('stripeSubscriptionId', 'is', null).order('id').range(from, from + 999);
    if (result.error) throw result.error;
    rows.push(...result.data);
    if (result.data.length < 1000) break;
  }
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.bookingType}:${row.stripeSubscriptionId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const summary = { mode: apply ? 'apply' : 'dry-run', candidates: 0, updated: 0, skipped: {}, errors: 0, unlinkedActiveBookings: 0 };
  const { count, error } = await db.from('Bookings').select('id', { count: 'exact', head: true })
    .in('bookingType', ['recreational', 'competition']).eq('status', 'active').is('stripeSubscriptionId', null);
  if (error) throw error;
  summary.unlinkedActiveBookings = count;
  for (const group of groups.values()) {
    if (!group.some(row => row.status === 'active')) continue;
    const row = group[0];
    const key = row.bookingType === 'recreational' ? process.env.LIVE_REC_STRIPE_SECRET_KEY : process.env.LIVE_COMP_STRIPE_SECRET_KEY;
    try {
      if (!key) throw new Error('Stripe programme key is not configured');
      const stripe = new Stripe(key, { apiVersion: '2026-01-28.clover' });
      const subscription = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
      const plan = planMetadata(group, subscription);
      if (plan.skip) { summary.skipped[plan.skip] = (summary.skipped[plan.skip] ?? 0) + 1; continue; }
      summary.candidates++;
      if (apply) {
        // Send only changed metadata keys; Stripe preserves unrelated metadata.
        await stripe.subscriptions.update(subscription.id, { metadata: plan.metadata });
        summary.updated++;
      }
    } catch (error) {
      summary.errors++;
      console.error(JSON.stringify({ subscriptionId: row.stripeSubscriptionId, error: error.code || error.message }));
    }
  }
  console.log(JSON.stringify(summary, null, 2));
  if (summary.errors) process.exitCode = 1;
}
module.exports = { planMetadata };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
