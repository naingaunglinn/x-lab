# x-lab — Architecture Overview

## What we're adding

The storefront in `app/page.tsx` hard-codes `PRODUCTS_DATA`, `SANDBOX_STICKERS_LIST`,
hero copy, marquee strings, and footer links. This backend makes all of it editable
from an admin portal, persisted in Supabase, and served to the public page via an API.
**Identity is self-hosted Auth.js (NextAuth v5)** — Supabase provides only Postgres +
Storage (no Supabase Auth). See `auth-rbac.md`.

```
┌─────────────────────┐      GET /api/storefront (cached/ISR)      ┌───────────────┐
│  Public storefront  │  ◄──── anon key + RLS public-read ───────── │   Supabase    │
│  app/page.tsx       │                                            │  ┌─────────┐  │
└─────────────────────┘                                            │  │ Postgres│  │
                                                                   │  ├─────────┤  │
┌─────────────────────┐   /api/admin/* (Auth.js session + role)    │  │ Storage │  │
│  Admin portal       │  ──── service-role (server-only) ────────► │  └─────────┘  │
│  app/(admin)/admin/*│                                            └───────────────┘
└─────────────────────┘    auth: Auth.js (own `users` table) ───────► JWT cookie
```

## Modules

| Module                            | Public API                  | Admin API                        | Admin pages               | Spec                        |
|-----------------------------------|-----------------------------|----------------------------------|---------------------------|-----------------------------|
| Catalog (products + specs)        | `GET /api/storefront`       | `/api/admin/products*`           | `/admin/products`         | `data-model.md`, `api.md`   |
| Categories                        | (in storefront payload)     | `/api/admin/categories*`         | `/admin/categories`       | `data-model.md`             |
| Sandbox decals                    | (in storefront payload)     | `/api/admin/sandbox-stickers*`   | `/admin/sandbox-stickers` | `data-model.md`             |
| Site content (hero/banner/header) | (in storefront payload)     | `/api/admin/site-content`        | `/admin/site-content`     | `data-model.md`             |
| Marquee lines                     | (in storefront payload)     | `/api/admin/marquee*`            | `/admin/marquee`          | `data-model.md`             |
| Footer links                      | (in storefront payload)     | `/api/admin/footer-links*`       | `/admin/footer`           | `data-model.md`             |
| Media uploads                     | —                           | `/api/admin/uploads`             | (inside product form)     | `api.md`                    |
| Orders & checkout                 | `POST /api/checkout`        | `/api/admin/orders*`             | `/admin/orders`           | `orders.md`                 |
| Customers                         | (optional) `/api/account/*` | (read in orders)                 | `/account/*` (optional)   | `orders.md`, `auth-rbac.md` |
| Blog                              | `/blog`, `/blog/[slug]`     | `/api/admin/posts*` (+cats/tags) | `/admin/posts`            | `blog.md`                   |
| Auth & users                      | —                           | `/api/admin/users*` (admin only) | `/admin/users`            | `auth-rbac.md`              |

## Folder structure (added)

```
app/
  page.tsx                  ← becomes a server wrapper that fetches storefront data
  storefront-client.tsx     ← the existing interactive UI, now a client child (props-driven)
  blog/
    page.tsx                ← public blog index (server + ISR)
    [slug]/page.tsx         ← public article (renders content_html; Neo-Brutalist)
  api/
    storefront/route.ts     ← public aggregated read (GET)
    checkout/route.ts       ← public order placement (POST → create_order RPC)
    account/                 ← optional customer account (register, own orders)
    blog/                    ← optional public blog read routes (index, [slug])
    auth/[...nextauth]/route.ts   ← Auth.js (NextAuth v5) handlers
    admin/
      products/route.ts             ← GET (list), POST
      products/[id]/route.ts        ← GET, PATCH, DELETE
      categories/route.ts           ← GET, POST
      categories/[id]/route.ts      ← PATCH, DELETE
      sandbox-stickers/route.ts     ← GET, POST
      sandbox-stickers/[id]/route.ts← PATCH, DELETE
      site-content/route.ts         ← GET, PUT
      marquee/route.ts              ← GET, POST
      marquee/[id]/route.ts         ← PATCH, DELETE
      footer-links/route.ts         ← GET, POST
      footer-links/[id]/route.ts    ← PATCH, DELETE
      uploads/route.ts              ← POST (signed upload to Storage)
      users/route.ts                ← GET, POST (admin only)
      users/[id]/route.ts           ← PATCH, DELETE (admin only)
      orders/route.ts               ← GET (list)
      orders/[id]/route.ts          ← GET, PATCH (status transition)
      posts/route.ts                ← GET, POST
      posts/[id]/route.ts           ← GET, PATCH, DELETE
      posts/[id]/publish/route.ts   ← POST (publish/schedule)
      blog-categories/…             ← GET, POST, PATCH, DELETE
      tags/…                        ← GET, POST, DELETE
  (admin)/
    layout.tsx              ← admin shell (sidebar nav, session guard)
    admin/
      page.tsx              ← dashboard
      login/page.tsx        ← Auth.js (NextAuth) credentials sign-in
      products/…            ← list + new + [id]/edit
      categories/page.tsx
      sandbox-stickers/page.tsx
      site-content/page.tsx
      marquee/page.tsx
      footer/page.tsx
      orders/…              ← list + [id] detail with status transitions
      posts/…               ← list + [id] TipTap block editor
      blog-categories/page.tsx
      tags/page.tsx
      users/page.tsx        ← admin only
lib/
  auth.ts                   ← Auth.js (NextAuth v5) config: Credentials provider, jwt callbacks
  supabase/
    public.ts               ← anon client — public reads only (RLS public-read)
    service.ts              ← service-role client (server-only; all writes + auth'd reads)
  storefront.ts             ← fetch + map DB rows → frontend Product/site shapes
  blog.ts                   ← fetch + map blog index/post (server + ISR)
  schemas/                  ← zod schemas per resource (shared by API + admin forms)
  mappers.ts                ← snake_case DB ↔ camelCase frontend shapes
middleware.ts               ← Auth.js session; gate /admin, /api/admin, /account
supabase/
  migrations/               ← SQL migrations (schema + RLS + create_order/cancel_order fns + seqs)
  seed.sql                  ← seeds current hard-coded data + stock + bootstrap admin
```

