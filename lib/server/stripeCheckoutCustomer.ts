import "server-only";

import Stripe from "stripe";

type GetOrCreateStripeCheckoutCustomerArgs = {
  stripe: Stripe;
  email: string;
  accountId: string;
  fullName?: string | null;
  existingCustomerId?: string | null;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function getOrCreateStripeCheckoutCustomer({
  stripe,
  email,
  accountId,
  fullName,
  existingCustomerId,
}: GetOrCreateStripeCheckoutCustomerArgs): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = fullName?.trim() || undefined;

  if (existingCustomerId) {
    const existingCustomer = await stripe.customers.retrieve(existingCustomerId);
    if (!("deleted" in existingCustomer) || existingCustomer.deleted !== true) {
      const currentEmail = existingCustomer.email
        ? normalizeEmail(existingCustomer.email)
        : null;
      const currentName = existingCustomer.name?.trim() || null;
      const currentAccountId = existingCustomer.metadata?.accountId ?? null;

      if (
        currentEmail !== normalizedEmail ||
        currentName !== (trimmedName ?? null) ||
        currentAccountId !== accountId
      ) {
        await stripe.customers.update(existingCustomer.id, {
          email,
          name: trimmedName,
          metadata: {
            ...existingCustomer.metadata,
            accountId,
          },
        });
      }

      return existingCustomer.id;
    }
  }

  const listedCustomers = await stripe.customers.list({
    email,
    limit: 10,
  });

  const matchedCustomer =
    listedCustomers.data.find((customer) => normalizeEmail(customer.email ?? "") === normalizedEmail) ??
    null;

  if (matchedCustomer) {
    const currentName = matchedCustomer.name?.trim() || null;
    const currentAccountId = matchedCustomer.metadata?.accountId ?? null;
    if (currentName !== (trimmedName ?? null) || currentAccountId !== accountId) {
      await stripe.customers.update(matchedCustomer.id, {
        name: trimmedName,
        metadata: {
          ...matchedCustomer.metadata,
          accountId,
        },
      });
    }

    return matchedCustomer.id;
  }

  const createdCustomer = await stripe.customers.create({
    email,
    name: trimmedName,
    metadata: {
      accountId,
    },
  });

  return createdCustomer.id;
}
