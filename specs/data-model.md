# x-lab — Data Model

Postgres (Supabase). All tables in the `public` schema. Conventions:
`id uuid default gen_random_uuid() primary key`, `created_at timestamptz default now()`,
`updated_at timestamptz default now()` (bumped by a trigger). Snake_case columns;
the frontend mapper converts to the camelCase shapes in `frontend-integration.md`.

Source of every field is the hard-coded data in `app/page.tsx` (`PRODUCTS_DATA`,
`SANDBOX_STICKERS_LIST`, hero/marquee/footer JSX). Nothing should be lost in migration —
see **Seed plan** at the end.

---

## Enums

```sql
create type product_status as enum ('draft', 'active', 'archived');
create type user_role      as enum ('admin', 'editor', 'customer');
create type footer_group   as enum ('decal_codes', 'gear_sensors');
create type order_status    as enum ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type post_status     as enum ('draft', 'published', 'archived');
```

`category` is **not** an enum — it's the `categories` table (admin-editable), so the
sidebar filters become data-driven. The legacy `'Stickers'` values
seed as two category rows.

---

## `categories`
Drives the catalog filter sidebar (`01 // …`, counts) and product grouping.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | varchar(80) | machine/display name, e.g. `Stickers` |
| `slug` | varchar(80) UNIQUE | e.g. `stickers` |
| `filter_label` | varchar(120) | sidebar label, e.g. `01 // WEATHERPROOF STICKERS` |
| `position` | int default 0 | sort order in the sidebar |
| `is_active` | boolean default true | |
| timestamps | | |

---

## `products`
The catalog grid + spec drawer. One row per `PRODUCTS_DATA` item.

| Field             | Type                            | Notes                                                                                  |
|-------------------|---------------------------------|----------------------------------------------------------------------------------------|
| `id`              | uuid PK                         | (the old string id like `sticker-01` is dropped; use `slug`)                           |
| `category_id`     | uuid FK → categories            | RESTRICT delete (block deleting a category in use)                                     |
| `slug`            | varchar(120) UNIQUE             | stable identifier, e.g. `warning-decal-v1`                                             |
| `index_label`     | varchar(8)                      | the displayed `"01"`, `"02"` … (not necessarily numeric)                               |
| `title`           | varchar(160)                    | e.g. `LABS // WARNING_DECAL_V1`                                                        |
| `price`           | numeric(10,2)                   | source of truth. `priceNum` = this; `priceStr` derived (`$` + 2dp) in the mapper       |
| `description`     | text                            |                                                                                        |
| `image_path`      | text                            | Storage object path in `product-images` bucket (nullable until uploaded)               |
| `accent`          | varchar(7)                      | hex like `#8F1D14`; validated `^#[0-9A-Fa-f]{6}$`                                      |
| `tag_badge`       | varchar(40)                     | e.g. `STREETWEAR LOG`                                                                  |
| `status`          | product_status default 'active' | only `active` shows on the storefront                                                  |
| `is_featured`     | boolean default false           | the hero "featured model" (currently `PRODUCTS_DATA[1]`). At most one — see rule below |
| `stock_quantity`  | int not null default 0          | inventory; decremented atomically at checkout (see `orders.md`)                        |
| `allow_backorder` | boolean default false           | if true, can sell past 0. Sold out = `stock_quantity <= 0 AND NOT allow_backorder`     |
| `position`        | int default 0                   | grid order                                                                             |
| timestamps        |                                 |                                                                                        |

**Rules**
- Exactly **0 or 1** featured product. Enforce with a partial unique index:
  `create unique index one_featured on products ((is_featured)) where is_featured;`
- `price` is stored numeric; the frontend `priceStr` is **derived**, never stored.
- Deleting a product cascades to its `product_specs`.

---

## `product_specs`
The variable key/value spec map (`specs: { material, thickness, … }`). A child table
(not JSONB) so the admin can add/remove/reorder rows and labels freely.

| Field        | Type               | Notes                                             |
|--------------|--------------------|---------------------------------------------------|
| `id`         | uuid PK            |                                                   |
| `product_id` | uuid FK → products | ON DELETE CASCADE                                 |
| `label`      | varchar(60)        | spec key, e.g. `material`, `thickness`, `sensors` |
| `value`      | varchar(255)       | e.g. `3M Cast Vinyl + UV Scratch Laminate`        |
| `position`   | int default 0      | display order in the spec drawer                  |

Observed labels to seed from: `material, thickness, dimensions, durability, finish,
sensors, power, structure, fit, rating, series, adhesion, transmission, weight,
straps, protocol, charge, print`. (Free-form — not constrained to this set.)

> **Alternative considered:** a single `specs jsonb` column on `products`. Rejected
> for v1 because ordered, individually-editable rows map better to the admin form.
> If you prefer JSONB, collapse this table into `products.specs jsonb` and adjust the
> mapper — the frontend shape (`specs` object) is identical either way.

