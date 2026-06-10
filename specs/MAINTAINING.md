# x-lab — Maintaining These Specs

How to **use**, **fix**, and **extend** the spec suite. Read this before editing any
other file in `specs/`.

## These are design docs, not code

You don't "run" a spec — they're markdown. There are two things you do with them:

1. **Use them (while building).** Read the relevant spec *before* writing code, treat it
   as the source of truth, then verify the resulting app with the real gates:
   `npm run lint` + `npm run build` (or the `/preflight` skill). The build is the TS gate;
   lint is separate (see `CLAUDE.md`).
2. **Maintain them (fix / extend).** Edit the docs themselves — that's what the rest of
   this file covers.

Implementation order, when you do build, is the phase table in `overview.md` /
`README.md`. Phases 1→4 are the spine; build each on its own feature branch off `master`,
never on the docs branch.

## 1. Every fact has one canonical home

The suite is heavily cross-referenced, so each fact lives in exactly **one** owner file.
Always edit the owner first, then propagate. Getting this wrong makes the specs silently
contradict each other.

| If you're changing…           | Canonical file (edit first) | Then propagate to…                                                                            |
|--------------------------------|-----------------------------|-----------------------------------------------------------------------------------------------|
| A DB table / column / enum     | `data-model.md`             | `api.md` (req/response shape), `admin-portal.md` (form field), `frontend-integration.md` (mapper + `Product` shape) |
| An API route or payload        | `api.md`                    | the feature spec (`orders.md` / `blog.md`), `admin-portal.md` (page that calls it), `overview.md` module table |
| Auth / roles / RLS             | `auth-rbac.md`              | `data-model.md` (RLS summary), every file's "RLS" section                                     |
| A **locked decision**          | `README.md` (Decisions table) | *every* file that relied on it                                                              |
| A new admin page / UX          | `admin-portal.md`           | `overview.md` (folder tree + module table), `api.md` (its endpoints)                          |
| Storefront integration         | `frontend-integration.md`   | `api.md` (the `Product` contract)                                                             |

`README.md` is the **index + locked decisions** — the entry point. `data-model.md` is the
**schema's single source of truth**; everything else references it rather than redefining
tables.

## 2. Fixing an existing spec

```
1. git checkout master && git checkout -b docs/<short-change>   # new docs branch, off master
2. Read the canonical file for the fact (table above).
3. Edit it.
4. Grep for every reference to the old value, fix all of them:
      grep -rn "old_column_name\|OldDecision" specs/
   A changed field/decision usually appears in 3–7 files. This sweep is non-negotiable.
5. Re-read README's two tables (Decisions + Spec index); update if a decision/module changed.
6. git commit -- specs/        # commit only specs; no Co-Authored-By trailer
7. Open a PR to main when ready.
```

The grep in step 4 is how the Supabase Auth → Auth.js swap stayed consistent across 7
files. Skipping it is the main way these docs drift.

## 3. Adding a new module/feature spec

Create `specs/<feature>.md` using the shared house template below, then wire it into the
index **in the same commit**:

- Add a row to `README.md` → *Spec index* table.
- Add a row to `overview.md` → *Modules* table, plus any new folders to its
  folder-structure block.
- Put the actual tables in `data-model.md` (don't define schema inside the feature file —
  reference it).

### House template

```markdown
# x-lab — <Feature>

<one-paragraph what & why>

## Decisions (locked)
| Axis | Choice |
|---|---|
| … | … |

## Data model
Canonical schema lives in `data-model.md` (add the tables there).
This file is the behavioral spec.

## API (shapes in `api.md`)
### Public   …
### Admin — staff (editor+)   …

## Admin portal (see `admin-portal.md`)   …

## RLS (full SQL in `auth-rbac.md`)   …

## Out of scope (v1)   …
```

## 4. Conventions to preserve

- **Mirror the house style** (modeled on the ANKA specs): locked-decisions table, field
  tables, route-group blocks, explicit response-shape JSON, and generated columns /
  stored functions called out where they exist.
- **"Locked" decisions are deliberate.** Reopening one means editing the `README.md`
  Decisions table *and* every dependent file — and saying so, so it's clearly intentional.
- **`data-model.md` owns the schema.** Reference it; don't duplicate table definitions.
- **Load-bearing decisions other files assume:** money as `numeric`, atomic stock
  decrement via the `create_order` function, and **server-enforced authz** (Auth.js
  session + role check + service-role write; RLS is defense-in-depth). Don't quietly
  contradict these in a feature spec.
