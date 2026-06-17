# insureinvestorsv2

Greenfield rebuild of the InsureInvestors product on a modern stack. Lives as a sibling folder to the legacy Django codebase; the two don't share runtime, just the Postgres server.

## What's here

Two Next.js apps with a shared Prisma data layer and a shared lib of Zod schemas + constants:

- **`apps/onboarding`** — client-facing submission form. Customer fills out: business info, properties (locations + buildings), prior insurance / claims / effective date. No auth. Runs on **port 3000**.
- **`apps/dashboard`** — broker / underwriter back-office. Submission inbox, underwriting risk flags, carrier quote comparison, bind flow, policy management. Runs on **port 3001**.
- **`packages/db`** — Prisma schema for the v2 entity model (17 entities) + `PrismaClient` singleton.
- **`packages/lib`** — Zod validation schemas, constants (occupancy classes, hazard groupings, lines of business), shared formatters.

## Stack

- Bun (package manager + runtime)
- Bun workspaces + Turborepo
- Next.js 15 (App Router + RSC)
- TypeScript
- Tailwind v4
- shadcn/ui (style: `base-nova`, neutral baseColor)
- Prisma 6 against Postgres
- Zod for validation

## First-time setup

```bash
# 1. Install dependencies
cd insureinvestorsv2
bun install

# 2. Create the dedicated Postgres DB (one-time)
createdb insureinvestorsv2

# 3. Copy env (defaults to the DB you just created)
cp .env.example .env
# Edit .env if your DB user / host differs from the default

# 4. Generate the Prisma client + push the schema
bun db:generate
bun db:push

# 5. Run both apps
bun dev
```

Then:
- onboarding → http://localhost:3000
- dashboard → http://localhost:3001
- prisma studio → http://localhost:3005 (run with `bun db:studio`)

## Adding shadcn components

shadcn is wired in each app via `components.json`. To add a component:

```bash
cd apps/onboarding   # or apps/dashboard
bunx shadcn@latest add button input form select checkbox tabs
```

Components land in `apps/<app>/components/ui/`. They consume the CSS variables defined in `app/globals.css`.

## Database

The schema in `packages/db/prisma/schema.prisma` is the single source of truth. Both apps import the same `PrismaClient` from `@insureinvestorsv2/db`. Cross-reference: `../docs/development_resources/database_plan.md` in the legacy repo for the model rationale.

The schema targets a fresh Postgres DB called `insureinvestorsv2` (no underscore — distinct from the Django sandbox `insureinvestors_v2`). Zero conflicts with anything legacy.

To reset the v2 schema during early dev:

```bash
bun --filter @insureinvestorsv2/db db:push --force-reset
```

Once the schema stabilizes, switch to migrations (`bun db:migrate`).

## Phased build plan

| Phase | Status | Deliverable |
|---|---|---|
| 1 | done | Monorepo + Prisma schema + lib + empty app shells |
| 2 | next | shadcn components installed in both apps + base layout primitives |
| 3 | | `apps/onboarding` — 3 routes + API routes writing Submission/Location/Building |
| 4 | | `apps/dashboard` — auth stub + submission list + detail (General + Properties tabs) |
| 5 | | `apps/dashboard` — Underwriting tab (risk flags) + Carrier management |
| 6 | | Carrier quote workflow + bind → Policy + PolicyTransaction |
| 7 | | better-auth + RealestateAPI enrichment + polish |

## Carrier email + reply threading

The dashboard sends submission emails through Microsoft Graph using the
`submissions@insureinvestors.com` shared mailbox (`apps/dashboard/lib/email/graph.ts`).
When a carrier replies, a Graph change-notification webhook
(`apps/dashboard/app/api/webhooks/graph-email/route.ts`) ingests the message,
matches `conversationId` to a `SubmissionRecipient`, and writes `EmailResponse`
+ `EmailAttachment` rows. Attachments land on local disk under
`apps/dashboard/storage/email-attachments/{yyyy}/{mm}/`. The thread is rendered
on the submission detail page — click any recipient row in the Carriers tab.

To run end-to-end locally you need a public HTTPS URL so Graph can reach the
webhook. Two steps:

```bash
# 1. Expose the dashboard port. Either:
cloudflared tunnel --url http://localhost:3001
# ...or:
ngrok http 3001

# 2. Set GRAPH_WEBHOOK_URL in .env to https://<tunnel>/api/webhooks/graph-email

# 3. Create / renew the Graph subscription (hit the cron route once):
curl -X POST \
  -H "Authorization: Bearer $GRAPH_CRON_SECRET" \
  http://localhost:3001/api/cron/graph-subscription
```

Schedule that same curl every 30 minutes (Vercel cron, a launchd plist, etc.) —
Graph subscriptions cap at 70 hours and we renew at the 30-minute mark.

When `DEV="true"` in `.env`, every outbound Graph send is redirected to
`alberto@insurecert.com` instead of the real recipients (the original to-list
is preserved in the subject).

## What's intentionally out of scope (for now)

- Authentication (skipped end-to-end; better-auth lands in Phase 7)
- RealestateAPI enrichment (manual property entry until Phase 7)
- Proposal / checkout / payment flow
- Claims FNOL, certificate generation, ACORD form output
- Production deployment infra

## Relationship to the legacy Django repo

The Django repo at `..` stays untouched. It still runs on its own settings (`benchmark/settings_alberto.py` for legacy DB, `settings_alberto_new.py` for the new DB sandbox). The `^api/v2/` URL hooks I had added to Django are commented out. Delete this `insureinvestorsv2/` folder and the legacy repo is unchanged.