---

## `sandbox_stickers`
The interactive customizer palette (`SANDBOX_STICKERS_LIST`).

| Field              | Type                 | Notes                                         |
|--------------------|----------------------|-----------------------------------------------|
| `id`               | uuid PK              | (old `sb-1` string dropped)                   |
| `label`            | varchar(60)          | e.g. `☣️ DANGER_HIGH_VOLTAGE` (emoji allowed) |
| `color`            | varchar(7)           | hex; same validation as `accent`              |
| `width`            | int                  | px, e.g. 140; CHECK between 40 and 400        |
| `default_rotation` | int default 0        | the old `rot`; degrees -180..180              |
| `position`         | int default 0        | order in the palette                          |
| `is_active`        | boolean default true |                                               |
| timestamps         |                      |                                               |

---

## `site_content`
Singleton (exactly one row; enforce `id` constant or a `singleton boolean unique`).
Holds all the one-off copy in the page chrome. Grouped by section for the admin form.

| Field                | Type         | Source in page.tsx                         |
|----------------------|--------------|--------------------------------------------|
| `id`                 | uuid PK      |                                            |
| **Banner**           |              | top status bar                             |
| `banner_status`      | varchar(120) | `STATUS: ACTIVE LABORATORY NETWORK`        |
| `banner_version`     | varchar(120) | `// PRE-RELEASE COMPILATION SERIES v4.0.1` |
| `banner_sector`      | varchar(120) | `// ACCENT ALPHA_SECTOR_07`                |
| **Header**           |              |                                            |
| `brand_wordmark`     | varchar(40)  | `X // LAB.`                                |
| `header_coord`       | varchar(60)  | `COORD / 45.10.99`                         |
| `header_sector`      | varchar(60)  | `SECTOR: EUROPE_AMERICA`                   |
| **Hero**             |              |                                            |
| `hero_series_label`  | varchar(120) | `[ SERIES 001 // THE LAUNCH ]`             |
| `hero_wordmark`      | varchar(40)  | `lab.`                                     |
| `hero_subtitle`      | varchar(80)  | `MATERIAL_SYSTEM_01`                       |
| `hero_paragraph`     | text         | the stark-exploration paragraph            |
| `hero_index`         | varchar(8)   | `001`                                      |
| `hero_overlay_text`  | varchar(60)  | `FUTURE CONCEPT LABS`                      |
| **Footer**           |              |                                            |
| `footer_brand`       | varchar(40)  | `X // LABS`                                |
| `footer_tagline`     | text         | future-proof digital showcase paragraph    |
| `footer_copyright`   | varchar(160) | `© 2026 // ALL SYSTEMS ACTIVE…`            |
| `footer_system_spec` | varchar(60)  | `EST: 2026 // UTC`                         |
| timestamps           |              |                                            |

> Live values (clock, cart count, sound toggle) stay client-side — they are not content.

---

## `marquee_items`
The scrolling header ticker (4 `<span>` lines today).

| Field       | Type                 | Notes           |
|-------------|----------------------|-----------------|
| `id`        | uuid PK              |                 |
| `text`      | varchar(255)         | one ticker line |
| `position`  | int default 0        | order           |
| `is_active` | boolean default true |                 |

---

## `footer_links`
The two footer columns (`DECAL CODES`, `FUTURE GEAR SENSORS`).

| Field       | Type                 | Notes                                    |
|-------------|----------------------|------------------------------------------|
| `id`        | uuid PK              |                                          |
| `group`     | footer_group         | `decal_codes` or `gear_sensors`          |
| `label`     | varchar(120)         | e.g. `// COGNITIVE_OVERLOAD_ACTIVE`      |
| `url`       | varchar(255)         | nullable (currently decorative, no href) |
| `position`  | int default 0        | order within the group                   |
| `is_active` | boolean default true |                                          |

---

## `customers`
Buyer profile (distinct from the auth `users` row). Created by the `create_order` flow
(find-or-create by email) for guests, or at registration for account holders. See
`orders.md`, `auth-rbac.md`.

| Field       | Type            | Notes                                                                 |
|-------------|-----------------|-----------------------------------------------------------------------|
| `id`        | uuid PK         |                                                                       |
| `user_id`   | uuid FK → users | nullable, UNIQUE; set only when the customer has an account (role `customer`); null for guests |
| `email`     | citext UNIQUE   | find-or-create key (case-insensitive)                                 |
| `full_name` | varchar(120)    |                                                                       |
| `phone`     | varchar(40)     | nullable                                                              |
| timestamps  |                 |                                                                       |

> Staff (`users.role` ∈ {admin,editor}) have **no** `customers` row; a registered customer
> is a `users` row (role `customer`) linked 1:1 to a `customers` row. See `auth-rbac.md`.

