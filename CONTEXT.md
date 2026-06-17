# insureinvestorsv2 — Context for fresh chats

> If you're picking this up cold (new chat session, new collaborator, new agent),
> read this top to bottom before touching code. It explains **what we're building,
> why, and the conventions you must follow** to stay consistent with the rest of the codebase.

---

## 1. What this is

`insureinvestorsv2/` is a **greenfield rebuild** of a legacy Django insurance
broker app that lives in the parent folder (`../`, the repo at
`/Users/albertoinsurecert/insureinvestors`). The legacy app uses a tangled data
model where a single `Policy` row does the job of 5+ AMS360 tables, plus a
configurable "questionnaire engine" that adds layers of indirection for a product
that's effectively one questionnaire.

Our rebuild is a **Next.js 15 + TypeScript + Prisma 6** monorepo that:

- Models the domain with the relational shape inspired by AMS360 (Customer →
  Submission → Location → Building → Policy → PolicyTransaction → BuildingCoverage)
- Replaces the questionnaire engine with typed columns and structured forms
- Splits the two surfaces into separate Next.js apps:
  - `apps/onboarding` — customer-facing submission form (anonymous, port 3000)
  - `apps/dashboard` — broker/underwriter back-office (authenticated, port 3001)
- Shares one Prisma schema across both apps via `packages/db`
- Lives **alongside** the Django repo without touching it — the two share nothing at runtime

The canonical design doc for the data model is **`../docs/development_resources/database_plan.md`**
in the legacy repo. Read that for the rationale behind each model.

---

## 2. Tech stack

| Concern | Choice |
|---|---|
| Package manager | **Bun** (workspaces) |
| Monorepo orchestration | **Turborepo** |
| Framework | **Next.js 15** (App Router + RSC + Server Actions) |
| Language | **TypeScript** (strict) |
| UI kit | **shadcn/ui** (style: `base-nova`, registered via `components.json`) |
| Primitives | **Base UI** (`@base-ui/react`) — *not* radix |
| Styling | **Tailwind CSS v4** (`@theme inline` + `tw-animate-css`) |
| Icons | **lucide-react** |
| Forms | **react-hook-form + zod** (where needed); most forms are uncontrolled with autosave-on-blur |
| Validation | **Zod** schemas in `packages/lib` |
| ORM | **Prisma 6** against Postgres |
| Auth | **better-auth** (email/password, Prisma adapter) |
| DB | **PostgreSQL** — DB name `insureinvestorsv2` |
| Address autocomplete | **OpenStreetMap Nominatim** (free, no key) |
| Toasts | **Sonner** |
| Tables | **shadcn `Table`** + bespoke wrappers (no `@tanstack/react-table` yet) |
| Theme | swappable via `bunx --bun shadcn@latest add <tweakcn-url>` |

**Critical:** shadcn's `base-nova` style uses **Base UI** primitives, not Radix.
Most quirks come from this. See "Gotchas" below.

---

## 3. Quick start

```bash
# from /Users/albertoinsurecert/insureinvestors/insureinvestorsv2
bun install

# one-time
createdb insureinvestorsv2
cp .env.example .env             # adjust DB user if needed
bun db:generate
bun db:push                      # creates all tables (uses --accept-data-loss; safe for v2 sandbox)
bun db:seed                      # 5 carriers + 8 personnel

bun dev                          # runs both apps + prisma studio
```

Then:
- onboarding → http://localhost:3000
- dashboard → http://localhost:3001 (redirects to /login; sign up to get in)
- prisma studio → http://localhost:3005

---

## 4. Repo layout

