import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface StripeCustomerIdentity {
  customerId: string;
  email: string;
  name: string | null;
}

function isMissingStripeCustomer(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "resource_missing"
  );
}

export async function ensureStripeCustomer(
  stripe: Stripe,
  supabase: SupabaseClient,
  userId: string,
  authEmail: string
): Promise<StripeCustomerIdentity> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, full_name, stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found.");
  }

  const email = (profile.email?.trim() || authEmail.trim()).toLowerCase();
  const name = profile.full_name?.trim() || null;

  if (!email) {
    throw new Error("A verified email is required before payment.");
  }

  const customerPayload: Stripe.CustomerCreateParams = {
    email,
    name: name ?? undefined,
    metadata: {
      forebeyond_user_id: userId,
    },
  };

  let customerId = profile.stripe_customer_id?.trim() || null;

  if (customerId) {
    try {
      await stripe.customers.update(customerId, customerPayload);
      return { customerId, email, name };
    } catch (error) {
      if (!isMissingStripeCustomer(error)) throw error;
      customerId = null;
    }
  }

  const customer = await stripe.customers.create(customerPayload);
  customerId = customer.id;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId);

  if (updateError) {
    console.error("Failed to persist stripe_customer_id:", updateError.message);
  }

  return { customerId, email, name };
}