## `orders`
One per checkout. Created exclusively by the `create_order` RPC (see Postgres features).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `order_number` | varchar(20) UNIQUE | `LAB-100001…` via `order_number_seq` |
| `customer_id` | uuid FK → customers | RESTRICT delete |
| `status` | order_status default 'pending' | lifecycle in `orders.md` |
| `email` | citext | contact snapshot (also on customer; kept for history) |
| `full_name` | varchar(120) | snapshot |
| `phone` | varchar(40) | snapshot, nullable |
| `shipping_line1` | varchar(160) | |
| `shipping_line2` | varchar(160) | nullable |
| `shipping_city` | varchar(120) | |
| `shipping_region` | varchar(120) | state/province, nullable |
| `shipping_postal` | varchar(40) | |
| `shipping_country` | varchar(80) | |
| `subtotal` | numeric(10,2) | sum of line totals (set by RPC) |
| `shipping_fee` | numeric(10,2) default 15.00 | the current "$15 surface dispatch" |
| `total` | numeric(10,2) **GENERATED** | `subtotal + shipping_fee` — never set from app code |
| `note` | text | customer note, nullable |
| `placed_at` | timestamptz default now() | |
| `paid_at` | timestamptz | set on → paid |
| `shipped_at` | timestamptz | set on → shipped |
| `cancelled_at` | timestamptz | set on → cancelled/refunded |
| timestamps | | |

## `order_items`
Line items, with product snapshots so history is stable.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `order_id` | uuid FK → orders | ON DELETE CASCADE |
| `product_id` | uuid FK → products | ON DELETE SET NULL (keep history if product removed) |
| `product_title` | varchar(160) | snapshot at purchase |
| `unit_price` | numeric(10,2) | snapshot at purchase |
| `quantity` | int | CHECK > 0 |
| `line_total` | numeric(10,2) **GENERATED** | `unit_price * quantity` — never set from app code |

## `blog_categories`
Blog-specific categories (distinct from product `categories`). See `blog.md`.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | varchar(80) | e.g. `Artist Histories` |
| `slug` | varchar(80) UNIQUE | |
| `description` | text | nullable |
| `position` | int default 0 | |
| `is_active` | boolean default true | |
| timestamps | | |

## `tags`
Free-form, shared across posts.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | varchar(60) | |
| `slug` | varchar(60) UNIQUE | created-on-the-fly from the editor |

## `posts`
Blog articles. Content authored as TipTap JSON; HTML derived on save (`blog.md`).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | varchar(160) UNIQUE | `/blog/<slug>` |
| `title` | varchar(200) | |
| `excerpt` | text | card/SEO fallback summary |
| `cover_image_path` | text | Storage path in `blog-images`, nullable |
| `content_json` | jsonb | TipTap/ProseMirror doc — **source of truth** |
| `content_html` | text | rendered + sanitized on save; what the public page outputs |
| `blog_category_id` | uuid FK → blog_categories | SET NULL |
| `author_id` | uuid FK → users | SET NULL (staff author) |
| `status` | post_status default 'draft' | |
| `published_at` | timestamptz | public iff `status='published' AND published_at <= now()` (future = scheduled) |
| `reading_minutes` | int | derived from word count on save, nullable |
| `seo_title` | varchar(200) | nullable |
| `seo_description` | varchar(320) | nullable |
| `og_image_path` | text | Storage path, nullable |
| timestamps | | |

**Rules**
- Public predicate everywhere: `status = 'published' AND published_at <= now()`.
- `content_html` and `reading_minutes` are **derived** — never authored directly.

## `post_tags` (join)
| Field | Type | Notes |
|---|---|---|
| `post_id` | uuid FK → posts | ON DELETE CASCADE |
| `tag_id` | uuid FK → tags | ON DELETE CASCADE |
| PK | | `(post_id, tag_id)` |

## `post_products` (join — "shop this pack" / "related logs")
| Field | Type | Notes |
|---|---|---|
| `post_id` | uuid FK → posts | ON DELETE CASCADE |
| `product_id` | uuid FK → products | ON DELETE CASCADE |
| `position` | int default 0 | order in the "shop this pack" section |
| PK | | `(post_id, product_id)` |

## `users` (Auth.js identity)
Our own identity table — replaces Supabase `auth.users` **and** the old `profiles`.
Carries the role for both staff and account-holding customers. See `auth-rbac.md`.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | citext UNIQUE | login id |
| `password_hash` | text | bcrypt (`bcryptjs`) |
| `name` | varchar(120) | nullable |
| `role` | user_role default 'customer' | `admin` \| `editor` (staff) or `customer` |
| `email_verified_at` | timestamptz | nullable (verification skippable in v1) |
| timestamps | | |