```
insureinvestorsv2/
├── apps/
│   ├── onboarding/                  # client-facing submission form (Next.js 15, port 3000)
│   │   ├── app/
│   │   │   ├── page.tsx              # landing
│   │   │   ├── start/page.tsx        # kicks off the flow (creates Customer + draft Submission)
│   │   │   ├── [uuid]/
│   │   │   │   ├── layout.tsx        # gates on existing submission
│   │   │   │   ├── quoting-system/   # page 1: customer info + LOB tiles + target eff date
│   │   │   │   ├── multy-property/   # page 2: locations + buildings
│   │   │   │   ├── quoting-snapshot/ # page 3: prior insurance + claims
│   │   │   │   └── complete/         # done
│   │   │   ├── globals.css           # theme tokens (tweakcn-applied — keep in sync with dashboard)
│   │   │   └── layout.tsx            # root layout (Toaster)
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn primitives
│   │   │   ├── app-header.tsx
│   │   │   ├── step-indicator.tsx
│   │   │   └── forms/                # CustomerInfoForm, LocationCard, BuildingCard, SnapshotForm,
│   │   │                             # AddressLookup, DatePicker, PropertiesSection
│   │   ├── lib/
│   │   │   ├── actions/              # server actions (submissions, customers, locations, buildings, addresses)
│   │   │   └── utils.ts              # cn()
│   │   ├── components.json           # shadcn config (style: base-nova, baseColor: neutral)
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── dashboard/                   # broker/underwriter app (Next.js 15, port 3001)
│       ├── app/
│       │   ├── page.tsx              # main dashboard (KPI cards, chart, submissions table)
│       │   ├── (auth)/
│       │   │   ├── layout.tsx        # bare centered shell, no sidebar
│       │   │   ├── login/page.tsx
│       │   │   └── signup/page.tsx
│       │   ├── api/auth/[...all]/route.ts   # better-auth catch-all handler
│       │   ├── submissions/
│       │   │   ├── page.tsx          # list
│       │   │   └── [uuid]/page.tsx   # detail w/ General / Properties / Underwriting / Carriers tabs
│       │   ├── policies/
│       │   │   ├── page.tsx          # list
│       │   │   └── [uuid]/page.tsx   # detail w/ KPIs, transaction history, building coverages
│       │   ├── quotes/page.tsx       # cross-submission quotes list
│       │   ├── customers/page.tsx    # customer list
│       │   ├── carriers/page.tsx     # carrier panel list
│       │   ├── settings/page.tsx     # stub
│       │   ├── help/page.tsx         # stub
│       │   └── globals.css
│       ├── middleware.ts             # gates all routes except /login, /signup, /api/auth/*
│       ├── components/
│       │   ├── ui/                   # shadcn primitives (incl. accordion, sidebar, chart, table)
│       │   ├── app-sidebar.tsx       # main nav, branded
│       │   ├── nav-main.tsx          # uses Next Link via render prop, active state via usePathname
│       │   ├── nav-secondary.tsx     # same pattern for bottom nav
│       │   ├── nav-user.tsx          # session-aware NavUser w/ sign out
│       │   ├── page-shell.tsx        # SidebarProvider + SiteHeader wrapper
│       │   ├── site-header.tsx
│       │   ├── section-cards.tsx     # KPI cards (broker-scoped)
│       │   ├── chart-area-interactive.tsx
│       │   ├── submissions-table.tsx
│       │   ├── list-page.tsx         # tiny wrapper for /quotes /policies /customers /carriers
│       │   ├── submission-header.tsx # detail page top bar w/ KPI tiles
│       │   └── submission/
│       │       ├── general-tab.tsx
│       │       ├── properties-tab.tsx
│       │       ├── underwriting-tab.tsx     # the 7-group accordion-based form
│       │       ├── carriers-tab.tsx         # email composer trigger + quotes table + bind
│       │       ├── carrier-composer.tsx     # Sheet for emailing carriers
│       │       └── quote-entry-dialog.tsx   # Dialog for logging a received quote
│       ├── lib/
│       │   ├── auth.ts               # better-auth instance + signup hook → broker assignment
│       │   ├── auth-client.ts        # client-side signIn/signUp/signOut/useSession
│       │   ├── require-auth.ts       # server helper, returns { user, broker } or redirects
│       │   ├── scope.ts              # assertOwnedSubmission/Location/Building/etc — mutation gating
│       │   ├── queries.ts            # broker-scoped reads (stats, listSubmissions/Policies/etc)
│       │   └── actions/              # server actions (submissions, customers, locations, buildings,
│       │                             #   carriers, quotes, policies)
│       ├── components.json
│       └── package.json
│
├── packages/
│   ├── db/                          # @insureinvestorsv2/db
│   │   ├── prisma/schema.prisma     # 19 models — User, Broker, Customer, Carrier, CarrierPersonnel,
│   │   │                            #   Submission, SubmissionRecipient, CarrierQuote, QuoteDocument,
│   │   │                            #   Location, Building, Policy, PolicyTransaction,
│   │   │                            #   PolicyLineOfBusiness, BuildingCoverage, PolicyRole,
│   │   │                            #   PolicyContact, Invoice, Claim + Session/Account/Verification
│   │   ├── scripts/seed-carriers.ts
│   │   └── src/index.ts             # PrismaClient singleton (`db`)
│   └── lib/                         # @insureinvestorsv2/lib — non-React shared code
│       ├── src/
│       │   ├── schemas/             # Zod schemas matching Prisma (Customer/Submission/Location/Building)
│       │   ├── constants/
│       │   │   ├── hazard-groups.ts # 7 question groups + back-compat aggregates
│       │   │   ├── occupancy-class.ts # 19 enum values + labels
│       │   │   └── lines-of-business.ts
│       │   ├── formatters/          # currency, address
│       │   └── index.ts             # re-exports
│       └── package.json
│
├── scripts/
│   └── quiet-next-dev.sh            # wrapper that strips Next's lockfile-patcher yarn-spam
│
├── docs/                            # (empty for now; this file is at root)
├── package.json                     # workspace root
├── turbo.json
├── tsconfig.base.json
├── .env                             # DATABASE_URL
├── .env.example
├── README.md                        # for humans
└── CONTEXT.md                       # this file
```

