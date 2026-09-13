# Pieter & Joanique — Wedding Website

Astro 7 · React islands · Tailwind 4 · Supabase · Vercel

Public wedding site with RSVP, plus a private admin dashboard (installable PWA)
for the couple to track RSVPs and payments.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Astro 7, `output: 'server'` | Public pages prerender (`export const prerender = true`); RSVP + admin are on-demand |
| UI islands | React 19 | RSVP form, admin dashboard |
| Styling | Tailwind 4 | Brand tokens in `src/styles/global.css` `@theme` — **placeholders until the design lands** |
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

## Routes

| Route | What |
|---|---|
| `/` | Public site (placeholder sections: hero, details, RSVP) |
| `POST /api/rsvp` | Public RSVP submission |
| `/admin/enter/<ADMIN_SECRET>` | Secret link → sets httpOnly cookie → redirects to `/admin` |
| `/admin` | Dashboard (404 without a valid cookie) |
| `POST /admin/logout` | Clears the cookie |
| `GET /api/admin/overview` | Summary + households + guests + payments |
| `POST /api/admin/households` | Add a household to the invite list |
| `PATCH/DELETE /api/admin/households/:id` | Edit / remove |
| `POST/DELETE /api/admin/payments` | Record / remove a payment |
| `GET /api/admin/export.csv` | Spreadsheet export (one row per guest) |

`src/middleware.ts` guards `/admin/*` and `/api/admin/*`.

## Data model (`supabase/migrations/`)

- **households** — one per invitation. `rsvp_status` (pending / attending / declined), `amount_due_cents`, derived `payment_status` (unpaid / partial / paid), admin `notes`, optional `invite_code`.
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

## What's next

1. Drop in the Claude Design reference → replace `@theme` tokens, build out `src/pages/index.astro` and restyle `RsvpForm.tsx` / admin components.
2. Real copy, dates, venue, dress code, accommodation, gift info.
3. Optional: email confirmation on RSVP (Resend), invite-code-only RSVP mode, seating.
