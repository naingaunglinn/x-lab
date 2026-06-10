# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**X // LAB.** — a single-page Neo-Brutalist storefront (premium stickers + concept "future gear"). Next.js 15 App Router, React 19, TypeScript, Tailwind v4, `motion` for animation. Scaffolded from Google AI Studio.

Nearly all UI lives in one large `'use client'` component: `app/page.tsx`. `app/layout.tsx` is the server root (JetBrains Mono font + metadata). There is no component library split — expect to edit the monolith.

## Critical: dependency pinning

**Never run `npm audit fix --force`.** It downgrades `next` from 15.x to 9.3.3, which is incompatible with this app (App Router + React 19 + Tailwind v4) and pulls in ~100 transitive vulns. `next` must stay on `^15.x`. The remaining moderate `npm audit` findings (`postcss` inside Next, `uuid` inside `firebase-tools`) are build/dev-only and are only "fixable" by that same destructive downgrade — leave them.

## Verifying a change

`next build` has `eslint.ignoreDuringBuilds: true` — **the build does NOT run ESLint** — but it DOES enforce TypeScript (`ignoreBuildErrors: false`). So to fully check work, run both:

```bash
npm run lint    # eslint . — not run by the build
npm run build   # type-checks + prerenders; the real TS gate
```

Or just use the `/preflight` skill, which runs both. Note: `firebase-tools` makes a clean `npm install` slow (several minutes); the first `npm run build` compile is ~2 min.

## Conventions

- **Import alias:** `@/*` maps to the repo root. Use `@/lib/utils`, `@/hooks/...`, `@/src/assets/images/...` (static images are imported as modules; read `.src` for the URL).
- **Tailwind v4:** styles start with `@import "tailwindcss";` in `app/globals.css` — do NOT use v3 `@tailwind base/components/utilities` directives. Theme tokens go in the `@theme {}` block.
- **`motion`** must stay in `transpilePackages` in `next.config.ts`, or the build breaks.
- **Design language:** see the `lab-design-system` skill before any UI work. Core palette (hard-coded hex, not theme vars): paper `#E6DEDD`, ink `#1B120F`, crimson `#8F1D14`, orange `#F89D13`; JetBrains Mono everywhere; 2px borders + hard offset shadows.

## Planned (not yet built)

`@google/genai` and `GEMINI_API_KEY` (in `.env.example`) are wired for an intended **server-side** Gemini feature that does not exist yet — nothing imports them. Implement AI calls in a Next route handler under `app/api/.../route.ts` (server only; never expose the key client-side). Don't assume AI is live.

**Admin portal + backend** (design only, not built): a Next.js full-stack admin CMS over Supabase makes the hard-coded storefront editable. Specs live in `specs/` — read `specs/README.md` first, then the relevant module spec, before implementing any of it.

## Git workflow

Branch off `main` (PR target) for changes, then open a PR with `gh`. Don't commit directly to the default branch. Commit/push only when asked.
