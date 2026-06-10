# x-lab — Blog (Editorial CMS)

A WordPress-style blog: editors compose posts in a **block editor**, attach related
products, and publish to public `/blog` pages in the Neo-Brutalist storefront style.
Use case: sell a sticker pack (e.g. KAWS), publish the artist's history as an article,
cross-link the two.

## Decisions (locked)

| Axis | Choice |
|---|---|
| Editor | **TipTap block editor** — Gutenberg-like blocks; **content stored as JSON** (source of truth), `content_html` derived on save for fast SSR/SEO |
| Product linking | **Bidirectional** — posts attach related products ("shop this pack"); product pages list related articles |
| Taxonomy | **Blog categories + free tags** (separate from product categories) |
| Public theme | **Neo-Brutalist** — matches the storefront (`lab-design-system` skill) |
| Authors | Staff (`users`, role admin/editor); no separate author identity |

Canonical schema (`posts`, `blog_categories`, `tags`, `post_tags`, `post_products`) is in
`data-model.md`. This file is the behavioral spec.

## Content model — blocks

- The editor's document is **TipTap/ProseMirror JSON**, stored in `posts.content_json`.
- On every save the server renders it to sanitized HTML (`@tiptap/html` `generateHTML`)
  into `posts.content_html` — the public page renders that string (fast, SEO-friendly,
  no client editor on the public route).
- **Block set** (StarterKit + custom nodes): heading, paragraph, bold/italic/link,
  bullet/ordered list, blockquote, code, divider, **image** (Storage upload), **gallery**,
  **embed** (YouTube/X via URL), and a custom **`productCard`** block.
  - `productCard` stores `{ productId }` in node attrs. At render time the public page
    fetches the live product (price/stock current) and renders it in the brutalist card
    style with an add-to-cart button. This is the "editable like WordPress" layout freedom.

> Inline `productCard` blocks reference products **in the body**; the `post_products` table
> is the explicit **related-products set** powering the "shop this pack" footer on the
> article and the "related articles" list on the product page. Keep both: body blocks are
> editorial; `post_products` is the queryable relationship.

## Publishing lifecycle

`post_status` enum: `draft | published | archived`.

- **draft** — not public.
- **published** — public **iff** `published_at <= now()`. A published post with a *future*
  `published_at` is effectively **scheduled** — no separate scheduler needed; the public
  query filters `status='published' AND published_at <= now()`.
- **archived** — removed from listings (kept for history / un-publish).

`published_at` is set when first published (editable for back/forward dating).

## SEO & derived fields

- `seo_title`, `seo_description`, `og_image_path` → Next `generateMetadata` per post.
- `reading_minutes` derived from word count on save; `excerpt` for cards/SEO fallback.
- Canonical URL `/blog/<slug>`; `slug` unique, auto-suggested from title, editable.

## Public routes (Neo-Brutalist)

- **`/blog`** — index: published posts (newest first), paginated; filter by category/tag.
  Cards reuse the storefront's bordered/offset-shadow style.
- **`/blog/[slug]`** — article: cover, title, meta (date, category, reading time, author),
  rendered `content_html`, a **"SHOP THIS PACK"** section from `post_products`, and tags.
- Fetched server-side via `lib/blog.ts` (mirrors `lib/storefront.ts`) with ISR +
  `revalidateTag('blog')` on admin writes.
- **Cross-link:** the product detail drawer / page shows **"RELATED LOGS"** — published
  posts linked via `post_products` (see `frontend-integration.md`). Header/footer get a
  `BLOG` / `LABS JOURNAL` nav link.

## API (shapes in `api.md`)

### Public (server-read via `lib/blog.ts`, or optional routes)
```
GET /api/blog            published posts (paginated; ?category=&tag=&page=)
GET /api/blog/[slug]     single published post (404 if draft/scheduled/archived)
```
Public reads only return public-safe fields and live product data for `productCard`/related.

### Admin — staff (editor+)
```
GET    /api/admin/posts            list (all statuses); ?status=&category=&tag=&search=
POST   /api/admin/posts            create (draft)
GET    /api/admin/posts/[id]       full post incl. content_json, tags, products
PATCH  /api/admin/posts/[id]       update; re-renders content_html; replace-all tags/products
DELETE /api/admin/posts/[id]       delete
POST   /api/admin/posts/[id]/publish    set status/published_at (publish or schedule)

GET/POST/PATCH/DELETE  /api/admin/blog-categories[/id]
GET/POST/DELETE        /api/admin/tags[/id]      (create-on-the-fly from the editor)
```
Image uploads reuse `POST /api/admin/uploads` but target the **`blog-images`** bucket
(pass a bucket/folder param). Tags and related products are **replace-all** on PATCH
(same child-record pattern as product specs / order items).

## Admin portal (see `admin-portal.md`)

- **`/admin/posts`** — table: title, category, status badge, published date, author;
  filter/search; "New post".
- **`/admin/posts/[id]`** — the editor page (shadcn UI): title, slug, excerpt, cover-image
  upload, category select, **tags** multi-select (create new inline), **TipTap block
  editor** canvas with a block/insert menu (incl. Insert Product), **related products**
  picker (`post_products`), **SEO** fields, and a publish bar (Save draft · Publish ·
  Schedule with a datetime · Preview ↗). Autosave drafts optional.
- **`/admin/blog-categories`**, **`/admin/tags`** — simple managers.
- Permissions: blog CRUD is **editor+** (content role). No admin-only blog actions.

## RLS (full SQL in `auth-rbac.md`)

- `posts`: anon `select` where `status='published' AND published_at <= now()`; staff read
  all; staff write (`editor+`).
- `blog_categories`, `tags`: anon read (active); staff write.
- `post_tags`, `post_products`: read follows the parent post; writes staff-only.

## New dependencies

| Package | Why |
|---|---|
| `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm` | Block editor (admin only) |
| `@tiptap/extension-image` `-link` `-placeholder` (+ custom `productCard` node) | Editor blocks |
| `@tiptap/html` | Server-side `generateHTML(content_json)` → `content_html` |
| (sanitizer, e.g. `isomorphic-dompurify`) | Defense-in-depth when rendering `content_html` |

## Storage

`blog-images` bucket — public read, staff write (same policy shape as `product-images`,
see `auth-rbac.md`). `posts.cover_image_path`, `og_image_path`, and inline image blocks
store object paths; public URLs built in the mapper.

## Out of scope (v1)

Comments, post revisions/version history, multiple authors per post, newsletter/RSS
(easy to add later — RSS is a single route), AI-assisted drafting (could later use the
planned Gemini integration).
