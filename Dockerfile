# ─── HartCare — production image ──────────────────────────────────────────────
# Multi-stage build of the Next.js app. The final image installs production
# dependencies, includes the built `.next` output, and starts with `next start`
# on $PORT.
#
# Works on any Docker host (Railway, Render, Fly.io, a VPS, etc.). HartCare runs
# in local-first demo mode with no configuration; set the Supabase / Anthropic
# env vars (see .env.example) to enable the live backend and AI coach.

# Stage 1 — build
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — runtime
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Production dependencies only.
COPY package*.json ./
RUN npm ci --omit=dev

# Built app + assets.
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
