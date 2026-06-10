# X // LAB. — Admin Portal & Backend Specs

These specs define a backend + admin portal that makes the currently hard-coded
storefront (`app/page.tsx`) fully editable. They are the source of truth for the
build; read the relevant file before implementing a slice.

## Decisions (locked)

| Axis         | Choice                                                                                                                                                                      |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Stack        | **Next.js full-stack** — App Router route handlers (`app/api/`) + an `(admin)` route group. One repo, one deploy.                                                           |
| UI Framework | **Shadcn** - https://ui.shadcn.com/                                                                                                                                         |
| Color Code   | **Background** - #F7F7F7, **Font** - #1A1C20, **Decoration & highlight** - #929AAB & #393E46 & #EEEEEE Combination.                                                         |
| Data layer   | **Supabase** — Postgres (data) + Storage (image uploads). **NOT Supabase Auth** (see Auth row).                                                                              |
| Admin scope  | **Full CMS** — products, categories, sandbox decals, and site content (hero, marquee, footer, banner)                                                                       |
| Auth         | **Self-hosted Auth.js (NextAuth v5)** — Credentials + JWT sessions, own `users` table. Roles: `admin` / `editor` (staff) + optional `customer`. Server-enforced authz; RLS is defense-in-depth. See `auth-rbac.md`. |
| Orders (OMS) | **Capture orders, no payment** (admin marks paid/fulfilled) · **guest checkout + optional account** · **stock tracked** (atomic decrement) · no emails v1 — see `orders.md` |
| Blog         | **TipTap block editor** (WordPress-like, JSON→HTML) · blog categories + tags · **post↔product cross-linking** · public pages in Neo-Brutalist style — see `blog.md` |

## Spec index

| File                      | Contents                                                                                                    |
|---------------------------|-------------------------------------------------------------------------------------------------------------|
| `overview.md`             | Architecture, modules, folder structure, data flow, env vars, new dependencies                              |
| `data-model.md`           | Postgres schema (every table + field), relationships, enums, Storage buckets, RLS policies, seed plan       |
| `auth-rbac.md`            | Auth.js (NextAuth) credentials + JWT, `users`/roles, server-enforced authz, RLS as defense-in-depth         |
| `api.md`                  | Public read API + admin write API: routes, request/response shapes, validation, error format                |
| `orders.md`               | Order management: lifecycle, stock rules, `create_order` RPC, checkout + admin order API, customer accounts |
| `blog.md`                 | Blog: TipTap block editor, post/category/tag model, post↔product cross-linking, public `/blog`, admin editor |
| `admin-portal.md`         | Admin UI: route map, pages, forms, image-upload UX, components                                              |
| `frontend-integration.md` | Refactor of `app/page.tsx` to consume the API (server fetch + ISR, mappers, fallback)                       |

## Guiding principles

1. **The storefront look is preserved.** It reads from the DB instead of inline arrays; the current hard-coded data becomes the **seed**. The only intentional additions are a **checkout form** (to capture customer + shipping) and **sold-out** states — built in the existing Neo-Brutalist style.
2. **The frontend `Product` shape is the contract.** API responses map to the exact shapes `page.tsx` already consumes (see `frontend-integration.md`). Preserve `priceStr`/`priceNum`, `accent`, `tagBadge`, `specs`, etc.
3. **Public reads are open; writes require a logged-in `admin`/`editor`.** Authz is **server-enforced** — every `/api/admin/*` handler checks the Auth.js session + role and writes with the service-role client. Public reads use the anon key + RLS public-read policies; RLS is defense-in-depth, not the user-level gate (auth is Auth.js, not Supabase Auth).
4. **Preserve the design language.** Admin UI is functional, but the public page keeps the Neo-Brutalist system (see the `lab-design-system` skill); see `CLAUDE.md`.
