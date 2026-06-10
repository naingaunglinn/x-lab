# x-lab — API Spec

App Router route handlers under `app/api/`. JSON everywhere. snake_case keys (DB shape);
the frontend mapper converts to camelCase (`frontend-integration.md`). Two surfaces:

- **Public read** — `GET /api/storefront`. No auth. Cacheable.
- **Admin** — `/api/admin/*`. Auth + role gated (`auth-rbac.md`). Never cached.

## Conventions

- **Validation:** every write validates its body with a zod schema from `lib/schemas/`
  (the same schema powers the admin form via `@hookform/resolvers`). On failure → `422`.
- **Success:** `200` (read/update), `201` (create), `204` (delete, empty body).
- **List responses:** `{ "data": [ … ] }`. **Single:** `{ "data": { … } }`.
- **IDs** are uuids in the path.
- **Revalidation:** after a successful admin write, call
  `revalidateTag('storefront')` so the public page (which fetches with
  `next: { tags: ['storefront'] }`) refreshes on next request.

## Error shape (all errors)

```json
{ "error": { "code": "validation_error", "message": "…", "fields": { "price": "Required" } } }
```

| HTTP | `code` | When |
|---|---|---|
| 401 | `unauthenticated` | no/invalid session on an admin route |
| 403 | `forbidden` | logged in but role not allowed (e.g. editor hitting `/users`) |
| 404 | `not_found` | unknown id |
| 409 | `conflict` | unique violation (slug, second featured product) |
| 422 | `validation_error` | zod failure; `fields` map included |
| 500 | `server_error` | unexpected |

Frontend `lib/errorHandler.ts`-style normalizer recommended; never read nested error
internals directly in components.

---

## Public: `GET /api/storefront`

One aggregated payload for the homepage (single round-trip, ISR-cached).

**Response `200`:**
```json
{
  "data": {
    "categories": [
      { "id": "uuid", "name": "Stickers", "slug": "stickers", "filterLabel": "01 // WEATHERPROOF STICKERS", "productCount": 3 }
    ],
    "products": [
      {
        "id": "uuid", "slug": "warning-decal-v1", "index": "01",
        "title": "LABS // WARNING_DECAL_V1", "categorySlug": "stickers",
        "priceNum": 12.0, "priceStr": "$12.00",
        "image": "https://…/product-images/…png",
        "description": "…", "accent": "#8F1D14", "tagBadge": "STREETWEAR LOG",
        "isFeatured": false, "soldOut": false, "stock": 25,
        "specs": { "material": "…", "thickness": "…" }
      }
    ],
    "sandboxStickers": [
      { "id": "uuid", "label": "☣️ DANGER_HIGH_VOLTAGE", "color": "#8F1D14", "width": 140, "rot": -8 }
    ],
    "site": {
      "banner": { "status": "…", "version": "…", "sector": "…" },
      "header": { "brandWordmark": "X // LAB.", "coord": "COORD / 45.10.99", "sector": "SECTOR: EUROPE_AMERICA" },
      "hero": { "seriesLabel": "[ SERIES 001 // THE LAUNCH ]", "wordmark": "lab.", "subtitle": "MATERIAL_SYSTEM_01", "paragraph": "…", "index": "001", "overlayText": "FUTURE CONCEPT LABS" },
      "footer": { "brand": "X // LABS", "tagline": "…", "copyright": "…", "systemSpec": "EST: 2026 // UTC" }
    },
    "marquee": ["● CODES: PREMIUM HEAVY VINYL SEALS …", "…"],
    "footerLinks": {
      "decalCodes": ["// COGNITIVE_OVERLOAD_ACTIVE", "…"],
      "gearSensors": ["// THERMO_RESPONSIVE_GLOVES", "…"]
    }
  }
}
```

- Only **active/visible** rows (RLS `anon` predicate). Ordered by each table's `position`.
- `specs` is the ordered `product_specs` collapsed into an object (label→value).
- The featured product is also flagged with `isFeatured` so the hero can pick it.