---

## 5. Conventions you MUST follow

### Database / Prisma

- **The schema in `packages/db/prisma/schema.prisma` is the single source of truth.**
  Both apps import the `PrismaClient` from `@insureinvestorsv2/db`.
- **Don't add new tables for state machines.** The Policy lifecycle goes through
  `PolicyTransaction` rows. Don't add a `status` enum to Policy.
- **Location is polymorphic** — anchored to either `submission` or `policy`,
  never both. The check constraint exists in the schema; enforced at the app
  layer via Zod (`LocationPatchSchema.refine`).
- **`User.id` is `String` (cuid)** because better-auth requires it. Every FK
  pointing at User is `String?`.
- `bun db:push` uses `--accept-data-loss` because turbo can't pipe stdin to
  Prisma's prompts. For real schema migrations, use `bun db:migrate`.

### Server actions

- Every mutation file starts with `"use server"`.
- **All actions return `Promise<void>`.** This avoids Prisma `Decimal` objects
  crossing the RSC boundary (which fails with "Decimal objects are not supported").
- **Dashboard mutations are broker-scoped.** Use `requireAuth()` to get the
  context, then `assertOwned*` from `lib/scope.ts` to verify the row belongs
  to the current broker before writing. Throws "Not found" otherwise.
- **Onboarding mutations are anonymous.** The legacy pattern of "anyone with
  the UUID can edit" is preserved — UUIDs are random 128-bit; brute-force is
  infeasible.

### Reads from server components

- **Dashboard reads filter by `broker.id`.** Use `requireAuth()` first.
- **Page mappers stringify Prisma Decimals** before passing to client components.
  Pattern: `insurableValue: b.insurableValue ? b.insurableValue.toString() : null`.

### shadcn / Base UI

- The `shadcn` skill is installed at `apps/{onboarding,dashboard}/.agents/skills/shadcn/`.
  Read `SKILL.md` for the full rules — especially `rules/forms.md` for `Field`/`FieldGroup`
  vs raw `<div>` patterns.
- **Use Field/FieldGroup/FieldLabel** for forms, not custom div wrappers.
- **Use `Empty` for zero-states**, not custom dashed-border divs.
- **Use `Sonner` (`toast.success`/`toast.error`)** for feedback, not custom alerts.
- **Use `data-icon="inline-start"` or `"inline-end"`** for icons inside `Button`.
- **Semantic colors only**: `bg-primary`, `text-muted-foreground`, etc. No raw
  `bg-blue-500`. No `dark:` overrides — use tokens.
