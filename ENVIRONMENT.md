# Environment Variables Guide

## Required (Application)

These must be set in `.env.local` for local development and in Vercel for production.

### `NEXT_PUBLIC_SUPABASE_URL`

Supabase project URL.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
```

**Where to find:** Supabase Dashboard → Settings → API → Project URL

**Used by:** Client and server Supabase clients for auth and data access.

---

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase anonymous (public) key. Safe to expose in the browser — RLS protects data.

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

**Where to find:** Supabase Dashboard → Settings → API → `anon` `public` key

**Used by:** All Supabase client operations from the Next.js app.

---

### `NEXT_PUBLIC_APP_URL`

Public URL of your deployed app. **Required in production** so verification emails never point at `localhost`.

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Used by:** Sign-up and resend-verification email links (`/auth/callback`).

**Vercel:** Add under Project → Settings → Environment Variables for Production (and Preview if you test sign-up there). Must match Supabase **Site URL**.

---

## Local Development Only

### `DATABASE_URL`

PostgreSQL connection string for migration scripts (`npm run db:migrate`, `npm run db:phase*`).

```env
DATABASE_URL=postgresql://postgres.your-project-ref:YOUR_PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

**Where to find:** Supabase Dashboard → Settings → Database → Connection string → **Session pooler**

**Important:** Direct `db.*.supabase.co` hosts are IPv6-only. Use the Session pooler URI on IPv4 networks.

**Not required in Vercel** unless running migrations from CI.

---

### `DATABASE_PASSWORD` (optional)

Used by `npm run db:discover` to auto-build the pooler connection string.

```env
DATABASE_PASSWORD=your_database_password
```

Run:

```bash
npm run db:discover
```

---

## Auth verification email (Supabase + Resend)

Sign-up verification emails are sent by **Supabase Auth**, not the Next.js app. Configure them once for production:

| Step | Action |
|------|--------|
| 1 | Run `npm run resend:domain` (adds forebeyond.com to Resend and prints DNS records) |
| 2 | Set `RESEND_API_KEY` in `.env.local` from [resend.com/api-keys](https://resend.com/api-keys) |
| 3 | Run `npm run supabase:auth-email` (Resend domain check + Supabase SMTP from `hello@forebeyond.com`) |
| 4 | Set `NEXT_PUBLIC_APP_URL` to your production URL (must match Supabase Site URL) |

The setup script configures:

- **From:** `Fore Beyond <hello@forebeyond.com>` via Resend SMTP (`smtp.resend.com:465`)
- **Templates:** Branded confirmation, password reset, and magic-link emails in `supabase/email-templates/`
- **Confirmation required:** Users must verify email before signing in

For local dev without sending real email, use `npm run supabase:auth-skip-email-confirm` (disables confirmation on the hosted project). Re-enable with `npm run supabase:auth-confirm-email` or `npm run supabase:auth-email`.

---

## Transactional email (Resend)

Required for the **contact form**, **Help & Support**, and **host notification emails**.

| Variable | Required | Example |
|----------|----------|---------|
| `RESEND_API_KEY` | Yes | `re_...` from [resend.com/api-keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Yes | `Fore Beyond <hello@forebeyond.com>` (default if unset; domain must be verified in Resend) |
| `CONTACT_INBOX_EMAIL` | No | `forebeyond@gmail.com` — where contact form messages are delivered |

For testing before your domain is verified, override with `Fore Beyond <onboarding@resend.dev>` via `RESEND_FROM_EMAIL`.

**Vercel:** Project → Settings → Environment Variables → Production. Redeploy after adding or changing these.

---

## Stripe (stay service fee payments)

Required for travelers to pay the service fee (12% of stay total) when confirming a stay.

| Variable | Required | Example |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` | Yes | `sk_test_...` or `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | `pk_test_...` or `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes (prod) | `whsec_...` from webhook setup |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (webhook) | Supabase → Settings → API → `service_role` |

The service fee is **included in the stay total** — on a $100 stay the guest pays $12 at confirmation and $88 to the host.

Register the production webhook endpoint:

```bash
npm run stripe:webhook
```

This creates `https://your-app/api/webhooks/stripe` listening for `payment_intent.succeeded`. Copy the printed `STRIPE_WEBHOOK_SECRET` into `.env.local` and Vercel, then redeploy.

**Local testing** with [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the `whsec_...` secret printed by `stripe listen` as `STRIPE_WEBHOOK_SECRET` in `.env.local` while developing.

The webhook confirms stays if the browser disconnects after payment. The `/confirm` API route still works for the normal client flow.

### Customer records & receipt emails

On each service fee checkout, Fore Beyond:

- Creates or updates a **Stripe Customer** from the traveler's profile **email** and **full name**
- Sets **`receipt_email`** on the PaymentIntent to that same Fore Beyond email
- Saves `stripe_customer_id` on the traveler's profile for future payments

Enable branded Stripe receipts in the [Stripe Dashboard](https://dashboard.stripe.com/settings):

1. **Settings → Business → Branding** — upload logo, icon, and brand color (Fore Beyond forest green `#214E34` works well)
2. **Settings → Customer emails** — turn on **Successful payments** (and optionally **Refunds**)

Receipts are sent by Stripe only after a **successful** charge. Declined or incomplete payments do not send a receipt.

### Test cards (Stripe test mode)

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Generic decline |
| `4000 0000 0000 9995` | Insufficient funds |

Use any future expiry, any 3-digit CVC, and any postal code.

---

## Vercel Analytics

No environment variables required. Analytics activates automatically when:

1. `@vercel/analytics` is installed (included in the project)
2. `<Analytics />` is in the root layout (included)
3. Web Analytics is enabled in the Vercel project dashboard

Custom events are defined in `src/lib/analytics.ts` and tracked via `trackEvent()`.

---

## Admin Access

Admin dashboard access is controlled by the database, not environment variables.

To grant admin access, run in Supabase SQL Editor:

```sql
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

Optional: grant trust moderation without full admin:

```sql
UPDATE profiles SET is_trust_moderator = true WHERE email = 'your@email.com';
```

---

## Example `.env.local`

```env
# Supabase — required
NEXT_PUBLIC_SUPABASE_URL=https://pudfethylijrfilcihgp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Migrations — local only
DATABASE_URL=postgresql://postgres.pudfethylijrfilcihgp:YOUR_PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# Stripe — required for stay payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Copy from template and add your Resend key:

```bash
cp .env.example .env.local
# Edit .env.local — set RESEND_API_KEY=re_...
npm run supabase:auth-email
```

---

## Security Notes

| Variable | Expose to browser? |
|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (by design) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (RLS enforced) |
| `DATABASE_URL` | **Never** |
| `DATABASE_PASSWORD` | **Never** |
| `STRIPE_SECRET_KEY` | **Never** |
| `STRIPE_WEBHOOK_SECRET` | **Never** |
| `SUPABASE_SERVICE_ROLE_KEY` | **Never** (server-only webhook route) |

- Never commit `.env.local` to git (it is in `.gitignore`)
- Use the Supabase `service_role` key only in server-side routes (e.g. Stripe webhooks), never in client code
- Row Level Security is the primary data access control layer

---

## Vercel Environment Scopes

When adding variables in Vercel, set scopes appropriately:

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_APP_URL` | ✓ | ✓ (preview URL) | optional |
| `PLATFORM_ADMIN_EMAIL` | ✓ | optional | optional |
| `RESEND_API_KEY` | ✓ | optional | optional |
| `RESEND_FROM_EMAIL` | ✓ | optional | optional |
| `CONTACT_INBOX_EMAIL` | optional | optional | optional |
| `STRIPE_SECRET_KEY` | ✓ | optional | optional |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✓ | optional | optional |
| `STRIPE_WEBHOOK_SECRET` | ✓ | optional | optional |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | optional | optional |
| `DATABASE_URL` | CI only | CI only | Local only |

Use separate Supabase projects for production vs. staging when possible.