No `sessions`/`accounts` adapter tables — Auth.js uses JWT sessions (add them only if you
introduce OAuth/DB sessions later). Provisioning rules + bootstrap admin in `auth-rbac.md`.

---

## Relationships

```
categories 1───* products 1───* product_specs
products   1───* order_items *───1 orders *───1 customers 0..1───1 users
users (role admin|editor|customer)   (customers.user_id nullable: guest vs account)
blog_categories 1───* posts *───1 users (author)
posts *───* tags (post_tags)   posts *───* products (post_products)
(singletons: site_content)
(flat lists: sandbox_stickers, marquee_items, footer_links)
```

---

## Storage buckets

| Bucket | Public | Contents |
|---|---|---|
| `product-images` | read: public (anon); write: server only | product photos referenced by `products.image_path` |
| `blog-images` | read: public (anon); write: server only | post covers, OG images, inline editor images (`blog.md`) |

Public read via bucket policy (anon). Uploads go through `POST /api/admin/uploads`, which
writes with the **service-role** client after the Auth.js role check (no client-side upload
key). Store only the **object path** in `image_path`/`cover_image_path`; build the public
URL in the mapper (`supabase.storage.from('product-images').getPublicUrl(path)`).

---

## Row-Level Security (summary; full policies in `auth-rbac.md`)

Auth is **Auth.js, not Supabase Auth**, so RLS can't key off the logged-in user
(`auth.uid()` is null). Authz is **server-enforced**; RLS is defense-in-depth. RLS **on**
for every table.

- **Public read** (`anon` only): `select` on `categories`, `products` (where
  `status='active'`), `product_specs`, `sandbox_stickers` (`is_active`), `site_content`,
  `marquee_items` (`is_active`), `footer_links` (`is_active`), and `posts`/blog tables
  (published predicate). These power the public storefront/blog via the **anon** key.
- **Everything else** (`users`, `customers`, `orders`, `order_items`, all writes, and admin
  reads of drafts) has **no anon policy** → reachable only by the **service-role** Supabase
  client, used **server-side after an Auth.js role check** (`admin`/`editor`; cancel/refund
  and `/users` are `admin`-only). Customers read their own orders via a server route that
  resolves `customers.id` from the session — not via RLS. Full detail in `auth-rbac.md`.

---

## Postgres-specific features

Mirrors ANKA's stored-procedure / generated-column conventions.

| Feature | Details |
|---|---|
| `create_order(p_payload jsonb)` | Transactional SP — atomically validates stock, decrements `products.stock_quantity`, find-or-creates the `customers` row, inserts `orders` + `order_items`. Called server-side (service-role) from `/api/checkout`. Sole creator of orders. See `orders.md`. |
| `cancel_order(p_order_id uuid, p_refund boolean)` | Sets terminal status + restocks line quantities. |
| `order_number_seq` | Generates `LAB-100001`, `LAB-100002`, … (start 100000) |
| `orders.total` | `GENERATED ALWAYS AS (subtotal + shipping_fee) STORED` — never written from app code |
| `order_items.line_total` | `GENERATED ALWAYS AS (unit_price * quantity) STORED` — never written from app code |
| `one_featured` partial unique index | enforces ≤1 featured product (see `products`) |
| `updated_at` trigger | bumps `updated_at` on row update across tables |

---

## Seed plan (`supabase/seed.sql`)

Migrate the existing hard-coded data so the storefront is unchanged on first load:

1. Insert 2 `categories`: `Stickers` (`01 // WEATHERPROOF STICKERS`), `Future Gear`
   (`02 // COGNITIVE LAB GADGETS`).
2. Insert the 6 `PRODUCTS_DATA` rows → `products` (+ `product_specs` from each `specs`
   object). Map `priceNum`→`price`, `accent`, `tagBadge`→`tag_badge`, `index`→`index_label`.
   Set `is_featured = true` on the current `PRODUCTS_DATA[1]` (`SYNAPSE // SHELL_GLOVE`).
   Seed `stock_quantity` (e.g. 25 each) so products aren't sold out on day one.
   For images: upload the three `src/assets/images/*.png` to `product-images` and set
   `image_path`; until then, the mapper falls back to the bundled asset.
3. Insert the 6 `SANDBOX_STICKERS_LIST` rows → `sandbox_stickers` (`rot`→`default_rotation`).
4. Insert one `site_content` row from the hero/banner/header/footer JSX strings.
5. Insert the 4 `marquee_items` and the 8 `footer_links` (4 per group).
6. Insert the **bootstrap admin** `users` row: `role='admin'`, `password_hash` =
   bcrypt(`ADMIN_BOOTSTRAP_PASSWORD`), `email` = `ADMIN_BOOTSTRAP_EMAIL` (see `auth-rbac.md`).
