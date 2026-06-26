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
```

Copy from template:

```bash
cp .env.example .env.local
```

---

## Security Notes

| Variable | Expose to browser? |
|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (by design) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (RLS enforced) |
| `DATABASE_URL` | **Never** |
| `DATABASE_PASSWORD` | **Never** |

- Never commit `.env.local` to git (it is in `.gitignore`)
- Never use the Supabase `service_role` key in the Next.js app
- Row Level Security is the primary data access control layer

---

## Vercel Environment Scopes

When adding variables in Vercel, set scopes appropriately:

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_APP_URL` | ✓ | ✓ (preview URL) | optional |
| `DATABASE_URL` | CI only | CI only | Local only |

Use separate Supabase projects for production vs. staging when possible.
