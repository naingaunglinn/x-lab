# x-lab — Auth & RBAC

**Self-hosted Auth.js (NextAuth v5)** — Credentials provider (email + password), JWT cookie
sessions. **Not** Supabase Auth. Supabase is used only for **Postgres + Storage**; identity
lives in our own `users` table. Unlimited users, no MAU cap.

Two disjoint identities (distinguished by `users.role`):

- **Staff** — `users.role` ∈ {**`admin`** (full, incl. user management), **`editor`**
  (content + order fulfillment, no user management)}. Use the admin portal.
- **Customer** — `users.role = 'customer'`, optionally linked to a `customers` profile row.
  Used only to view order history. **Guest checkout needs no account** (a `customers` row
  is find-or-created by email, with `user_id` null).

## Security model — server-enforced (important)

Because we don't use Supabase Auth, **Postgres RLS can't key off the logged-in user**
(`auth.uid()` is always null — there's no Supabase-issued JWT). So the boundary moves into
the **Next.js server**:

1. **Public reads** (storefront, published blog) use the **anon** Supabase key + RLS
   *public-read* policies. These don't depend on `auth.uid()`, so they still work and the
   anon key stays safe to ship (it can read only public rows).
2. **All writes and all authenticated reads** go through **server route handlers** using the
   **service-role** Supabase client (bypasses RLS), gated first by the **Auth.js session +
   role**. The service-role key is server-only, never exposed.
3. RLS is enabled everywhere as **defense-in-depth**: anon may read only public rows; anon
   may not write. Everything else is reachable only via the service-role server path.

So the real authz gate is the route-handler/middleware check — RLS is the backstop.

## Roles

| Capability                                   | admin   | editor   |
|----------------------------------------------|---------|----------|
| Read storefront / blog (public)              | ✅       | ✅        |
| Products / categories / specs CRUD           | ✅       | ✅        |
| Sandbox decals CRUD                          | ✅       | ✅        |
| Site content / marquee / footer edit         | ✅       | ✅        |
| Blog posts / categories / tags CRUD          | ✅       | ✅        |
| Image uploads                                | ✅       | ✅        |
| View orders + progress fulfillment           | ✅       | ✅        |
| Cancel / refund orders (moves stock & money) | ✅       | ❌        |
| Manage users & roles (`/admin/users`)        | ✅       | ❌        |

Customers aren't staff — they may only place orders and read their **own** order history.

## `users` table (Auth.js identity)

Replaces Supabase `auth.users` **and** the old `profiles` table — role lives here.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | citext UNIQUE | login id |
| `password_hash` | text | bcrypt (`bcryptjs`) |
| `name` | varchar(120) | nullable |
| `role` | user_role default 'customer' | `admin` \| `editor` \| `customer` (enum extended — see `data-model.md`) |
| `email_verified_at` | timestamptz | nullable (v1 can skip verification) |
| timestamps | | |

JWT session strategy → **no `sessions`/`accounts` adapter tables needed**. (Add them later
only if you introduce OAuth providers or DB-backed sessions.)

## Auth.js config — `lib/auth.ts`

- `NextAuth({ providers: [Credentials], session: { strategy: 'jwt' }, callbacks })`.
- **Credentials.authorize(email, password):** look up `users` by email (service-role read),
  `bcrypt.compare`, return `{ id, email, name, role }` or null.
- **callbacks.jwt:** copy `role` + `id` into the token. **callbacks.session:** expose
  `session.user.id` and `session.user.role`.
- `AUTH_SECRET` env signs the JWT. Cookies are httpOnly, secure, sameSite=lax.
- Route: `app/api/auth/[...nextauth]/route.ts` exports the handlers; helpers `auth()`,
  `signIn`, `signOut` are imported across server components/handlers/middleware.

## Session handling — `middleware.ts`

Use Auth.js (`export { auth as middleware }` or wrap it):

```
1. Resolve the session via Auth.js.
2. /admin/* (except /admin/login): no session OR role NOT in {admin,editor} → redirect /admin/login.
3. /api/admin/*: same check → 401 JSON (see api.md error shape).
4. /account/*, /api/account/*: require ANY session (role can be 'customer'); else redirect/401.
5. Fine-grained role (e.g. admin-only /users, cancel/refund) is re-checked in the handler.
matcher: ['/admin/:path*', '/api/admin/:path*', '/account/:path*', '/api/account/:path*']
```

`/`, `/blog/*`, `/api/storefront`, `/api/checkout`, `/api/blog/*` are **not** matched — public.

## Supabase clients (`lib/supabase/`)

| File | Key | Use |
|---|---|---|
| `public.ts` | anon | public reads only (storefront, published blog) — RLS public-read policies apply. Safe on server; not used for writes. |
| `service.ts` | **service role** | all writes + authenticated reads, **server-only**, after the Auth.js role check. Bypasses RLS. NEVER imported into client code. |

No `@supabase/ssr` and no browser Supabase client — auth is Auth.js, so there's no Supabase
session to bind to cookies.

## Provisioning

- **Staff:** created only via `/admin/users` (admin-only) — hash the password (`bcryptjs`),
  insert a `users` row with role `admin`/`editor` (service-role write).
- **Customers (account):** storefront registration → insert `users` (role `customer`) +
  link/create the matching `customers` row (`customers.user_id = users.id`).
- **Guests:** no `users` row; the `create_order` flow find-or-creates a `customers` row by
  email with `user_id` null. If that email later registers, link the existing `customers`
  row to the new `users` row.
- **Bootstrap first admin:** `supabase/seed.sql` / a one-off script inserts a `users` row
  with `role='admin'` and a bcrypt hash from `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`.

## RLS policies (defense-in-depth)

Enable RLS on every table. Only **anon public-read** policies are needed — the service-role
server path bypasses RLS for everything else.

**Public-readable content** (`categories, products, product_specs, sandbox_stickers,
site_content, marquee_items, footer_links`):

```sql
alter table products enable row level security;
create policy products_public_read on products
  for select to anon using (status = 'active');
-- no anon write, no 'authenticated' policies (there is no Supabase-auth role)
```

Apply analogous `*_public_read` to the others (each table's active/`is_active` predicate;
`product_specs`/`site_content` → `using (true)`).

**Blog** (`posts`, `blog_categories`, `tags`, joins):

```sql
alter table posts enable row level security;
create policy posts_public_read on posts for select to anon
  using (status = 'published' and published_at <= now());
```
`blog_categories`/`tags`/joins → anon read (active / `using (true)`).

**Commerce + identity** (`users`, `customers`, `orders`, `order_items`): **no anon policies
at all** → anon can neither read nor write. All access is server-side via the service-role
client after the Auth.js check:

- **Admin order list/detail / status update:** handler verifies `role ∈ {admin,editor}`
  (cancel/refund: `role==='admin'`), then service-role query/update.
- **Customer "my orders":** `/api/account/orders` reads the Auth.js session → `user.id` →
  `customers.id` (where `user_id = session user`) → service-role query of `orders` filtered
  by that `customer_id`. Ownership enforced in code, not RLS.

**Storage** (`product-images`, `blog-images`): anon read; **uploads go through the server**
(`POST /api/admin/uploads`) using the service-role client after the role check — no
authenticated-write storage policy needed.

```sql
create policy "product-images public read" on storage.objects
  for select to anon using (bucket_id in ('product-images','blog-images'));
```

## Route-handler guard (the real gate)

```ts
// pseudo — every /api/admin handler
import { auth } from '@/lib/auth';
const session = await auth();
if (!session) return json401();
if (!['admin','editor'].includes(session.user.role)) return json403();
if (adminOnly && session.user.role !== 'admin') return json403();   // /users, cancel/refund
// ...then use the service-role Supabase client for the DB op
```

## `create_order` and atomicity

`create_order(p_payload jsonb)` stays a **transactional Postgres function** (atomic stock
decrement + find-or-create customer + insert order/items) — see `orders.md`. It's now called
**server-side from `/api/checkout`** via the service-role client (no longer needed as an
RLS-bypass for anon, but still the right place for the atomic transaction). Checkout itself
is public (guest), rate-limited at the route.

## Notes

- `bcryptjs` (pure JS) avoids native-build issues on serverless; `argon2` is an alternative
  if you control the runtime.
- Password reset / email verification are out of scope for v1 (no email provider yet); add
  with the planned email integration later.
