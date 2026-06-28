# Deployment Guide

Deploy Fore Beyond to Vercel with Supabase as the backend.

## Prerequisites

- [Vercel](https://vercel.com) account
- [Supabase](https://supabase.com) project with migrations applied
- Git repository connected to Vercel

## 1. Prepare Supabase

Run all database migrations on your Supabase project:

```bash
npm run db:migrate
```

Or run bundled scripts through the Supabase SQL Editor (`supabase/setup-phase2.sql` through `setup-phase9.sql`).

Seed demo data (optional):

```bash
npm run db:seed
```

### Auth URL Configuration

In Supabase Dashboard → **Authentication** → **URL Configuration**:

| Setting | Production value |
|---------|------------------|
| **Site URL** | `https://your-app.vercel.app` (your real domain — **not** `http://localhost:3000`) |
| **Redirect URLs** | Add all of the following (one per line): |

```
https://your-app.vercel.app/auth/callback
https://your-app.vercel.app/auth/callback/**
https://your-app.vercel.app/auth/verify-email
https://*.vercel.app/auth/callback
https://*.vercel.app/auth/callback/**
https://*.vercel.app/auth/verify-email
```

If Site URL is still `localhost`, verification emails will redirect to `localhost` and **Safari on your phone cannot open them**.

In Vercel, set `NEXT_PUBLIC_APP_URL` to the same production URL (see [ENVIRONMENT.md](./ENVIRONMENT.md)).

## 2. Deploy to Vercel

### Option A — Vercel Dashboard

1. Import your Git repository at [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Next.js** (auto-detected)
3. Add environment variables (see [ENVIRONMENT.md](./ENVIRONMENT.md))
4. Deploy

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Follow prompts, then deploy to production:

```bash
vercel --prod
```

## 3. Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Required | Environments |
|----------|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Production, Preview, Development |

`DATABASE_URL` is only needed locally for migration scripts — do **not** expose it in Vercel unless running migrations from CI.

See [ENVIRONMENT.md](./ENVIRONMENT.md) for full details.

## 4. Enable Vercel Analytics

Analytics is included via `@vercel/analytics` in the root layout.

1. Open Vercel Dashboard → your project → **Analytics**
2. Enable **Web Analytics** for the project
3. Custom events appear under Analytics → Events after traffic flows

No additional environment variables are required for Vercel Analytics on Vercel-hosted deployments.

## 5. Post-Deploy Checklist

- [ ] Homepage loads at production URL
- [ ] Sign up / sign in works
- [ ] Supabase auth redirect URLs match production domain
- [ ] Search and family profiles load listings
- [ ] Images from Supabase storage and Unsplash render
- [ ] Analytics events appear in Vercel dashboard (may take a few minutes)
- [ ] Admin dashboard accessible for admin users at `/admin`

## 6. Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain and configure DNS
3. Update Supabase auth Site URL and redirect URLs to the custom domain

## 7. Preview Deployments

Each pull request gets a preview URL. Use the same Supabase project or a staging project:

- Point preview env vars to staging Supabase for isolated testing
- Or share production Supabase with caution (preview writes affect prod data)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| White screen locally | Stop dev server, run `rm -rf .next && npm run dev` |
| White screen on Vercel | Confirm both `NEXT_PUBLIC_*` env vars are set and redeploy |
| White screen after deploy | Run `npm run db:phase9` on Supabase if admin features were added |
| Auth redirect loop | Verify Site URL and redirect URLs in Supabase |
| `ENOTFOUND` on migrations | Use Session pooler URL (see ENVIRONMENT.md) |
| Images 500 error | Confirm Supabase storage URLs in `next.config.ts` |
| Admin 404 / no Admin nav | Run `npm run db:fix-admin`, sign in as `forejanelle@gmail.com`, and set `PLATFORM_ADMIN_EMAIL=forejanelle@gmail.com` in Vercel (optional if using default) |
| Analytics empty | Enable Web Analytics in Vercel; wait for traffic |

## CI Migration (Optional)

To run migrations in GitHub Actions before deploy:

```yaml
- run: npm run db:migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Store `DATABASE_URL` as a GitHub secret — never commit it.
