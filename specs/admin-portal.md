# x-lab — Admin Portal (UI)

A protected `(admin)` route group. Functional and clean — it does **not** use the
Neo-Brutalist storefront aesthetic; it uses **shadcn/ui** with the locked light palette
(see `README.md`): bg `#F7F7F7`, text `#1A1C20`, accents/borders `#929AAB` / `#393E46` /
`#EEEEEE`. Prioritize fast data entry. Forms use `react-hook-form` + `zod` (schemas shared
with the API, `lib/schemas/`).

## Design principles — clean, minimalist, convenient

The admin must feel calm and fast. Operationalized:

- **Minimal chrome.** Generous whitespace, one clear visual hierarchy, hairline `#EEEEEE`
  borders, no gradients/shadows-for-decoration. Let content breathe; align to a simple grid.
- **Restrained color.** Mostly `#F7F7F7`/white surfaces + `#1A1C20` text. `#393E46`/`#929AAB`
  for secondary text, borders, and muted UI. Reserve a single accent for the **one primary
  action** per screen (e.g. Save/Publish); everything else is neutral/ghost.
- **Convenience first.** Fast data entry over visual flourish: sensible defaults, inline
  validation (no surprise errors on submit), autosave drafts where it helps (post editor),
  sticky save/publish bar, and a consistent **list → detail** pattern across every module.
- **Progressive disclosure.** Keep forms scannable — collapse advanced/SEO/less-used fields
  into sections or accordions so the common path is short.
- **Low-friction lists.** Every table has search + the relevant filters, comfortable row
  density, clear status badges, and a helpful empty state with a primary CTA.
- **Predictable + keyboardable.** Same component for the same job everywhere (shadcn
  primitives), real `<label>`s, visible focus rings, `⌘/Ctrl+S` to save, `Esc` to close
  dialogs. Toasts confirm success; destructive actions confirm first.
- **Responsive for laptops.** Optimize for ~1280px+; collapse the sidebar nav gracefully on
  narrow widths. Mobile is nice-to-have, not the target.

These apply to every page below.

## Route map

```
/admin/login                 public; Auth.js email/password sign-in
/admin                        dashboard (counts + quick links)            [editor+]
/admin/products               table; row → edit; "New product" button     [editor+]
/admin/products/new           create form
/admin/products/[id]          edit form (incl. specs repeater + image)
/admin/categories             table + inline create/edit                  [editor+]
/admin/sandbox-stickers       table + inline create/edit                  [editor+]
/admin/site-content           one big sectioned form (banner/header/hero/footer)  [editor+]
/admin/marquee                ordered list editor (add/remove/reorder)     [editor+]
/admin/footer                 two grouped list editors (decal codes / gear sensors) [editor+]
/admin/posts                  post table; filter/search; "New post"         [editor+]
/admin/posts/new|[id]         block editor (TipTap) + meta + publish bar     [editor+]
/admin/blog-categories        blog category manager                         [editor+]
/admin/tags                   tag manager                                   [editor+]
/admin/orders                 order table; filter/search/date range         [editor+]
/admin/orders/[id]            order detail + status transitions             [editor+; cancel/refund admin only]
/admin/users                  user + role management                       [admin only]
```

## Shell — `app/(admin)/layout.tsx`

- Server component. Calls Auth.js `auth()`; if no session or non-staff role → redirect `/admin/login`
  (defense-in-depth alongside `middleware.ts`).
- Renders a left nav (links above; `/admin/users` shown only when role === `admin`),
  a top bar with the signed-in email + sign-out, and `{children}`.
- Reads role once and passes via context so pages can hide admin-only affordances.

## Pages

### `/admin/login`
- Email + password → Auth.js `signIn('credentials', …)`. On success → `/admin`.
- Show auth errors inline. Link/﻿note: first sign-up becomes `admin` (see `auth-rbac.md`).
- (Optional) magic-link sign-in if you prefer passwordless.

### `/admin` (dashboard)
- Cards: # active products, # categories, # sandbox stickers, # marquee lines, last edit.
- **Orders:** new/pending order count, captured-revenue total, low-stock product count.
- Quick links to each editor. A "View storefront ↗" link to `/`.

