---
name: lab-design-system
description: The X // LAB. Neo-Brutalist visual language — exact palette, typography, borders/shadows, motion, and interaction patterns. Use whenever building, editing, or restyling any UI in this repo (app/page.tsx, new components/sections) so the result stays on-brand.
---

# X // LAB. design system

A stark, editorial Neo-Brutalist "digital laboratory" aesthetic. Match it precisely — the look is intentional, not arbitrary. Styling is done with hard-coded Tailwind arbitrary values (e.g. `bg-[#1B120F]`), NOT theme tokens.

## Palette (exact hex)

| Role | Hex | Usage |
|---|---|---|
| Paper (base bg) | `#E6DEDD` | page background, light surfaces |
| Ink (text/borders) | `#1B120F` | body text, 2px borders, dark blocks |
| Crimson (accent) | `#8F1D14` | primary accent, hover states, alerts |
| Orange (accent) | `#F89D13` | secondary/active accent, highlights, status dots |

Dark zones (e.g. the sandbox) use `zinc-900/950` for a matte-black panel against the paper.

## Typography

- **JetBrains Mono everywhere** (set globally via `--font-mono` in `app/layout.tsx` + `globals.css`). All UI is monospace.
- Liberal use of `uppercase`, `tracking-widest`/`tracking-tighter`, tiny sizes (`text-[10px]`, `text-[9px]`) for technical labels.
- Numeric/system framing: index numbers (`01`, `02`), fake coordinates, status codes, `//` separators (`X // LAB.`, `SYSTEM_OVERRIDE`).

## Structure & borders

- **Swiss grid**: heavy use of `grid grid-cols-12`, asymmetric column spans, visible `border-2 border-[#1B120F]` dividers between cells.
- **Hard offset shadows** instead of soft blur: `shadow-[8px_8px_0px_#1B120F]` (and `[6px_6px_0px_...]`). No rounded corners on structural blocks (sharp `rounded-none` feel); only device mockups (laptop) get radius.
- **Press feedback**: `active:translate-x-0.5 active:translate-y-0.5` / `active:scale-95` on buttons.

## Motion

- `motion` (Framer Motion) with **0.3s** transitions as the house standard: `transition={{ duration: 0.3 }}`.
- `AnimatePresence` for mounting/unmounting (cards, stickers, drawer). Drawer slides in from `x: '100%'`. Marquee uses an infinite linear `x` animation.

## Interaction patterns

- **WebAudio sound feedback**: every interactive action calls a native-oscillator `playBeep(freq, type, duration)` (no library). New interactive elements should beep too, and respect the global `soundEnabled` toggle.
- Hover reveals: grayscale images → color on hover, badges fade in (`opacity-0 group-hover:opacity-100`).
- Copy tone: terminal/lab jargon — `SPEC_REPORT`, `RESET CANVAS`, `STATUS: VERIFIED RESISTANT`, AES-256 / weatherproof flavor.

## When adding UI

Reuse these tokens and patterns rather than introducing new colors, soft shadows, sans-serif fonts, or non-0.3s timings. If a genuinely new color/treatment is needed, flag it rather than silently diverging.
