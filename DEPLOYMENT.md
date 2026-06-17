# Deploying to Vercel

This is a Bun + Turborepo monorepo with **two** Next.js apps that deploy as
**two separate Vercel projects** from the same Git repo:

| App | Vercel Root Directory | Domain |
|---|---|---|
| `apps/dashboard` (underwriters) | `apps/dashboard` | `insureinvestors.com` |
| `apps/onboarding` (client FE) | `apps/onboarding` | `application.insureinvestors.com` |

Both apps share one Postgres database (`packages/db`, Prisma) and the same
Better Auth tables. Cookies are host-scoped per domain, so broker sessions
(apex) and client sessions (subdomain) stay isolated — which is intended.

## 0. Prerequisites

- A **hosted Postgres** reachable from Vercel (Vercel Postgres, Neon, Supabase,
  RDS, …). The local `localhost:5432` DB will not work in production.
- After the DB exists, push the schema once from your machine:
  ```bash
  DATABASE_URL="postgres://…prod…" bun --filter @insureinvestorsv2/db db:push
  ```
  (Or switch to `db:migrate` if you've started tracking migrations.)

## 1. Create the two Vercel projects

For **each** app, in the Vercel dashboard: New Project → import this repo →

- **Root Directory:** `apps/dashboard` (project 1) / `apps/onboarding` (project 2)
- Framework preset: **Next.js** (auto-detected)
- Build / Install commands: leave default — each app ships a `vercel.json` that
  sets the build command to run `prisma generate` before `next build`. Install
  runs `bun install` at the workspace root automatically.

Keep "Include files outside the Root Directory" **on** (default) so the
workspace packages (`packages/db`, `packages/lib`) are available.

## 2. Environment variables

Set these in **Project → Settings → Environment Variables** (Production).
`.env.example` documents all of them. The base-URL vars differ per project:

### Both projects
```
DATABASE_URL            = postgres://…prod…
BETTER_AUTH_SECRET      = <same value in both>   # openssl rand -base64 32
ONBOARDING_BASE_URL     = https://application.insureinvestors.com
```

### Dashboard project only (insureinvestors.com)
```
DASHBOARD_BASE_URL      = https://insureinvestors.com
GRAPH_TENANT_ID         = …
GRAPH_CLIENT_ID         = …
GRAPH_CLIENT_SECRET     = …
GRAPH_FROM_MAILBOX      = submissions@insureinvestors.com
GRAPH_WEBHOOK_URL       = https://insureinvestors.com/api/webhooks/graph-email
GRAPH_CRON_SECRET       = <secret>
CRON_SECRET             = <same as GRAPH_CRON_SECRET>   # Vercel cron auth
ASCEND_API_KEY          = …
ASCEND_API_URL          = https://api.useascend.com/v1  # prod, not sandbox
ASCEND_PRODUCER_ID      = …
ASCEND_ACCOUNT_MANAGER_ID = …
ASCEND_WEBHOOK_SECRET   = …
REALESTATE_API_KEY      = …
REALESTATE_API_URL      = https://api.realestateapi.com/v2
# DEV must be UNSET/empty in prod, or all carrier email is rerouted to a test inbox.
```

The onboarding project only needs the "both projects" vars plus
`REALESTATE_API_KEY` if it does address autocomplete.

## 3. Domains

- Dashboard project → add domain `insureinvestors.com` (and `www` → redirect).
- Onboarding project → add domain `application.insureinvestors.com`.
- Point DNS at Vercel: apex `A`/`ALIAS` per Vercel's instructions, and a
  `CNAME` for `application` → `cname.vercel-dns.com`.

## 4. Cron (dashboard)

`apps/dashboard/vercel.json` registers an hourly cron hitting
`/api/cron/graph-subscription` to renew the Microsoft Graph mail subscription.
Vercel authenticates it with `CRON_SECRET`; the route checks `GRAPH_CRON_SECRET`
— set both to the same value. (Hourly cron requires a Pro plan; Hobby caps at
one run/day.)

## ⚠️ Known blocker: file storage is on the local filesystem

Two features write to the local disk, which **does not persist on Vercel**
(serverless filesystems are ephemeral and read-only except `/tmp`):

- `apps/dashboard/lib/uploads.ts` → submission document uploads (`data/uploads/`)
- `apps/dashboard/lib/storage/email-attachments.ts` → carrier-reply attachments

The apps will **build and deploy fine**, but these uploads/downloads will fail
or silently lose files at runtime. Before relying on them in production, swap
both modules for object storage (S3 / Cloudflare R2 / Vercel Blob). Both files
are written as single-module seams specifically so the call sites don't change
— only `saveAttachment`/`readAttachment` and the uploads helpers need new bodies.