---

## Admin endpoints

All require auth; `editor`+ unless marked **admin-only**. Bodies validated by zod.

### Products
```
GET    /api/admin/products            list (all statuses); ?category=&status=&search=
POST   /api/admin/products            create
GET    /api/admin/products/[id]       single (with specs)
PATCH  /api/admin/products/[id]       partial update (incl. replacing specs array)
DELETE /api/admin/products/[id]       delete (cascades specs)
```
**Create/Update body:**
```json
{
  "categoryId": "uuid", "slug": "warning-decal-v1", "indexLabel": "01",
  "title": "LABS // WARNING_DECAL_V1", "price": 12.00, "description": "…",
  "imagePath": "products/abc.png", "accent": "#8F1D14", "tagBadge": "STREETWEAR LOG",
  "status": "active", "isFeatured": false, "position": 0,
  "stockQuantity": 25, "allowBackorder": false,
  "specs": [ { "label": "material", "value": "3M Cast Vinyl", "position": 0 } ]
}
```
Rules: `specs` is **replace-all** (delete + reinsert in one transaction — mirrors ANKA's
child-record pattern). Setting `isFeatured:true` clears any other featured product in the
same transaction (or rely on the partial unique index → `409`).

### Categories
```
GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/[id]
DELETE /api/admin/categories/[id]     409 if products reference it (RESTRICT)
```
Body: `{ "name", "slug", "filterLabel", "position", "isActive" }`.

### Sandbox stickers
```
GET    /api/admin/sandbox-stickers
POST   /api/admin/sandbox-stickers
PATCH  /api/admin/sandbox-stickers/[id]
DELETE /api/admin/sandbox-stickers/[id]
```
Body: `{ "label", "color", "width", "defaultRotation", "position", "isActive" }`.

### Site content (singleton)
```
GET /api/admin/site-content     the one row
PUT /api/admin/site-content     full upsert of the singleton
```
Body: the `site` object (banner/header/hero/footer groups) from the storefront payload.

### Marquee
```
GET/POST            /api/admin/marquee
PATCH/DELETE        /api/admin/marquee/[id]
```
Body: `{ "text", "position", "isActive" }`.

### Footer links
```
GET/POST            /api/admin/footer-links     ?group=decal_codes|gear_sensors
PATCH/DELETE        /api/admin/footer-links/[id]
```
Body: `{ "group", "label", "url"?, "position", "isActive" }`.

### Uploads
```
POST /api/admin/uploads        multipart or { filename, contentType }
```
- Validates type (`image/png|jpeg|webp|svg+xml`) and size (≤ ~5 MB).
- Server uploads to the `product-images` bucket (service-role or signed URL) and returns
  `{ "data": { "path": "products/<uuid>.<ext>", "url": "https://…" } }`.
- The product form stores `path` in `imagePath`; `url` is for immediate preview.

### Users — **admin-only**
```
GET    /api/admin/users           list staff users
POST   /api/admin/users           create a staff users row (bcrypt-hash password, service-role); body { email, password, role, name }
PATCH  /api/admin/users/[id]      change role / name
DELETE /api/admin/users/[id]      remove (cannot delete self; cannot remove last admin)
```
Guards: 403 for non-admins; block deleting the last remaining `admin`.

---

## Orders & checkout

Full behavior in `orders.md`; shapes here.

### Public: `POST /api/checkout`
Creates an order via the `create_order` RPC (atomic stock decrement). No auth (guest).