- **Use `gap-*`, not `space-x-*` / `space-y-*`**.
- **Use `size-*` when w and h are equal**.

### Base UI vs Radix differences (the biggest source of bugs)

When the shadcn `base-nova` style is in use, Base UI primitives replace Radix.
The API is different — these are the ones we've hit:

| Component | Radix way | Base UI way |
|---|---|---|
| Button → Link | `<Button asChild><Link/></Button>` | `<Button nativeButton={false} render={<Link.../>} />` |
| Accordion (single vs multi) | `<Accordion type="single\|multiple">` | Always multi via `value` array; no `type` prop |
| Accordion data attrs | `data-state="open\|closed"` | `data-open` (present when open), `data-starting-style` and `data-ending-style` for transitions |
| Tabs orientation | `data-horizontal:...` | `data-[orientation=horizontal]:...` |
| Slot-style composition | `asChild` | `render` prop |
| Generic forwarding | Most components consume known props | Base UI **spreads unknown props onto the DOM element**, so an unknown prop becomes an HTML attribute and React warns |

If React warns "X does not recognize the prop Y on a DOM element", it almost
always means **you're using a Radix API on a Base UI component**.

### Theming (tweakcn)

Themes are applied per-app by running `bunx --bun shadcn@latest add <tweakcn-url>`
which **rewrites that app's `globals.css`** with new tokens. **Keep onboarding
and dashboard themes in sync** — apply the same URL to both apps.

Current theme: a purple-primary theme. Latest one to land was applied to
onboarding (purple `oklch(0.4865 0.2423 291.8661)`). Make sure dashboard matches.

### Animations

Tailwind v4 animations require `--animate-<name>` in `@theme` plus `@keyframes`.
We have `accordion-down` / `accordion-up` defined in `app/globals.css`. If you
add a new animated component, follow the same pattern.

### Two-app convention

Anything shared lives in `packages/db` or `packages/lib`. Anything app-specific
(routes, server actions, components) lives in `apps/<app>/`. We deliberately
**don't share components between apps yet** — divergence is fine while UX
patterns settle.

---

## 6. Phase history (what's shipped)

1. **Phase 1** — Monorepo + Prisma schema (17 entities) + empty Next.js shells.
2. **Phase 2** — shadcn baseline in both apps + AppHeader. Switched to base-ui's `render` prop where we'd used `asChild`.
3. **Phase 3** — Onboarding submission flow: 3 form pages (`/quoting-system`, `/multy-property`, `/quoting-snapshot`) + `/start` + `/[uuid]/complete`. Server actions for Submission/Customer/Location/Building. Autosave on blur. Zod validation. Sonner toasts.
4. **Phase 4** — Dashboard read side:
   - Dashboard-01 block (`bunx shadcn add dashboard-01`) branded for us.
   - Real KPI cards (`SectionCards`) reading broker-scoped Prisma counts.
   - Submissions inbox table on `/`.
   - Submission detail at `/submissions/[uuid]` with **General / Properties / Underwriting** tabs.
   - Underwriting tab renders the 54 risk-flag booleans grouped, with editable Submission + Location + Building flags.
   - Found+fixed shadcn `Tabs` bug (`data-horizontal:` was the wrong selector for Tailwind v4 — should be `data-[orientation=horizontal]:`).
5. **Phase 5** (mostly absorbed into Phase 4) — Underwriting tab + part of Properties tab.
6. **Phase 6a** — Carrier panel seed (`bun db:seed`) + email composer Sheet + Carriers tab on submission detail. Created `SubmissionRecipient` rows, flipped Submission status `draft → sent`.
7. **Phase 6b** — Manual quote entry per recipient via `QuoteEntryDialog`. Wrote `createCarrierQuote` action — creates `CarrierQuote`, updates recipient status, transitions submission `partial → quoted`.
8. **Phase 6c** — `bindQuote` action: creates `Policy` + copies Locations/Buildings + writes `PolicyTransaction(new_business)` + `BuildingCoverage` rows + `Invoice` in one transaction. Side-by-side quote comparison table. `/policies/[uuid]` detail page with policy header, KPI tiles, transaction history, building coverages.
9. **Phase 7a** — better-auth integration:
   - `User.id` switched `Int → String`, cascaded all User FKs.
   - Added `Session`, `Account`, `Verification` tables.
   - `lib/auth.ts` (server) + `lib/auth-client.ts` (client).
   - `/api/auth/[...all]` catch-all handler.
   - `/login` + `/signup` pages.
   - `middleware.ts` gates all routes except auth.
   - `NavUser` shows live session.
