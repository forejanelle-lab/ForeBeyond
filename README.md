# Fore Beyond

**Travel deeper. Belong anywhere.**

Fore Beyond is a trust-first cultural immersion platform connecting travelers with verified local host families for authentic stays and experiences.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add Supabase keys to .env.local
npm run db:phase9
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production: [https://fore-beyond.vercel.app](https://fore-beyond.vercel.app)

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT.md](./PROJECT.md) | Architecture, features, and phase overview |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel deployment guide |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Environment variables reference |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Database & Auth:** Supabase (PostgreSQL + RLS)
- **Analytics:** Vercel Analytics
- **Language:** TypeScript

## Platform Features

### Core
- Homepage, search, family profiles, experiences marketplace
- Authentication, onboarding (traveler/host), verification center
- Trust score system (0–100) with badges and breakdown

### Stays & Messaging
- Request stay flow with host approval
- Real-time messaging (post-approval), read receipts, image uploads
- Trip lifecycle, payments placeholder, reviews after completion

### Trust & Reviews
- Multi-step verification workflows
- Mutual post-trip reviews with moderation
- Trust score integration from reviews and completed trips

### Admin (internal)
- Admin dashboard at `/admin` (requires `is_admin` flag)
- Manage users, hosts, listings, verifications, reviews, reports, trust scores

## Database Migrations

Run all migrations:

```bash
npm run db:migrate
```

Or run phase bundles individually:

```bash
npm run db:phase2   # Trust & privacy
npm run db:phase3   # Listings
npm run db:phase4   # Search & favorites
npm run db:phase5   # Experiences
npm run db:phase6   # Stay request flow
npm run db:phase7   # Messaging
npm run db:phase8   # Reviews
npm run db:phase9   # Admin dashboard
npm run db:seed     # Demo data
```

## Brand Colors

| Name | Hex |
|------|-----|
| Forest Green | `#214E34` |
| Sage Green | `#DCE8DD` |
| Warm Cream | `#F9F7F2` |
| Accent Gold | `#D4AF37` |
| Charcoal | `#333333` |

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # UI, admin, analytics, messaging, reviews
├── lib/              # Business logic, Supabase, analytics
└── types/            # TypeScript interfaces
supabase/
├── migrations/       # Numbered SQL migrations (001–021)
└── setup-phase*.sql  # Bundled phase scripts
```

## License

Private — Fore Beyond
