# Deploying SuperDemo

Two halves, and they cannot both go to the same place.

**The web app is a Next.js site and belongs on Vercel.** **The API cannot be
serverless.** It holds WebSocket connections for the live inbox and the outbound
dialer ticks on an interval — both die with a function that scales to zero
between requests. It needs a host that keeps a process running.

So: Vercel for the web, a container host for the API, and managed Postgres and
Redis. Four things, and the free tier of each is enough for a demo.

---

## What you need before starting

| Service | Why | Free tier |
|---|---|---|
| **Postgres** — Neon or Supabase | Everything. The vendored `embedded-postgres` is a local-development convenience and cannot be reached from outside this laptop | yes |
| **Redis** — Upstash | Not optional. The API opens three connections at boot: pub/sub for the live inbox, and BullMQ | yes |
| **A container host** — Railway, Render, or Fly | The API. `Dockerfile` at the repo root builds it | yes / small |
| **Vercel** | The web app | yes |

---

## 1. Postgres

Create a database and take the pooled connection string.

```bash
DATABASE_URL="postgresql://…?sslmode=require"
```

Then, from a checkout with that variable set:

```bash
pnpm --filter @superdemo/db push     # creates the schema
pnpm --filter @superdemo/db seed     # demo tenants, staff, conversations
pnpm --filter @superdemo/db backfill:evals   # cost, dispositions, quality scores
```

`push` rather than `migrate` is deliberate — this repo has no migrations
directory and syncs the schema directly. Fine for a demo; a production
deployment should move to `prisma migrate` before the first real customer.

## 2. Redis

Create a database, take the URL. Upstash gives a `rediss://` URL — the extra `s`
matters, it is TLS.

## 3. The API

Point your host at this repo with the root `Dockerfile`. No build command
needed; the image does it all.

Environment — the ones without a default will stop it booting:

```
DATABASE_URL=…                 # from step 1
REDIS_URL=…                    # from step 2
JWT_SECRET=…                   # openssl rand -base64 48
JWT_REFRESH_SECRET=…           # a DIFFERENT one
CRM_SECRET_KEY=…               # openssl rand -base64 32
PUBLIC_BASE_URL=https://…      # this service's own public URL
WEB_ORIGIN=https://…           # the Vercel URL, for CORS
NODE_ENV=production
```

Telephony, if you want real calls:

```
TELEPHONY_DRIVER=twilio
TWILIO_ACCOUNT_SID=…
TWILIO_AUTH_TOKEN=…
TWILIO_NUMBER=+1…
TWILIO_API_KEY_SID=SK…         # for the browser softphone
TWILIO_API_KEY_SECRET=…
```

Leave `TELEPHONY_DRIVER` unset for a demo with no carrier — everything works
except the phone actually ringing.

The container listens on `PORT`, which every host injects. Health check:
`GET /health`.

## 4. The web app

**Set Root Directory to `apps/web` first.** Vercel Dashboard → Project →
Settings → Build & Deployment → Root Directory. Without it the deploy fails with
*"No Next.js version detected"*: Vercel looks for `next` in the package.json of
the root directory, and the repo root is a workspace root that has none.

Leave "Include files outside the root directory" ON — the app imports
`@superdemo/contracts` and `@superdemo/db`, which resolve to their `dist`, so
those packages have to be present and built.

```bash
vercel link          # from the repo root
vercel --prod
```

`apps/web/vercel.json` builds both workspace packages before `next build`. That
order is not optional: both resolve through `main` to `dist`, so a plain
`next build` fails on modules that have not been emitted yet.

Environment on Vercel:

```
NEXT_PUBLIC_API_URL=https://…    # the API from step 3
NEXT_PUBLIC_WS_URL=https://…     # the same host
```

Both are `NEXT_PUBLIC_`, so they are baked in at build time — changing them
means redeploying, not just restarting.

---

## The order matters

The API needs `WEB_ORIGIN` and the web needs `NEXT_PUBLIC_API_URL`, so one of
them is deployed before the other exists. Deploy the API first with
`WEB_ORIGIN` left blank, deploy the web against it, then set `WEB_ORIGIN` and
redeploy the API. Skipping the last step gives a dashboard that loads and then
fails every request on CORS, which looks like a broken app rather than a
missing variable.

## What will not work in production yet

- **No migrations.** `db push` syncs the schema; there is no history and no way back.
- **No CI.** Nothing builds or tests on push; `.github/workflows` does not exist.
- **Recordings go to local disk** unless `STORAGE_DRIVER=r2` is configured, and a container's disk does not survive a deploy.
- **The UAE caller ID question is unresolved** — a Twilio US number will present as `+1` to a Dubai customer. A local presentation number needs TDRA approval; see NOT-IMPLEMENTED.md.