10. **Phase 7b** — Broker scoping:
    - `databaseHooks.user.create.after` assigns new users to the default broker.
    - Onboarding's `defaultBroker()` finds the same row so anonymous submissions land in the right broker.
    - `requireAuth()` helper + every read in `lib/queries.ts` + every detail-page query scoped by `broker.id`.
11. **Phase 7c** — Mutation scoping + RealestateAPI enrichment:
    - `lib/scope.ts` helpers — every dashboard mutation asserts ownership before writing.
    - Address autocomplete via Nominatim. New `<AddressLookup>` (Command + Popover) on `LocationCard`. Picking a result fills street/city/state/zip/lat/lon in one save.
12. **Post-7c polish**:
    - Sidebar nav rewired to real Next.js Links with `usePathname()` active state.
    - `/submissions`, `/quotes`, `/policies`, `/customers`, `/carriers` list pages (all broker-scoped reads). Stubs for `/settings`, `/help`.
    - Submission detail header redesigned to match legacy reference (metadata bar + KPI tiles).
    - Tabs switched to `variant="line"` horizontal style.
    - Theme swap to purple via tweakcn.
    - Underwriting tab restructured into **7 collapsible question groups** matching the legacy questionnaire's parents. Added 6 missing fields (Location.breachedBuildingCodes5y, hasHazardousChemicalsTenant, warehouseOtherThanGeneral, warehouseOtherUseDescription; Building.hazardSupplementalHeating; OccupancyClass.arts_entertainment_recreation).
    - Accordion fix: dropped invalid `type="multiple"` (base-ui ignores it), default is already multi-open. Animation fix: `data-closed` → `data-ending-style` (base-ui's actual transition attribute). Keyframes for `accordion-down`/`accordion-up` defined in both apps' `globals.css`.
    - Inner accordion padding bumped to `px-1 pt-3 pb-5`.

---

## 7. What's left (Phase 7+ continued / Phase 8 territory)

- **Multi-tenant onboarding** — onboarding currently writes to the default broker. Real tenancy: subdomain or `?broker=slug` routing so each broker has isolated onboarding URLs.
- **Customer detail page** — `/customers/[uuid]` with submissions/policies/claims aggregated.
- **Carrier admin** — add/edit/disable carriers + personnel without the seed script.
- **Notes / activity log** per submission.
- **S3 document upload** — `QuoteDocument`, submission attachments, ACORD PDFs.
- **ACORD form generation** — server-side PDF render of ACORD 125 / 126 / 140 from submission data.
- **Real carrier email send** — pick Resend / Postmark / SES and wire it into `sendSubmissionToCarriers` (currently records the email but doesn't deliver).
- **Email verification + password reset** — flags are off in `lib/auth.ts`; turn on once the email sender exists.
- **RealestateAPI promotion** — Nominatim is free but rate-limited. Swap to Mapbox / Smarty / Google Places for production-grade enrichment + property characteristics (year built, sqft, etc., which Nominatim doesn't provide).
- **Endorsements / cancellations / audits** — the schema supports them via `PolicyTransaction` types but no UI yet.

---

## 8. Key file map ("where do I find…")

| Need to… | File |
|---|---|
| Add a new model | `packages/db/prisma/schema.prisma` then `bun db:push` |
| Add a Zod schema for it | `packages/lib/src/schemas/<model>.ts` + re-export in `src/index.ts` |
| Read broker-scoped data on a page | `apps/dashboard/lib/queries.ts` |
| Write data from the dashboard | `apps/dashboard/lib/actions/<resource>.ts` (call `requireAuth()` + `assertOwned*` first) |
| Write data from onboarding | `apps/onboarding/lib/actions/<resource>.ts` (anonymous) |
| Gate a route | `apps/dashboard/middleware.ts` |
| Add a sidebar link | `apps/dashboard/components/app-sidebar.tsx` |
| Add a new tab to submission detail | `apps/dashboard/app/submissions/[uuid]/page.tsx` + a new component in `components/submission/` |
| Tweak the global theme | `apps/{onboarding,dashboard}/app/globals.css` (or run `bunx shadcn add <tweakcn-url>` in each app to overwrite) |
| Add a shadcn component | `cd apps/<app> && bunx --bun shadcn@latest add <component>` |
| Add a hazard flag to the underwriting form | (1) Prisma `Location` or `Building` (2) `packages/lib/src/schemas/<model>.ts` (3) `packages/lib/src/constants/hazard-groups.ts` (which group?) (4) `apps/dashboard/app/submissions/[uuid]/page.tsx` to pass the field through |

---

## 9. Gotchas / paper cuts

- **Next.js + bun lockfile patcher** — Next tries to invoke yarn to patch
  `@next/swc-*` into the lockfile; with bun's `packageManager` field, yarn
  spits a huge stack each run. `scripts/quiet-next-dev.sh` is a wrapper that
  filters those exact lines. Used in `apps/<app>/package.json` `dev` scripts.
- **`bun db:push` won't accept y/n prompts** — turbo doesn't pipe stdin. So the
  script has `--accept-data-loss` baked in. **Fine for the v2 sandbox; do not
  ship to prod without switching to `bun db:migrate`.**
- **shadcn `form` template fails to install** under bun because `msw`'s
  postinstall crashes. The `components/ui/form.tsx` file is hand-written
  (canonical shadcn snippet) — don't try to `bunx shadcn add form`.
- **Decimal serialization** — anywhere a Prisma row crosses an RSC → Client
  Component boundary, Decimals need to be `.toString()`ed first. The detail
  page mappers do this; new mappers must too.
- **Theming drift between apps** — `bunx shadcn add <tweakcn-url>` only
  rewrites the app you run it in. Always run it in **both** `apps/onboarding`
  and `apps/dashboard` so they stay synced.
- **`nativeButton={false}` is required** whenever a Button's `render` prop is
  a non-`<button>` element (i.e., a Link). Base UI's Button asserts the
  underlying element is a native button by default.
- **`openMultiple` is a Base UI fiction** — it isn't a real prop. Base UI's
  Accordion accepts a `value` array (controlled) or `defaultValue` array
  (uncontrolled). Don't reach for radix's `type="multiple"`.
- **Building IDs aren't UUIDs** — `Building.id` is `Int`. Mutation actions take
  `id: number`, not `uuid: string`. Same for `BuildingCoverage`, `PolicyTransaction`,
  `Invoice`, `SubmissionRecipient`, `CarrierQuote`.

---

## 10. How phases are tracked

- **Major design decisions** → `../docs/development_resources/database_plan.md`
  in the legacy repo (the canonical schema design with rationale).
- **This file** → high-level context for new chats / new contributors.
- **Per-chat session work** → tracked in conversation, summarized as bullets
  when the user asks.
- **In-flight tasks** → Claude's TaskCreate/TaskUpdate within a session.

When in doubt about a model decision, default to **`database_plan.md`**. When in
doubt about a UI decision, default to **the shadcn skill rules at `apps/<app>/.agents/skills/shadcn/SKILL.md`**.

---

## 11. The Django legacy repo

Parent folder (`..`) is the legacy Django app. We don't touch it. The two repos
share zero runtime — they live in separate Postgres databases (`insureinvestors`
or `insureinvestors_v2` for Django, `insureinvestorsv2` for v2). Deleting
`insureinvestorsv2/` cleanly reverts you to legacy.

The legacy app has the models we're reverse-engineering — when in doubt about
domain semantics, look at:
- `../broker/dashboard/` — legacy UI
- `../policy/models/policy.py` — legacy Policy model (the overloaded one)
- `../questionnaire/models.py` — legacy questionnaire engine
- `../AMS360_models/` — Java DTOs from Vertafore AMS360 we used as our relational North Star
