# x-lab — Frontend Integration

How the public storefront stops using hard-coded arrays and reads from the API, **without
changing how it looks or behaves**. This is the riskiest slice — `app/page.tsx` is a
1,300-line `'use client'` monolith — so the refactor is mechanical and minimal.

## Strategy: server wrapper + client child

Split the current `app/page.tsx` into two files:

```
app/page.tsx               ← NEW: server component. Fetches storefront data, renders <StorefrontClient data={…} />
app/storefront-client.tsx  ← the EXISTING component, renamed, still 'use client'. Now takes data via props
                             instead of reading module-level PRODUCTS_DATA / SANDBOX_STICKERS_LIST / inline copy.
```

`app/page.tsx`:
```tsx
import { getStorefront } from '@/lib/storefront';
import StorefrontClient from './storefront-client';

export const revalidate = 60; // ISR; admin writes also revalidateTag('storefront')

export default async function Page() {
  const data = await getStorefront();   // server-side Supabase read or GET /api/storefront
  return <StorefrontClient data={data} />;
}
```

All interactive state (cart, sandbox placement, sound, clock, drawers) **stays in
`StorefrontClient`** exactly as today. Only the *content source* changes: props instead of
constants.

## `lib/storefront.ts`

- `getStorefront(): Promise<StorefrontData>` — reads via the server Supabase client (or
  fetches `/api/storefront` with `next: { tags: ['storefront'] }`) and maps DB rows to the
  frontend shapes below. Server-only.
- Provides a **fallback**: if the fetch/DB fails, return the bundled seed defaults (keep the
  current arrays exported from `lib/seed-defaults.ts`) so the page never hard-fails. Log the error.

## Frontend types (the contract — keep identical to today's usage)

The existing component consumes a `Product` like this — **preserve it exactly** so the JSX
needs no rework:

```ts
interface Product {
  id: string; index: string; title: string;
  category: string;            // resolved category NAME (e.g. "Stickers") — see mapping note
  priceStr: string; priceNum: number;
  image: string; description: string;
  specs: Record<string, string>;
  accent: string; tagBadge: string;
  soldOut: boolean; stock: number;   // inventory (orders.md); soldOut drives the SOLD OUT badge + disabled add
}

interface StorefrontData {
  categories: { id: string; name: string; slug: string; filterLabel: string; productCount: number }[];
  products: Product[];
  featuredProductId: string | null;   // replaces the PRODUCTS_DATA[1] hard-coded hero pick
  sandboxStickers: { id: string; label: string; color: string; width: number; rot: number }[];
  site: { banner; header; hero; footer };   // shapes per api.md "site"
  marquee: string[];
  footerLinks: { decalCodes: string[]; gearSensors: string[] };
}
```

## Mapping notes (`lib/mappers.ts`)

- **price:** `priceStr = '$' + price.toFixed(2)`; `priceNum = price`. Derive in the mapper —
  never store `priceStr`.
- **image:** `image_path` → public URL via
  `supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl`. If
  `image_path` is null, fall back to the matching bundled `src/assets/images/*` (seed era).
- **specs:** ordered `product_specs` rows → object `{ [label]: value }` (preserve order via
  insertion order / `position`).
- **category:** the grid + filter currently compare `product.category` to a category
  *name*. Map `category_id` → its `name`, OR refactor the filter to use `slug`. The sidebar
  category list + counts come from `data.categories` (the hard-coded filter array with
  `PRODUCTS_DATA.filter(...)` counts is replaced by `productCount`).
- **featured (hero):** today `handleAddToCart(PRODUCTS_DATA[1])` and the hero image use a
  fixed index. Replace with `products.find(p => p.id === featuredProductId)` (fallback to
  `products[0]`).

## Things to delete from `storefront-client.tsx`

- Module-level `PRODUCTS_DATA` and `SANDBOX_STICKERS_LIST` (moved to DB / `seed-defaults.ts`).
- Hard-coded marquee `<span>` strings, footer `<li>` lists, hero/banner/header copy →
  driven by `props.site`, `props.marquee`, `props.footerLinks`.
- The `PRODUCTS_DATA[1]` featured reference and `PRODUCTS_DATA.filter(...)` filter counts.

## Checkout flow (OMS — see `orders.md`)

The cart stays entirely client-side **until submit**. The change is at the checkout step:

- **Add-to-cart respects stock:** sold-out products show a `SOLD OUT` badge and a disabled
  add button; cart quantity can't exceed `product.stock`.
- **`INITIALIZE_SECURE_CHECKOUT`** no longer fakes a receipt immediately. It opens a
  **checkout form** (email, full name, phone, shipping address, optional note) in the cart
  drawer, styled in the existing Neo-Brutalist system.
- **Submit** → `POST /api/checkout` with `{ items:[{productId, quantity}], customer, shipping, note }`.
  - `201` → render the **existing receipt confirmation populated from the real order**
    (`orderNumber`, `total`, line items), then clear the cart. `generateReceiptManifest` is
    repurposed to format the real response — keep the look, drop the fake data.
  - `409 insufficient_stock` → show which items, refresh storefront (stock changed), let the
    user adjust quantities.
- **Optional account:** after success, offer "create an account to track this order"
  (Supabase customer auth). `/account/orders` lists their orders. Fully optional — guest
  checkout is the default path.

## Blog touchpoints on the storefront (see `blog.md`)

The public blog lives at `/blog` + `/blog/[slug]` (separate server-rendered pages, Neo-
Brutalist style — specced in `blog.md`). The storefront itself gains only two small hooks:

- **Nav link:** add a `BLOG` / `LABS JOURNAL` link to the header and/or footer (`site_content`
  could later make the label editable; hard-code it for v1).
- **"RELATED LOGS" on a product:** the product detail drawer shows published posts linked via
  `post_products` for that product (reverse of "shop this pack"). Include this list in the
  product's data (extend the storefront mapper or fetch on drawer open). Hidden when empty.

These are additive and styled in the existing system; they don't alter the catalog refactor.

## Things that stay client-side (NOT content — do not move to DB)

Live clock, cart state + totals **before submit**, sandbox placement math
(`generateStickerSpecs`), `playBeep` synth, sound toggle, all drawers/animations.
`generateReceiptManifest` stays — but is fed the real order response instead of inventing one.

## Revalidation contract

Admin writes call `revalidateTag('storefront')` (see `api.md`). `getStorefront()` tags its
read with `'storefront'`. Net effect: an edit in the admin portal appears on the public
page within one request, no redeploy.

## Verification

After the refactor, the storefront must be **pixel-identical** to the seeded state. Verify
with `/preflight` (lint + build) and, once Playwright Chrome is installed, screenshot
`/` before vs. after seeding to confirm parity.
