# Launching HartCare 🚀

HartCare ships ready to deploy. It runs in **local-first demo mode with zero
configuration** (sample family + pets, data stored in the browser), and turns on
the live backend + AI coach the moment you add a few environment variables.

This guide gets you live on **Railway** in a couple of minutes, with notes for
Render / Docker / Vercel at the end.

---

## Option A — Railway (recommended)

Railway reads [`railway.json`](railway.json) in this repo, so it knows exactly how
to build and run HartCare.

### 1. Create the project
1. Go to <https://railway.app> → **New Project** → **Deploy from GitHub repo**.
2. Pick the **HartCare** repository and the branch you want
   (e.g. `claude/hartcare-saas-build-7ylfdt` or `main` once merged).

### 2. It builds automatically
Railway uses the config in `railway.json`:
- **Build:** `npm ci && npm run build`
- **Start:** `npm run start`
- **Health check:** `/api/health`

Railway injects a `PORT` automatically — Next.js binds to it, no changes needed.

### 3. (Optional) Add environment variables
HartCare works without any of these. Add them under **Variables** to go live:

| Variable | What it enables |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase auth, households, realtime sync |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (paired with the URL above) |
| `ANTHROPIC_API_KEY` | AI Health Coach powered by Claude (otherwise offline engine) |
| `COACH_MODEL` | Optional Claude model override |

> The `NEXT_PUBLIC_*` keys are **build-time** values — after adding them, trigger a
> redeploy so they get baked into the client bundle.

### 4. Open it
Under **Settings → Networking**, click **Generate Domain**. Your app is live at
`https://<your-app>.up.railway.app`. The marketing page is at `/`, the app at
`/dashboard`.

---

## Enabling the live backend (Supabase)

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates every table, row-level-security policies that isolate each
   household, and a trigger that sets up a household + profile + free subscription
   on sign-up.
3. Copy the project's **URL** and **anon key** (Settings → API) into the two
   `NEXT_PUBLIC_SUPABASE_*` variables above and redeploy.

That's it — auth, households and realtime sync are now live. Until then, HartCare
happily runs the seeded demo in the browser.

---

## Option B — Docker / Render / any host

A production [`Dockerfile`](Dockerfile) builds the app and starts it with
`next start` on `$PORT`, with a health check at `/api/health`.

```bash
docker build -t hartcare .
docker run -p 3000:3000 hartcare
# open http://localhost:3000
```

For **Render**, import the repo as a *Blueprint* — [`render.yaml`](render.yaml)
wires up the Docker service, health check and env vars for you.

## Option C — Vercel

Push the repo and import it at <https://vercel.com>. Next.js is auto-detected; add
the same environment variables in the project settings.

---

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
# or production mode:
npm run build && npm run start
```

---

HartCare provides wellness information, not medical advice, and never acts as a
doctor. Healthy living, together. 💙