**Body:**
```json
{
  "items": [ { "productId": "uuid", "quantity": 2 } ],
  "customer": { "email": "a@b.com", "fullName": "A B", "phone": "+95…" },
  "shipping": { "line1": "…", "line2": null, "city": "…", "region": "…", "postal": "…", "country": "…" },
  "note": "optional"
}
```
**`201`:**
```json
{ "data": {
  "orderNumber": "LAB-100001", "status": "pending",
  "subtotal": 257.00, "shippingFee": 15.00, "total": 272.00,
  "items": [ { "productTitle": "SYNAPSE // SHELL_GLOVE", "unitPrice": 245.00, "quantity": 1, "lineTotal": 245.00 } ]
} }
```
**Errors:** `422` validation; `409 insufficient_stock` with `fields: { items: ["<productId>"] }`;
`404` unknown product. Public write → **rate-limit per IP**; `dynamic` (never cached).

### Admin: orders — **staff (editor+)**, cancel/refund **admin-only**
```
GET    /api/admin/orders          list; ?status=&search=(email|orderNumber)&from=&to=
GET    /api/admin/orders/[id]     order + items + customer + shipping snapshot
PATCH  /api/admin/orders/[id]     { "status": "shipped" } — validates transition (orders.md),
                                  stamps paid_at/shipped_at/cancelled_at; cancel/refund restock
```
No create/delete (orders originate from checkout). Illegal transition → `409`; non-admin
attempting cancel/refund → `403`.

### Optional: customer account — any logged-in customer
```
POST /api/account/register        create users row (role customer) + link/create customers row by email
GET  /api/account/orders          caller's own orders (server-scoped to their customer_id via the Auth.js session)
```

---

## Blog

Full behavior in `blog.md`; shapes here. Public reads typically go through `lib/blog.ts`
(server fetch + ISR), mirroring the storefront.

### Public
```
GET /api/blog            published posts, paginated; ?category=&tag=&page=
GET /api/blog/[slug]     single published post (404 if not public)
```
**Post (single) `200`:**
```json
{ "data": {
  "slug": "the-history-of-kaws", "title": "The History of KAWS",
  "excerpt": "…", "coverImage": "https://…/blog-images/…", "category": "Artist Histories",
  "author": "LAB Editorial", "publishedAt": "2026-06-01T00:00:00Z", "readingMinutes": 7,
  "contentHtml": "<h2>…</h2>…",
  "tags": ["kaws", "street-art"],
  "relatedProducts": [ { "id": "uuid", "slug": "kaws-pack", "title": "…", "priceStr": "$24.00", "image": "…", "soldOut": false } ],
  "seo": { "title": "…", "description": "…", "ogImage": "https://…" }
} }
```
`contentHtml` is the pre-rendered, sanitized TipTap output. Inline `productCard` blocks and
`relatedProducts` carry **live** product data (price/stock current at request time).

### Admin — staff (editor+)
```
GET/POST              /api/admin/posts            list (all statuses) / create draft
GET/PATCH/DELETE      /api/admin/posts/[id]        full post (content_json); PATCH re-renders content_html
POST                  /api/admin/posts/[id]/publish  set status + published_at (publish or schedule)
GET/POST/PATCH/DELETE /api/admin/blog-categories[/id]
GET/POST/DELETE       /api/admin/tags[/id]
```
PATCH `posts` accepts `contentJson`, `tagIds` (replace-all), `productIds` (replace-all,
ordered). Server regenerates `content_html` + `reading_minutes`. Uploads use
`POST /api/admin/uploads` with the `blog-images` bucket.

---

## Caching

| Route | Strategy |
|---|---|
| `GET /api/storefront` | `export const revalidate = 60` (or tag-based). Served from cache; invalidated by `revalidateTag('storefront')` on admin writes. A stock change (order or edit) should also revalidate so `soldOut` stays fresh. |
| `POST /api/checkout` | `dynamic = 'force-dynamic'`; rate-limited. On success, `revalidateTag('storefront')` to refresh stock/sold-out. |
| `/blog`, `/blog/[slug]` | ISR (`revalidate`), tagged `'blog'`. Admin post writes call `revalidateTag('blog')`. |
| `/api/admin/*` | `export const dynamic = 'force-dynamic'` — never cached. |
