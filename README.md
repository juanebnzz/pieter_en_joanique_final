# Pieter & Joanique — Wedding Website

Astro 7 · React islands · Tailwind 4 · Supabase · Vercel

Public wedding site with RSVP, plus a private admin dashboard (installable PWA)
for the couple to track RSVPs and payments.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Astro 7, `output: 'server'` | Public pages prerender (`export const prerender = true`); RSVP + admin are on-demand |
| UI islands | React 19 | RSVP form, admin dashboard |
| Styling | Tailwind 4 | Sectional colour tokens as CSS custom properties in `src/styles/global.css` (`surface` / `ink` / `rule` / `accent`, resolved per `data-mode`), mapped to utilities in `tailwind.config.mjs`; every section is wrapped in `src/components/site/Section.astro` with a `mode` of linen · burlap · olive (cinnamon is defined but currently unused). Linen is the ground on every page, sections are divided by hairline rules, burlap appears at most once per page as an interlude, and olive is reserved for the home hero, the Our Story interstitial and the footer. Espresso is ink, rule and accent only — never a surface |
| Database | Supabase (`joanique-pieter-2026`, `sduefddcfsurhoyxmfrq`, eu-west-1) | Postgres 17 |
| Hosting | Vercel (`@astrojs/vercel`) | |
| Validation | zod 4 | Shared schema in `src/lib/rsvp-schema.ts` |

## Setup

```bash
npm install
cp .env.example .env   # already done — fill in SUPABASE_SECRET_KEY
npm run dev
```

`.env` needs:

- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` — filled in
- `SUPABASE_SECRET_KEY` — **paste from** Supabase Dashboard → Project Settings → API Keys → *Secret keys* (`sb_secret_…`). Server-only.
- `ADMIN_SECRET` — generated. The couple's private link is `/admin/enter/<ADMIN_SECRET>`.

## Pages

Built from the Claude Design project "Pieter & Joanique Final" (5b481801). All public pages prerender.

| Route | What |
|---|---|
| `/` | Hero, welcome letter, gallery preview, orientation strip, RSVP CTA |
| `/our-story` | Four chapters, alternating image/text, with a full-bleed quote band |
| `/the-weekend` | Friday/Saturday/Sunday chapter bands + timelines, costs, dress code, directions |
| `/gallery` | Seventeen captioned photos in rows of three, offset pairs and one landscape, click for lightbox (swipe + arrow keys) |
| `/faq` | Eight questions |
| `/rsvp` | Live RSVP form — attending or declining |
| `POST /api/rsvp` | RSVP submission (server recomputes the accommodation total) |

Design details carried across: the locked five-colour palette (literals live only in the token layer; there are no raw palette utilities), Cormorant Garamond + Jost,
`cqw` spacing off `.site`, scroll-reveal at 92% of the viewport, and the overlay/bar nav variants.
The design’s "Design preview only" badge is dropped — this form is live.

## Admin

| Route | What |
|---|---|
| `/admin/enter/<ADMIN_SECRET>` | Secret link → sets httpOnly cookie → redirects to `/admin` |
| `/admin` | Dashboard (404 without a valid cookie) |
| `POST /admin/logout` | Clears the cookie |
| `GET /api/admin/overview` | Summary + households + guests + payments |
| `POST /api/admin/households` | Add a household to the invite list |
| `PATCH/DELETE /api/admin/households/:id` | Edit / remove |
| `POST/DELETE /api/admin/payments` | Record / remove a payment |
| `GET /api/admin/export.csv` | Spreadsheet export (one row per guest) |

`src/middleware.ts` guards `/admin/*` and `/api/admin/*`.

## Pricing

`src/lib/pricing.ts` is the single source of truth, used by both the form’s running total and the server:
R2 100 pp (Fri + Sat) or R965 pp (Sat only), R270 per child per night. The R100 per-guest Dinokeng
conservation fee is paid at the reserve gate, not to the couple, so it is never part of a quote. The client
total is display-only — `/api/rsvp` recomputes it before storing.

## Data model (`supabase/migrations/`)

- **households** — one per invitation. `rsvp_status` (pending / attending / declined), `stay` (friday_saturday / saturday), `children_count`, `dietary`, `amount_due_cents`, derived `payment_status` (unpaid / partial / paid), admin `notes`, optional `invite_code`.
- **guests** — people in a household; `attending`, `is_child`, `dietary`.
- **payments** — ledger of money received. A trigger recomputes `households.payment_status`.
- **rsvp_submissions** — raw audit log of every form post.
- **household_overview** — view with guest counts and paid/outstanding totals.

Security: RLS is on for every table with **no policies**. Only the server (secret key) can read or write; the browser never talks to Supabase directly. Migrations are applied to the live project already — keep this folder in sync when you change the schema.

## Admin PWA

`public/admin/manifest.webmanifest` + `public/admin/sw.js`, scoped to `/admin/`.
Once the couple has opened their secret link once, "Add to Home Screen" installs the dashboard;
it opens at `/admin` using the stored cookie and shows the last-loaded data when offline.
Icons in `public/admin/icon-*.png` are placeholders — swap for the brand mark.

## Deploy (Vercel)

Set the same env vars in the Vercel project (`SUPABASE_SECRET_KEY` and `ADMIN_SECRET` as *sensitive*), then `vercel deploy`.
The cookie is only set `secure` over https, so the secret link must be opened on the real domain, not `http://`.

## Photos

`src/assets/photos/gallery/g-01…46.jpg` — the full engagement shoot, resized to 2400px from
the originals in `pieterandjoaniqueengagement-photo-download-1of1/` (gitignored, 510 MB).
Astro generates responsive WebP at build time. Photography by Bitiah.

## What's next

1. Paste `SUPABASE_SECRET_KEY` into `.env` so RSVPs can save.
2. Swap the admin PWA icons in `public/admin/` for the couple's monogram.
3. Optional: RSVP confirmation email (Resend), invite-code-only RSVP, seating.
