# HartCare

**Healthy living, together.**

HartCare is a premium health, wellness, fitness, nutrition and care platform for
individuals and families. It works independently and integrates with **HartHome**
through a paid subscription tier. The experience is simple enough for children and
grandparents, yet powerful enough for health-conscious adults.

> HartCare provides wellness information, not medical advice. It never acts as a
> doctor or provides a medical diagnosis.

## Features

- **Daily dashboard** — activity rings, steps, calories, water, sleep, weight trend,
  meals, workout, medication & appointment reminders, family notifications, pet care,
  streaks and a daily motivational quote.
- **AI Health Coach** — builds workout & meal plans, recipes, grocery lists, hydration
  and calorie targets, recovery days and trend analysis (never a diagnosis). Uses the
  Claude API when configured, with a capable offline fallback.
- **Fitness** — workout builder (sets, reps, rest, videos), weekly schedule, sessions,
  measurements, body-fat, PRs and progress photos. Levels from beginner to senior.
- **Nutrition** — calories, protein, carbs, fat, fiber & water tracking; meal planner;
  recipe library (keto, high-protein, vegetarian, family, kid-friendly) with
  auto-generated grocery lists.
- **Health records** — weight, blood pressure, heart rate, blood sugar, cholesterol,
  labs, allergies, conditions, medications — visualized over time.
- **Child health** — parent-controlled growth charts, vaccines, allergies, habits,
  sleep routines and activities.
- **Pet care** — dogs & cats: weight history, vaccinations, feeding, vet visits and
  medications.
- **Medications** — dosages, frequency, refill reminders & notifications for the whole
  family and pets.
- **Sleep, mental wellness, appointments, goals, family mode & analytics.**
- **HartHome integration (premium)** — two-way sync and single sign-on.
- Authentication, households, role permissions, dark mode, mobile/tablet responsive,
  loading & error states, a notification system and a subscription-ready billing
  structure.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** design system (warm white, soft blue, charcoal, mint accents)
- **Supabase** (Postgres, Auth, RLS, realtime) — see [`supabase/schema.sql`](supabase/schema.sql)
- **zustand** local-first store · **Recharts** · **lucide-react**

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

The app runs out of the box in **local-first demo mode** — a realistic sample
household (parents, a child, a grandparent and two pets) is seeded and persisted in
your browser. No backend required.

### Going live

1. Create a [Supabase](https://supabase.com) project and run
   [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor. It creates every
   table, row-level-security policies that isolate each household, and a trigger that
   bootstraps a household, profile, membership, settings and a free subscription on
   sign-up.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The app detects these automatically.
3. (Optional) Set `ANTHROPIC_API_KEY` to power the AI coach with Claude.

## Project structure

```
src/
  app/
    (app)/            Authenticated app shell + all feature routes
    api/coach/        AI coach endpoint (Claude + offline fallback)
    page.tsx          Marketing landing page
    login, signup     Authentication (Supabase + HartHome SSO)
  components/         Design system (ui.tsx), charts, app shell, theme
  lib/                types, store, seed data, hooks, utils, supabase clients
supabase/schema.sql   Full Postgres schema with RLS
```