## Data flow

- **Public page load:** `app/page.tsx` (server component) calls `getStorefront()` →
  `GET /api/storefront` (or a direct server-side Supabase read) → maps rows to the
  `Product`/site shapes → renders `<StorefrontClient data={…} />`. Uses ISR
  (`revalidate`) so admin edits appear without a redeploy.
- **Admin edit:** request → middleware + handler verify the Auth.js session + role →
  handler validates with zod → **service-role** Supabase write → on success, revalidate the
  storefront/blog tag so the public page refreshes.

## New dependencies

| Package                 | Why                                                                                                                                                          |
|-------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@supabase/supabase-js` | Supabase client (Postgres + Storage; anon read + service-role). **No `@supabase/ssr`** — auth is Auth.js, not Supabase Auth. |
| `next-auth@beta` (v5)   | Self-hosted auth: Credentials provider, JWT sessions, role in token. See `auth-rbac.md`. |
| `bcryptjs`              | Password hashing for the `users` table (pure-JS; serverless-safe). |
| `zod`                   | Request + form validation (shared schemas). **Note:** `@hookform/resolvers` is already in `package.json` but `zod` and `react-hook-form` are not — add both. |
| `react-hook-form`       | Admin forms                                                                                                                                                  |
| `shadcn/ui` (+ Radix primitives via the CLI) | Admin + blog-editor UI framework (locked in `README.md`); theme its CSS vars to the light palette. **Public storefront stays Neo-Brutalist.** |
| `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/pm` + `@tiptap/html` (+ extensions) | Blog block editor (admin) + server HTML render. See `blog.md`. |

Reuse existing `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`,
Tailwind v4. shadcn builds on these. TipTap and the shadcn Radix primitives are the only
substantial additions, both **admin-only** (not shipped to the public storefront bundle).

## Environment variables (add to `.env.local` and `.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # anon key — public reads only (RLS public-read)
SUPABASE_SERVICE_ROLE_KEY         # server-only; all writes + auth'd reads + storage. NEVER expose client-side.
AUTH_SECRET                       # Auth.js (NextAuth) JWT signing secret
ADMIN_BOOTSTRAP_EMAIL             # seed: first admin account (see auth-rbac.md)
ADMIN_BOOTSTRAP_PASSWORD          # seed: first admin password (rotate after first login)
```

Supabase is used for **Postgres + Storage only** — no Supabase Auth keys/config needed.
`GEMINI_API_KEY` / `APP_URL` already exist (see `CLAUDE.md` — planned AI work, unrelated to this backend).

## In / out of scope (v1)

**In:** content CMS (products, categories, specs, sandbox, site content) · image uploads ·
role-based staff auth · **order management** (persisted orders, atomic stock decrement,
admin fulfillment) · **inventory** · **guest checkout + optional customer accounts**
(see `orders.md`) · **blog** (TipTap block editor, categories/tags, post↔product
cross-linking, public `/blog`) (see `blog.md`).

**Out:** real payments / Stripe (orders are captured, marked paid manually) · email
notifications · taxes & live shipping rates · partial/split fulfillment & returns workflow ·
multi-tenant (single store) · i18n.