### `/admin/products` + form
- **List:** table (index, image thumb, title, category, price, status, featured ✓). Filter
  by category/status, search by title. Sort by `position` (drag-to-reorder optional v2).
- **Form fields:** category (select), slug, indexLabel, title, price, description
  (textarea), accent (color input + hex), tagBadge, status (select), isFeatured (toggle —
  warns it unsets the current featured), position.
  - **Image:** drop/upload → `POST /api/admin/uploads` → preview → stores `imagePath`.
  - **Stock:** `stockQuantity` (number) + `allowBackorder` (toggle); show a low-stock hint.
  - **Specs repeater:** add/remove/reorder rows of `{ label, value }` (RHF `useFieldArray`).
- Submit → POST/PATCH `/api/admin/products`. Validation mirrors `lib/schemas/product.ts`.

### `/admin/orders` + detail
- **List:** table (order #, placed date, customer email/name, item count, total, status
  badge). Filter by status, search by email/order #, date range. Sort by date desc.
- **Detail (`/admin/orders/[id]`):** customer + shipping snapshot, line items
  (title / qty / unit / line total), subtotal + shipping + total, customer note, and a
  **status control** offering only valid next transitions (see `orders.md` lifecycle).
  `PATCH /api/admin/orders/[id]` on change. **Cancel/refund** buttons render only for
  `admin` and warn that they restock items. Show the stamped timestamps.

### `/admin/posts` + editor
- **List:** table (title, category, status badge, published date, author); filter by
  status/category/tag, search by title; "New post".
- **Editor (`/admin/posts/[id]`):** the WordPress-like page. Left = the **TipTap block
  editor** canvas with a slash/insert menu (heading, image, gallery, quote, embed, divider,
  **Insert Product** → `productCard`). Right (or top) = post meta: title, slug
  (auto from title, editable), excerpt, cover-image upload, blog category select, **tags**
  multi-select (create inline), **related products** picker (`post_products`, orderable),
  and **SEO** (seo title/description, OG image).
- **Publish bar:** Save draft · Publish · Schedule (datetime → future `published_at`) ·
  Preview ↗ (opens `/blog/<slug>?preview`). Saving re-renders `content_html` server-side.
- Images inside the editor upload to the `blog-images` bucket via `/api/admin/uploads`.

### `/admin/blog-categories`, `/admin/tags`
- Simple table managers (name, slug, position/active). Tags are also creatable inline from
  the post editor.

### `/admin/categories`, `/admin/sandbox-stickers`
- Simple tables with inline or modal create/edit. Sandbox sticker form includes a small
  live swatch (color) and width/rotation numeric inputs.

### `/admin/site-content`
- One form, grouped into **Banner / Header / Hero / Footer** sections matching
  `site_content` columns. `PUT /api/admin/site-content` on save.

### `/admin/marquee`, `/admin/footer`
- Ordered-list editors: add line, edit text, toggle active, reorder (position), delete.
  Footer page shows the two groups (`decal_codes`, `gear_sensors`) side by side.

### `/admin/users` (admin only)
- Table of staff users (email, name, role, created). Create user (email + temp password +
  role). Change role (admin/editor). Delete (guarded: not self, not last admin).
- Page + API both enforce admin; editors never see the nav link.

## Form / data conventions

- **Validation:** `zod` schema per resource in `lib/schemas/`; reused by RHF
  (`zodResolver`) and the route handler. Single source of truth for rules (hex regex,
  price ≥ 0, required fields).
- **Mutations:** call the admin API via the browser; on success show a toast and refresh
  the list. (TanStack Query optional; plain `fetch` + `router.refresh()` is fine.)
- **Optimistic UX not required** for v1 — keep it correct and simple.
- **Accessibility:** real `<label>`s, visible focus rings, keyboard-usable tables.

## UI framework — shadcn/ui
`class-variance-authority`, `clsx`, and `tailwind-merge` are already present, so the
shadcn setup is mostly a `components.json` + the Radix-based primitives the CLI generates.
Install the components actually used (Button, Input, Textarea, Select, Table, Dialog,
Dropdown, Badge, Toast/Sonner, Tabs, Form) rather than all of them. Theme shadcn's CSS
variables to the locked palette above. The **public storefront keeps the Neo-Brutalist
system** — shadcn is for the admin (and the blog editor) only; the two themes don't mix.
