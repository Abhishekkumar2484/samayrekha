# SamayRekha (समयरेखा)

**SamayRekha** ("timeline" in Hindi) is a mobile-first PWA that tracks deadlines for Indian government competitive exams — SSC, Banking, Railway, State PSC, and Police — so aspirants never miss an application window, admit card release, or result date.

The core problem: exam notifications are scattered across dozens of official sites (SSC, IBPS, RRB, state PSCs, police recruitment boards), each with its own timeline of notification → application open → application close → admit card → exam date → answer key → result. SamayRekha centralizes those dates into one personalized, at-a-glance feed.

## How it works

1. **Sign up / log in** — email + password via Supabase Auth (`/login`), with email confirmation for new accounts.
2. **Onboarding** (`/onboarding`) — a 2-step wizard:
   - Pick your state (for state-relevant exams like State PSC).
   - Pick one or more interest categories: SSC, Banking, Railway, State PSC, Police.
3. **Discover** (`/discover`) — a personalized feed of exams matching your interests, each card showing:
   - Organization, exam name, category badge.
   - The next upcoming event (notification, application open/close, admit card, exam date, answer key, result) with a color-coded urgency badge (आज / इस हफ़्ते / आगे / बीत गया).
   - A link to the official source.
   - An **Add** button to track the exam — saved to your personal tracker (`user_exams`).
4. **Reminders** — tracked exams get Web Push notifications 3 days before and on the day of a deadline (dedup'd via `reminders_sent`), so users don't have to check the app every day.

The UI is mobile-first (bottom-sheet style action bars, large tap targets), and installable as a PWA (manifest + service worker) for an app-like experience without needing the Play Store.

## Data model

Backed by Supabase (Postgres):

- `exams` — public catalog: name, organization, category, official URL.
- `exam_events` — dated milestones per exam (notification, application_start/end, admit_card, exam_date, answer_key, result), each with a status and official source link for verification.
- `profiles` — per-user state, interests, Web Push subscription (`push_subscription`).
- `user_exams` — a user's tracked exams + application status (not_applied → applied → admit_card_downloaded → exam_given) + reminder toggle.
- `reminders_sent` — log of reminders already delivered, to avoid duplicates.
- `scraped_events` — staging table for scraper output, reviewed by an admin before being promoted into `exams`/`exam_events` (see Data ingestion below).

Row-Level Security (`rls-policies.sql`): `exams` and `exam_events` are readable by anyone (public catalog); `profiles` and `user_exams` are readable/writable only by their owning user. `scraped_events` has RLS enabled with **no** policies — only the service-role client (cron jobs, admin actions) can touch it.

## Tech stack

- **Next.js 16** (App Router, Server Actions) + **React 19**
- **Supabase** — Postgres, Auth, RLS (`@supabase/ssr`, `@supabase/supabase-js`)
- **Tailwind CSS v4** + **shadcn/ui** (Radix + base-ui primitives) for components
- **PWA**: web app manifest + service worker (also handles push notifications) for installability
- **Cheerio** for scraping, **web-push** for Web Push delivery
- `sonner` for toasts, `lucide-react` for icons

## Data ingestion

A scraper pulls new exam notifications from sarkariresult.com's "Latest Jobs" listing and each notification's "Important Dates" section (`src/lib/scraper/`). It never writes directly into `exams`/`exam_events` — it upserts into `scraped_events` as `pending`, with best-effort category/event-type inference and date parsing (placeholders like "As per schedule" are left unparsed rather than guessed).

An admin reviews and edits pending rows at `/admin/review` (gated by the `ADMIN_EMAILS` env var) and approves or rejects each one; approving finds-or-creates the `exams` row and writes the `exam_events` row. If a previously-approved date changes on a later scrape (e.g. a postponement), that row flips back to `pending` for re-review instead of silently changing.

Triggered by Vercel Cron (`vercel.json`) hitting `GET /api/cron/scrape` every 6 hours, guarded by `CRON_SECRET` in production.

## Reminders

`GET /api/cron/reminders` (daily via `vercel.json`) checks every tracked exam (`reminders_enabled = true`) for events happening today or in 3 days, and sends a Web Push notification per user/event/reminder-type not already logged in `reminders_sent`. Users opt in via the "Enable reminders" button on `/discover`, which registers a push subscription (`src/components/push-subscribe.tsx`) stored on their profile. The service worker (`public/sw.js`) handles the `push` and `notificationclick` events.

## Project structure

The Next.js app lives in [`frontend/`](frontend/) — everything below (`src/`, `public/`, `package.json`, the SQL files) is relative to that folder. If you're setting this up on Vercel, set the project's **Root Directory** to `frontend`.

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` if signed out, `/onboarding` if you haven't set a state/interests yet, or `/discover` once set up.

### Supabase setup

1. Create a Supabase project and point `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars at it.
2. Create the tables described above (`exams`, `exam_events`, `profiles`, `user_exams`, `reminders_sent`).
3. Run `rls-policies.sql` in the Supabase SQL Editor to enable row-level security.
4. Run `schema-updates.sql` to add the `scraped_events` staging table and switch `profiles` to `push_subscription`.
5. Copy the project's **service_role** key (Project Settings → API) into `SUPABASE_SERVICE_ROLE_KEY` — required for the scraper and admin review to write past RLS.
6. Run `seed.sql` to populate a few sample exams/events for local testing.

### Push notifications setup

1. Generate a VAPID keypair: `npx web-push generate-vapid-keys`.
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same value as the public key), and `VAPID_SUBJECT` (`mailto:you@example.com`).
3. Set `CRON_SECRET` to a random string and `ADMIN_EMAILS` to your own email — see `.env.local.example` for the full list of new env vars.

## Roadmap ideas

- Crawl `/admitcard/` and `/result/` listings too, not just `/latestjob/`.
- A dedicated "My tracked exams" view separate from Discover, with application-status updates.
- Search/filter within Discover beyond category matching.
- A second scrape source once sarkariresult.com coverage is validated.
