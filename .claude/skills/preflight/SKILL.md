---
name: preflight
description: Verify a change in the x-lab repo by running ESLint and the production build (type-check + prerender). Use before committing or when asked to confirm a change is sound. Catches what `next build` alone misses, since the build skips ESLint.
---

# Preflight check

Run the full verification combo for this repo and report a clear pass/fail. The two steps are separate on purpose: `next build` has `eslint.ignoreDuringBuilds: true`, so the build never lints — but it DOES enforce TypeScript types.

## Steps

1. **Lint:**
   ```bash
   npm run lint
   ```
2. **Build (type-check + static generation):**
   ```bash
   npm run build
   ```
   The first compile can take ~2 minutes. Run it in the background if needed and wait for completion rather than polling tightly.

## Reporting

- If both pass: say so plainly, and include the build's route/size summary line.
- If lint fails: list the offending files/rules. Many `eslint-config-next` rules are auto-fixable — offer `eslint <file> --fix` (do not bulk-fix unrelated files).
- If the build fails: surface the exact TypeScript error and file:line. Do not "fix" by editing `next.config.ts` to ignore errors.

## Do not

- Do not run `npm audit fix --force` as part of verification — it downgrades `next` to 9.x and breaks the app (see CLAUDE.md).
- Do not touch working features to make a check pass; scope fixes to the actual error.
