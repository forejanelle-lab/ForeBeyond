# Fore Beyond — Project Overview

## Mission

Fore Beyond helps travelers go beyond tourism through trusted local families, authentic cultural experiences, and meaningful human connection. Personal information stays protected until a stay request is approved.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 15 App                        │
│  Server Components + Client Components + Middleware      │
├─────────────────────────────────────────────────────────┤
│  Supabase Auth (SSR cookies)  │  Vercel Analytics       │
├─────────────────────────────────────────────────────────┤
│              Supabase PostgreSQL + RLS                   │
│  profiles · listings · experiences · stays · messages  │
│  reviews · reports · trust scores · notifications        │
└─────────────────────────────────────────────────────────┘
```

## Development Phases

| Phase | Feature | Key Routes |
|-------|---------|------------|
| 1 | Auth, onboarding, design system | `/auth/*`, `/onboarding/*` |
| 2 | Trust score, privacy, stay requests | `/trust-center`, `/settings/*` |
| 3 | Host listings, family profiles | `/families/[id]`, `/host/listings` |
| 4 | Search, saved families | `/search`, `/saved` |
| 5 | Experiences marketplace | `/experiences`, `/host/experiences` |
| 6 | Request stay flow, trips, payments | `/families/[id]/request`, `/trips` |
| 7 | Real-time messaging, notifications | `/messages`, `/notifications` |
| 8 | Reviews, trip completion, moderation | Trip reviews, `/trust-center/reviews` |
| 9 | Admin dashboard (internal) | `/admin/*` |
| 10 | Vercel Analytics, deployment docs | Analytics events, Vercel deploy |

## Trust Score (0–100)

Calculated in PostgreSQL via `calculate_trust_score()`:

| Factor | Max Points |
|--------|------------|
| Email verified | 10 |
| Phone verified | 10 |
| Government ID | 15 |
| Address verification | 10 |
| Video verification | 15 |
| Profile completion | 10 |
| Completed trips | 15 |
| Positive reviews | 15 |

## Data Model Highlights

- **profiles** — users with role, trust score, verification status, admin flags
- **host_listings** — family stay listings (draft/published/archived)
- **host_experiences** — marketplace experiences by category
- **stay_requests** — traveler requests gated until host approval
- **trips / stay_bookings** — approved stays with payment status
- **conversations / stay_messages** — messaging after approval
- **reviews** — post-trip mutual reviews with moderation
- **content_reports** — user reports for admin review
- **verification_documents** — identity verification workflow

## Admin Access

Admin features are internal-only:

1. Set `is_admin = true` on a profile in the database
2. Sign in as that user
3. Navigate to `/admin`

Demo host (`demo@forebeyond.demo`) is seeded as admin.

Admin capabilities:
- View all users and hosts
- Publish/archive listings
- Approve/reject verification documents
- Moderate reviews and reports
- Recalculate trust scores

## Analytics Events

Tracked via Vercel Analytics (`src/lib/analytics.ts`):

| Event | Trigger |
|-------|---------|
| Homepage View | `/` page load |
| Search | `/search` with filters |
| Family Profile View | `/families/[id]` |
| Experience View | `/experiences/[id]` |
| Request Start | `/families/[id]/request` |
| Request Submission | Stay request created |
| Traveler Signup | Profile complete as traveler |
| Host Signup | Profile complete as host |
| Verification Completion | Verification center finished |

## Key Libraries

| Path | Purpose |
|------|---------|
| `src/lib/supabase/` | Server/client Supabase clients, middleware |
| `src/lib/trust-score.ts` | Trust score UI constants |
| `src/lib/stay-approval.ts` | Host approve/decline stay requests |
| `src/lib/messaging.ts` | Chat helpers, read receipts |
| `src/lib/reviews.ts` | Review formatting and eligibility |
| `src/lib/admin.ts` | Admin auth guard, navigation |
| `src/lib/analytics.ts` | Vercel Analytics event names |

## Security Model

- Row Level Security on all sensitive tables
- PII hidden via `public_profiles` view until stay approved
- Moderation via `is_trust_moderator` and `is_admin` flags
- Admin routes return 404 (not 403) for non-admins
- Middleware protects authenticated routes; role checks in page/layout
