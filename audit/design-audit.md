# Design Audit — Pieter & Joanique wedding site

**Scope:** every file under `src/`, `public/`, and the config/docs, read in full. Diagnosis only; no source files were changed.
**Date:** 13 September 2026. **Commit audited:** `c897152`.
**Method:** static reading of the code plus arithmetic on the values found. Where a conclusion depends on browser rendering (glyph widths, native control chrome, image-over-text contrast) the report says so and states the assumption used. Nothing was rendered.

Viewports used for arithmetic: **390 px** (iPhone 12–15), **768**, **1024**, **1440**, **1920**. All `cqw` values resolve against `.site` (`src/styles/global.css:32`), which is `w-full`, so `1cqw ≈ 1vw` minus any scrollbar.

---

## Executive summary

**1. There is no desktop composition — the site is one centred column that scales with the viewport.**
Every spacing value on the public pages is written in `cqw`, every type size is a `clamp()` whose middle term is `cqw`, and there is not a single `md:`, `lg:` or `xl:` breakpoint anywhere in the public site (the only Tailwind breakpoint is one `sm:grid-cols-2` on the RSVP email/phone pair). Sections are `mx-auto` columns capped at 600/640/680/960/1040/1080 px, and because the cap includes the `6cqw` side padding (Tailwind uses `box-sizing: border-box`), the readable column actually **gets narrower as the screen gets wider**: The Weekend's text column is 557 px wide at a 1024 viewport, 507 px at 1440 and 450 px at 1920, sitting inside 735 px of empty linen on each side. Nothing uses an asymmetric grid, nothing is offset, nothing overlaps. The one "breakout" moment on Our Story (the quote band) is only full-bleed below ~1182 px; at 1440 it is a 1040 px box with 200 px of margin either side. Desktop is, literally, mobile multiplied by 3.7.

**2. The palette does not shift section by section — 80 % of the site sits on Linen or a tint of it.**
The clients asked that the site not be uniformly one colour. It is: of 45 section-level blocks across the six pages, 29 are Linen `#F8F7F3`, 7 are `#EFEBE3` (an off-palette tint that measures 1.11:1 against Linen — visually the same colour), and the only tonal breaks are six photographs with an Espresso gradient laid over them plus the lightbox. **Burlap `#BCB3A6` does not appear anywhere in the codebase.** Cinnamon and Olive exist only as text colours; no section is ever set on them. On top of this, the imagery gives the palette nothing to key off: six of the seven photos used on the pages are black-and-white (only `photo-10` is colour), and there is no bushveld imagery at all — all 53 assets are from the gallery shoot, so half of the "bushveld meets gallery" tension has no visual representation.

**3. The photography is being damaged by its containers.**
The shoot is 2:3 portrait. The Weekend forces three of those portraits into 1920 × 340 bands — 5.6:1 — which shows **11.8 % of the image** and, on the Friday and Sunday bands, crops the couple's heads off (the faces sit at ~40–47 % of image height; the band shows 44–56 %). The gallery never shows any photo whole at any viewport: the "single" frame shows 31 % of the image at 1920 and 73 % at 390. The gallery sources are 1066 px wide but are laid into 959–1920 px frames, so desktop gets 1.2–1.8× upscaling at 1× DPR. Seven photos are recycled across thirteen placements (the hero photo is also the Saturday band; the Friday band is also Our Story chapter 2), the same file and the same centre crop are served to every viewport, and no image is ever art-directed.

---

## Findings table

Severity: **CRITICAL** = undermines the concept or client direction · **HIGH** = visible defect on common viewports or a locked-rule breach · **MEDIUM** = quality/consistency defect · **LOW** = hygiene.

| ID | Sev | Category | File:line | Finding (current value) | Why it matters |
|---|---|---|---|---|---|
| C-01 | CRITICAL | Layout | `src/styles/global.css:32`, `src/layouts/Base.astro:37`, all `src/pages/*.astro` | All public-page spacing is `cqw` (`px-[6cqw]`, `pt-[9cqw]`, `pb-[12cqw]`, `gap-[11cqw]` …) and all type is `clamp(a, Ncqw, b)`. Zero `md:`/`lg:`/`xl:` classes exist in `src/pages` or `src/components/site`; the only viewport breakpoint on the public site is `sm:grid-cols-2` at `RsvpForm.tsx:206`. | Desktop is the mobile layout scaled by viewport width. Nothing recomposes; see the "mobile-scaled-up" verdict below. |
| C-02 | CRITICAL | Colour | `src/styles/global.css:4-14`; every page | 29 of 45 blocks are `bg-brand-bg #F8F7F3`; 7 are `bg-brand-soft #EFEBE3` (1.11:1 vs Linen); 6 are photo + Espresso gradient; 1 lightbox Espresso; 1 gallery grid `#D5CEC4`; 1 transparent nav. `#BCB3A6` (Burlap) is never used. Cinnamon `#875F45` and Olive `#5B5546` appear only as text. | Direct breach of the client instruction that the palette must shift section by section to match the imagery. The site is uniformly Linen the way the rejected version was uniformly black. |
| C-03 | CRITICAL | Imagery | `src/pages/the-weekend.astro:95-96` | Day bands: `h-[40vh] max-h-[340px] min-h-[220px] w-full` + `object-cover`, fed 1600 × 2400 portraits (`photo-9`, `photo-6`, `photo-7`). At 1920 the box is 5.65:1; the image scales to 1920 × 2880 and the box shows rows 44.1–55.9 % (11.8 % of the photo). At 1440: 42–58 %. | `photo-9` (Friday) has the kiss at ≈40 % height and `photo-7` (Sunday) heads at ≈43–47 %: both are cut off at desktop. `photo-6` (Saturday) kiss at ≈47–48 % sits on the top edge under the 0.95-alpha gradient. Confirmed by viewing the source files. |
| C-04 | CRITICAL | Layout | `src/pages/the-weekend.astro:75`, `src/pages/faq.astro:35`, `src/pages/rsvp.astro:20`, `src/pages/index.astro:61,107`, `src/pages/our-story.astro:49`, `src/components/site/Nav.astro:29` | `max-w-[680px] px-[6cqw]` (and 600/640/1040/1080 variants) — max-width includes padding (border-box). Content width for the 680 container: 343 @390 · 588 @768 · 557 @1024 · **507 @1440 · 450 @1920**. Our Story 1040: peaks at 915 (vw 1040) then 867 @1440, 810 @1920. | The reading column shrinks as the viewport grows. At 1920 the Weekend page is a 450 px strip with 735 px dead margins each side. This is the single biggest reason desktop feels empty. |
| H-01 | HIGH | Layout | `src/pages/our-story.astro:68` | Quote band: `-mx-[6cqw] w-[calc(100%+12cqw)]` inside `max-w-[1040px] px-[6cqw]`. Band width = content + 12cqw = 1040 px whenever vw ≥ ~1182. | README calls this the "full-bleed quote band"; at 1440 it is a 1040 px box with 200 px linen each side, at 1920 440 px each side. The one designed breakout on the page fails exactly where it should land. |
| H-02 | HIGH | Imagery | `src/pages/gallery.astro:55,67,69,70` | Frames: band `h-[clamp(320px,62cqw,720px)] w-full`; single `h-[clamp(420px,110cqw,900px)] w-full`; pair `h-[clamp(320px,70cqw,720px)] flex-[1_1_260px]`; trio `h-[clamp(280px,50cqw,560px)] flex-[1_1_200px]`. Sources are 2:3 portrait (43) and 3:2 landscape (3). Portion of the photo visible — single: 31 % @1920, 42 % @1440, 73 % @390; pair: 50 % @1920, 67 % @1440, 55 % @390; trio: 58 % @1920, 78 % @1440, 48 % @390; band: 56 % @1920, 75 % @1440, 81 % @390. | No gallery frame at any viewport shows a whole photograph. A 46-frame portrait shoot is presented entirely as landscape/square centre crops. |
| H-03 | HIGH | Imagery | `src/assets/photos/gallery/*.jpg` (1066 × 1600, 1600 × 1066); `src/pages/gallery.astro:57,77` | Gallery sources are 1066 px wide (portrait) / 1600 px wide (landscape). `widths={[800,1400,2000]} sizes="100vw"` and `widths={[640,1024,1600]}` — Astro will not upscale, so at 1920 the "single" frame stretches a 1066 px file to 1920 (1.8× at 1× DPR, 3.6× at 2×); the band stretches 1600→1920. Lightbox requests `width: 1800` from a 1066 source (`gallery.astro:17`). | Soft images on exactly the screens where the gallery treatment is meant to impress. |
| H-04 | HIGH | Typography | `src/pages/faq.astro:44`; `src/pages/the-weekend.astro:126,163,189`; `src/components/site/RsvpForm.tsx:323` | Italic used as a structural/informational style: all 8 FAQ questions (`font-display italic font-medium`), the three cost headings ("Friday and Saturday — R2 100 per person"), the day accommodation notes, the "Finding Us" map link, and a Jost italic disclaimer. | Locked rule: italic serif is reserved for expressive lines. Here it is the default heading style on two pages, which dilutes the genuinely expressive uses (`index.astro:66`, `our-story.astro:60,73,85`, `rsvp.astro:24`, `RsvpForm.tsx:131`). Also `RsvpForm.tsx:323` asks for Jost italic, which is not loaded (`Base.astro:31` loads `Jost:wght@400;500;600` only) — the browser will synthesise a faux oblique. |
| H-05 | HIGH | Style rule | `src/components/site/Nav.astro:19` | `[text-shadow:0_1px_4px_rgba(0,0,0,0.35)]` on the overlay nav. | Locked rule: no drop shadows anywhere. This is the only shadow in the codebase, and its presence signals that the nav-over-hero contrast was not solved compositionally. |
| H-06 | HIGH | Motion / robustness | `src/styles/global.css:57-60`; `src/layouts/Base.astro:40-60` | `[data-reveal] { opacity: 0 }` is applied unconditionally by CSS; visibility depends on the inline script adding `.is-visible`. There is no `.js`/`no-js` gate and no `<noscript>` fallback. | If the script fails or is blocked, the welcome letter, gallery preview, orientation strip, RSVP CTA, every FAQ item, and most of The Weekend are permanently invisible. Also produces a flash-of-hidden-content before the script runs on slow connections. |
| H-07 | HIGH | Imagery / concept | `src/assets/photos/` (53 files) | All assets are from the gallery shoot. Mean-saturation analysis: `photo-6/7/8/9/11/12` are monochrome (sat ≤ 0.05); only `photo-10` is colour. Gallery set: 29 colour, 17 mono. | "Bushveld meets gallery" has no bushveld. And "palette shifts to match the imagery in that section" cannot be executed against B&W hero/band imagery — there is no colour to match. This is a content gap, not a CSS gap. |
| H-08 | HIGH | Brand | `public/favicon.svg:2-9` | The favicon is the Astro starter-template rocket logo (`fill: #000`, `#FFF` in dark mode). | Off-brand, off-palette, and it is what appears in every browser tab and bookmark. |
| H-09 | HIGH | Imagery | `src/pages/index.astro:28-37` | Hero: `h-[78vh] min-h-[520px] w-full`, `object-cover`, portrait `photo-6`. At 1920 × 1080 the box is 842 px tall (2.28:1); the image scales to 1920 × 2880; rows 35–65 % are shown (29 %). At 1440 × 900: 32.5 %. At 390 × 844: 89 % of the width is shown. | The framed artworks on the wall — the "gallery" of the concept — are cropped out on desktop; the hero becomes a mid-shot with no context. Same file is reused as the Saturday band. Same centre crop for every viewport. |
| H-10 | HIGH | Composition | `src/pages/index.astro:49,61,71,84,96,110` | Six of the thirteen public `text-center` uses are on the home page; every text block on the page (hero, letter, kicker, link, orientation cells, CTA) is centred. | The home page has no left edge to compose against; centred-everything is the signature of a mobile layout and is precisely what "The Gallery" concept needed to avoid. |
| H-11 | HIGH | Responsive | `src/components/site/Nav.astro:29-56`; `src/pages/index.astro:44` | Nav is a `flex-wrap` row with no mobile pattern. Estimated widths at 390 (Jost 500 @12.48 px, 0.15em tracking ≈ 9.6 px/char): links + RSVP ≈ 435 px vs 343 px available → wraps to two link rows under the logo (three rows total, ≈ 180 px tall). The hero top gradient is `h-[26cqw] min-h-[120px]` = 120 px at 390. | On the home page the third row of nav links sits below the darkened band, on the raw photo, with only the text-shadow (H-05) protecting it. **Exact wrap points cannot be determined from code** — glyph metrics need rendering — but the arithmetic makes a two-row wrap near-certain at ≤ 414 px. |
| H-12 | HIGH | Responsive | `src/pages/index.astro:54`; `src/pages/index.astro:93,96` | `whitespace-nowrap` on "Tshikwalo Game Lodge, Dinokeng Game Reserve" (43 chars, `clamp(0.95rem,2.2cqw,1.15rem)` + 0.04em) — estimated 365 px at 390 vs 343 px available; parent `.site` is `overflow-x-hidden`. Orientation cells are `whitespace-nowrap` inside a grid with `overflow-hidden`. | Likely clipping of the venue line on 375/390 px phones and of "Tshikwalo Game Lodge" in the two-column orientation state (440–660 px). **Cannot determine from code**; needs a render at 375 and 390. |
| M-01 | MEDIUM | Colour | `src/styles/global.css:6,7,9,12,13`; `src/components/site/RsvpForm.tsx:30` | Off-palette values in the public site: `#EFEBE3` (soft, 9 uses), `#D5CEC4` (rule, 33 uses), `#3D3B38` (ink-hover, 3), `#C08B68` (accent-light, **0 uses**), `#CFC9BF` (hero-secondary, 1), `#9B3B2E` (error, 1), `rgba(0,0,0,.35)` (shadow). | Six tints were invented rather than using the locked five; meanwhile Burlap `#BCB3A6` — the palette's mid-tone that would naturally serve as the rule/soft colour — is unused. |
| M-02 | MEDIUM | Spacing | `src/pages/our-story.astro:84` (`pt-[14cqw] pb-[16cqw]`), `the-weekend.astro:83` (`pb-[12cqw]`), `index.astro:106` (`pb-[10cqw]`) | Uncapped linear padding. 16cqw = 62 px @390 · 230 px @1440 · **307 px @1920**. 12cqw = 47 · 173 · 230. 9cqw = 35 · 130 · 173. | Vertical rhythm is the same proportion at every width (ratio desktop/mobile = 3.69 for every value), so desktop gets the mobile rhythm inflated. 300 px of empty linen after "Slegs goeie besluite" is not a designed pause. |
| M-03 | MEDIUM | Spacing | `src/pages/rsvp.astro:21`; `src/components/site/RsvpForm.tsx:34,130,153,179,326` | RSVP page uses `em` padding (`pt-[2.4em] pb-[1em]`, `pb-[3em]`, `pb-[6em]`) — fixed ≈ 38/16/48/96 px — while every other page uses `cqw`. | Two spacing systems; the RSVP page does not breathe with the rest of the site at desktop and is the only page whose rhythm is fixed at mobile. |
| M-04 | MEDIUM | Typography | all `text-[clamp(...)]` (22 distinct expressions) and fixed sizes | Clamp maxima in rem: 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.5, 1.7, 2.0, 2.4, 2.6, 3.0, 3.2, 5.0. Small fixed sizes: 0.72, 0.78, 0.8, 0.85, 0.9, 0.95 rem. | No modular ratio — consecutive steps of 1.2→1.25→1.3→1.35→1.4 are 4 % increments, and there are six "small" sizes within 0.23 rem of each other. Sizes are arbitrary. |
| M-05 | MEDIUM | Typography | `the-weekend.astro:76` (serif body), `faq.astro:47` (Jost body), `the-weekend.astro:164` (Jost), `RsvpForm.tsx:264,289` (Jost) | Body copy is Cormorant Garamond on Home/Our Story/Weekend but Jost on FAQ answers, cost details and RSVP small print. | Two body faces with no stated rule for which is which; the FAQ reads as a different product from The Weekend. |
| M-06 | MEDIUM | Colour / layout | `src/pages/gallery.astro:51` | Grid wrapper: `bg-brand-rule py-[5cqw]` with `gap-[2px]`. The 5cqw top/bottom padding is painted `#D5CEC4`: 20 px @390, 72 px @1440, 96 px @1920. | The 2 px gutters are intentional; the 96 px grey slab above the first photo and below the last is a side-effect of putting the padding on the coloured wrapper. |
| M-07 | MEDIUM | Responsive | `src/pages/gallery.astro:70` | Trio rows: `flex-[1_1_200px] min-w-[200px]`. Three across needs ≥ 604 px; two across at 402–603 px; one below 402. | On 412–430 px phones (Pixel, iPhone Plus/Pro Max) every trio renders as a pair plus an orphan third image stretched full-width. |
| M-08 | MEDIUM | Responsive | `src/pages/the-weekend.astro:106-108` | Timeline rows: time `min-w-[9.5em]` (≈137 px at 0.9rem) + gap 1.2em (19 px) + event `flex-[1_1_200px]` = 356 px; content width is 343 px at 390, 330 at 375, 364 at 414. | The time stacks above the event on 375/390 px phones but sits beside it on 414+. The layout flips on the two most common phone widths. |
| M-09 | MEDIUM | Semantics | `our-story.astro`, `the-weekend.astro`, `gallery.astro` (no `<h1>`); `the-weekend.astro:99` (day title is `<p>`); all `.eyebrow` kickers are `<div>`; `faq.astro:44` questions are `<p>` | Three of six pages have no heading at all; no page has an `h2`. | Screen-reader and SEO structure is absent; also makes the visual hierarchy harder to reason about because none of it is encoded. |
| M-10 | MEDIUM | Accessibility | `src/styles/global.css:28`; `RsvpForm.tsx:162-174` | `input:focus, textarea:focus { outline: none; border-color: accent }`. Attendance buttons and radios rely on browser default focus rings (which are rounded, breaching the corner rule under keyboard use). | Keyboard focus on a `border-b`-only input is a 1 px colour change; on the boxed buttons it is the UA ring. |
| M-11 | MEDIUM | Motion | `src/pages/gallery.astro:45` (`hover:scale-[1.03] transition-transform duration-500`); `RsvpForm.tsx:121` (`scrollTo({behavior:'smooth'})`) | `prefers-reduced-motion` is honoured for `[data-reveal]` and `.fade-in` (`global.css:63-65,70`) but not for the gallery zoom or the smooth scroll. | Partial compliance. |
| M-12 | MEDIUM | Style rule | `RsvpForm.tsx:167-168` (attendance buttons: full `border`, `bg-brand-soft` fill when selected); `RsvpForm.tsx:27` (`boxInput` textareas, four-sided border); `Nav.astro:50-52` (RSVP link boxed with `border px-[1.3em]`); `index.astro:110` (CTA is a solid filled block) | Boxed components on the public site. | Locked rule: hairline rules instead of boxes. The orientation strip (`index.astro:93-96`) is the compliant pattern — a hairline grid — and should be the reference. |
| M-13 | MEDIUM | Style rule / colour | `AdminDashboard.tsx:13-15,82,95,100,133`; `HouseholdCard.tsx:5-13,75`; `AddHouseholdForm.tsx:4,35,46` | Admin uses `bg-white` (6×), Tailwind `amber-100/800/900`, `emerald-100/900`, `red-50/100/200/700/800/900`, bordered cards, a dashed empty-state box, filled chip badges, Tailwind numeric spacing (`p-4`, `gap-2`…) and `text-sm/xs`. | Admin is internal but it is the couple's daily surface. Every locked style rule and the palette are ignored there; it reads as a different product. Also `manifest.webmanifest:10-11` uses `#fafafa` / `#1f1d1b`. |
| M-14 | MEDIUM | Imagery | `index.astro:6-9`, `our-story.astro:6-10`, `the-weekend.astro:7-9`, `rsvp.astro:7` | 7 files serve 13 placements: `photo-6` (hero + Saturday band), `photo-7` (Story ch.4 + Sunday band), `photo-9` (Story ch.2 + Friday band), `photo-10` (home preview + Story band), `photo-11` (home preview + Story ch.3), `photo-12` (home preview + RSVP banner). | A guest who reads Home → Our Story → Weekend sees every photo twice, sometimes in the same session. The gallery has 46 unused alternatives. |
| M-15 | MEDIUM | Contrast (non-text) | `global.css:7`; `RsvpForm.tsx:25,27`; every `border-brand-rule` | `#D5CEC4` on Linen = **1.46:1**; on `#EFEBE3` = 1.31:1; on white (admin) = 1.56:1. | Decorative hairlines are exempt, but form-field boundaries (RSVP inputs, textareas, admin inputs) are UI components and fall below the 3:1 minimum (WCAG 1.4.11). |
| M-16 | MEDIUM | Imagery | all image containers | Every image is a rectangle fully inside its box: `overflow-hidden` + `object-cover` on all 13 page placements and all 46 gallery frames. Bleeds are only the symmetric full-width bands (hero, three day bands, RSVP banner, gallery). Nothing bleeds off one edge, overlaps text, or breaks a column. | Gallery-style tension (large/small, offset, overlap) is absent; all imagery is "picture in a frame, centred". |
| M-17 | MEDIUM | Layout | `Nav.astro:29` (1080), `our-story.astro:49` (1040), `index.astro:72,93` (960), `the-weekend.astro:75` / `faq.astro:35` (680), `index.astro:61,107` (640), `rsvp.astro:20` (600) | Six unrelated container widths; the nav's inner edge (907 px content @1440) aligns with no page column. | No shared grid or gutter system; page edges shift from page to page. |
| L-01 | LOW | Colour | `src/styles/global.css:12` | `--color-brand-accent-light: #C08B68` — zero uses. Also fails contrast on Linen (2.75:1) if it were used for text. | Dead token. |
| L-02 | LOW | Typography | `src/components/site/RsvpForm.tsx:22` | `eyebrow` re-declared as a string constant instead of using the `@utility eyebrow` from `global.css:34`. | Drift risk; the two already differ (`mb-[1.4em]` is baked into the React copy). |
| L-03 | LOW | Typography | `src/layouts/Base.astro:31` | Loads Cormorant 600 and Jost 600; no `font-semibold`/`font-bold` exists anywhere (only `font-medium`, 30 uses). Does not load Jost italic, which `RsvpForm.tsx:323` uses. | Two unused weight files downloaded; one used style missing. |
| L-04 | LOW | Typography | `AdminDashboard.tsx:156`; `HouseholdCard.tsx:14` | Admin kickers `text-[0.68rem]` = 10.9 px. | Below the 11–12 px floor most teams set for uppercase tracked text. |
| L-05 | LOW | Typography | `global.css:38,47` (0.15em); `index.astro:110`, `RsvpForm.tsx:29,335,188` (0.1em) | Uppercase tracking is 0.15em on kickers/nav and 0.1em on buttons and one form label. | Two values, consistently applied; acceptable, noted for completeness. |
| L-06 | LOW | Naming | `README.md:15`; `.env.example:1` | Supabase project id `joanique-pieter-2026`. | The only Joanique-before-Pieter instance in the repo. It is an infrastructure identifier, never shown to guests. **Every user-facing instance (26 checked across `src/` and `public/`) has Pieter first.** |
| L-07 | LOW | Responsive | `index.astro:79` (`sizes="(min-width: 700px) 320px, 90vw"`), `our-story.astro:56` (`700px`, `1120px`), `gallery.astro:78` (`700px`) | `sizes` breakpoints (700/1120) do not match the computed layout switch points (home preview 3-up at ≥ ~805 px, 2-up at ≥ ~518 px; Our Story 2-col at ≥ ~723 px; gallery pair at ≥ 522, trio at ≥ 604). | Wrong candidate image selected in the 518–805 px band; harmless visually, wasteful in bytes. |
| L-08 | LOW | Style rule | `RsvpForm.tsx:259` (`<input type="radio">`); admin `<select>` / `type="search"` | Native controls. Radios are circular by nature; selects/search fields draw rounded native chrome on macOS/iOS. | **Cannot determine from code** how each browser renders these; a render on Safari iOS and macOS is needed to confirm whether the "no rounded corners" rule is visibly breached. |

---

## 1. Layout and composition

### Container max-widths

| Value | Where | Padding inside cap? | Content width @390 / 768 / 1024 / 1440 / 1920 |
|---|---|---|---|
| `max-w-[1080px]` | `Nav.astro:29` | yes (`px-[6cqw]`) | 343 / 676 / 901 / 907 / 850 |
| `max-w-[1040px]` | `our-story.astro:49` | yes | 343 / 676 / 901 / 867 / 810 |
| `max-w-[960px]` | `index.astro:72` (preview row, inside a `px-[6cqw]` section) | no (padding on parent) | 343 / 676 / 901 / 960 / 960 |
| `max-w-[960px]` | `index.astro:93` (orientation grid) | no padding at all | 390 / 768 / 960 / 960 / 960 |
| `max-w-[680px]` | `the-weekend.astro:75`, `faq.astro:35` | yes | 343 / 588 / 557 / 507 / 450 |
| `max-w-[640px]` | `index.astro:61` (letter), `index.astro:107` (CTA) | yes | 343 / 548 / 517 / 467 / 410 |
| `max-w-[600px]` | `rsvp.astro:20` | yes | 343 / 508 / 477 / 427 / 370 |
| `max-w-[320px]` | `index.astro:76` (each preview tile) | — | tile cap |
| `max-w-[34em]` / `max-w-[32em]` | `RsvpForm.tsx:135`, `our-story.astro:73` | — | text measure caps |
| `max-w-[92%]` | `gallery.astro:106` (lightbox image) | — | |
| `max-w-5xl` (64rem = 1024) | `AdminDashboard.tsx:75` | no (`px-4 sm:px-6`) | admin |

Every padded container's content width peaks between a 1024 and ~1180 px viewport and **narrows** beyond it.

### `text-align: center` — every occurrence (public site: 13; admin: 2)

| # | File:line | Element |
|---|---|---|
| 1 | `index.astro:49` | Hero text block (h1 + date + venue) |
| 2 | `index.astro:61` | Welcome-letter section (both paragraphs) |
| 3 | `index.astro:71` | "A Few Moments So Far" kicker |
| 4 | `index.astro:84` | "See the gallery →" link wrapper |
| 5 | `index.astro:96` | Each orientation-strip cell (kicker + value) |
| 6 | `index.astro:110` | RSVP CTA button label |
| 7 | `our-story.astro:72` | Quote-band text wrapper |
| 8 | `our-story.astro:84` | "Slegs goeie besluite" closing block |
| 9 | `gallery.astro:90` | Photographer-credit wrapper |
| 10 | `gallery.astro:107` | Lightbox counter |
| 11 | `Footer.astro:1` | Entire footer |
| 12 | `rsvp.astro:21` | RSVP heading block (h1, deadline, tagline) |
| 13 | `RsvpForm.tsx:130` | Thank-you state |
| — | `RsvpForm.tsx:286` | Children number `<input>` (functional value centring, not layout) |
| — | `AdminDashboard.tsx:133,146` | Empty state, footer count |

Also `text-right` at `RsvpForm.tsx:47` (detail values) and `text-left` at `RsvpForm.tsx:167`, `HouseholdCard.tsx:76`.
Our Story chapter text, The Weekend, FAQ and the RSVP form body are left-aligned. The home page is centred end to end.

### Full-bleed vs contained

| Page | Full-bleed (edge to edge) | Contained |
|---|---|---|
| Home | Hero (`index.astro:28`, `w-full h-[78vh]`); orientation strip background (`:92`, `bg-brand-soft border-y`, content capped 960); footer background | Letter (640), preview row (960 in a padded section), CTA (640) |
| Our Story | **None at ≥ ~1182 px.** Quote band (`:68`) is full-bleed only while `vw < 1182` | Everything (1040 with padding) |
| The Weekend | Three day bands (`:95`, `w-full`) | Everything else (680) |
| Gallery | Grid (`:51`, no side padding; 2 px `#D5CEC4` gutters) | Credit line (padded) |
| FAQ | **None** | Everything (680) |
| RSVP | Banner (`rsvp.astro:16`, `w-full max-h-[340px]`); sticky total bar (`RsvpForm.tsx:334`, `fixed left-0 right-0`) | Heading + form (600) |
| All | Nav bar background (`Nav.astro:26`), footer background | Nav content (1080) |

Full-bleed elements are exclusively full-width photographs and full-width colour bars; there is no partial bleed (off one edge) anywhere.

### Asymmetric grids

None on the public site. `index.astro:93` uses `repeat(auto-fit, minmax(220px, 1fr))` — equal columns. Our Story (`:54-58`) is two flex children each `flex-[1_1_300px]` — 50/50. Home preview tiles are equal `flex-[1_1_220px]`. Gallery pairs/trios are equal-basis flex. The admin uses `sm:col-span-2/3` in forms (functional field sizing, not composition). Every section on every page is a single stacked column, or a symmetric row that stacks.

### Desktop vs mobile composition — see verdict at the end.

---

## 2. Responsive strategy

### Explicit breakpoints

| Breakpoint | Where | What changes |
|---|---|---|
| `sm:` (640 px) | `RsvpForm.tsx:206` | Email/phone fields go from one column to two. |
| `sm:` (640 px) | `AdminDashboard.tsx:75,100`; `HouseholdCard.tsx:127-179`; `AddHouseholdForm.tsx:35-44` | Admin: `px-4 → px-6` (**padding only**), stat grid 2 → 4 columns, form grids 1 → 3/4 columns. |
| `@media (prefers-reduced-motion)` | `global.css:63,70` | Disables reveal/fade. |

No `md:`, `lg:`, `xl:`, `2xl:`, no `@media (min-width)`, no `@container` queries. `.site { container-type: inline-size }` (`global.css:32`) exists solely so `cqw` units resolve; it is never queried.

**Breakpoints where the only change is padding or font size:** `AdminDashboard.tsx:75` (`sm:px-6`). On the public site every size and space is continuous (`cqw`/`clamp`), so *every* width is a "padding and font-size only" change — there are no discrete steps to flag because there are no steps.

### Implicit (wrap-driven) switch points, computed from flex-basis + gap + container

| Component | Switches at (viewport) | From → to |
|---|---|---|
| Nav links (`Nav.astro:35`) | est. ≤ ~440 px (needs render) | one row → two link rows under logo |
| Home preview tiles (`index.astro:72-76`) | ~518 px; ~805 px | 1 → 2 → 3 across. Tiles are capped at 320 px but 3 × 320 + 2 × 43 px gap = 1046 > 960, so at 1440 they settle at ≈ 291 px each — the row never reaches its own cap |
| Orientation strip (`index.astro:93`) | 440 px; 660 px | 1 → 2 → 3 columns |
| Our Story chapters (`our-story.astro:54`) | ~723 px | stacked (image first) → side-by-side, alternating |
| Weekend timeline rows (`the-weekend.astro:106`) | ~404 px | time above event → beside |
| Gallery pair (`gallery.astro:69`) | 522 px | 1 → 2 across |
| Gallery trio (`gallery.astro:70`) | 402 px; 604 px | 1 → 2 (+ orphan) → 3 across |
| RSVP email/phone | 640 px (`sm:`) | 1 → 2 |

### Widest viewport the design was considered at

Evidence of intent stops at **~1080 px**: the nav caps at 1080, Our Story at 1040, the hero `srcset` goes to 2400 px (`index.astro:32`), and gallery frames cap at 720/900 px tall. Nothing acknowledges 1440 or 1920: no wider container, no wider grid, no capped padding, no `lg:` rules.

**At 1440 (× 900):**
- `6cqw` = 86 px side padding; `9cqw` = 130 px section padding; `12cqw` = 173 px; `16cqw` = 230 px.
- Hero 702 px tall, 2.05:1, shows 32.5 % of `photo-6` (rows 34–66 %).
- Weekend day bands 1440 × 340 (4.2:1), show 15.7 % of each portrait (rows 42–58 %) — Friday/Sunday faces cut.
- Weekend/FAQ column 507 px content in a 1440 viewport (35 %); margins 466 px each side.
- Our Story: two columns of ≈ 397 px each; chapter image 397 × 496 px; quote band boxed at 1040 with 200 px margins.
- Gallery: pair frames 719 × 720 (square from 2:3), single 1440 × 900 (42 % of image), band 1440 × 720.
- Nav content 907 px, not aligned with any column.

**At 1920 (× 1080):**
- `6cqw` = 115 px; `9cqw` = 173 px; `12cqw` = 230 px; `16cqw` = 307 px.
- Hero 842 px tall, 2.28:1, shows 29 % of the image.
- Day bands 1920 × 340 (5.65:1), show 11.8 %; faces cut on Friday/Sunday, on the edge for Saturday.
- Weekend/FAQ column **450 px** (23 % of viewport); margins 735 px. RSVP form column 370 px. Home letter 410 px at 24 px serif ≈ 41 characters per line.
- Our Story columns ≈ 357 px; chapter image 357 × 446 px on a 1920 screen; quote band boxed with 440 px margins.
- Gallery single frame 1920 × 900 from a 1066 px source (1.8× upscale); 96 px `#D5CEC4` slab above and below the grid.
- Footer padding 115 px top and bottom.

---

## 3. Colour system

### Every colour value in the codebase

| Value | Token / origin | Locked palette match | Uses (public / admin / static) |
|---|---|---|---|
| `#F8F7F3` | `--color-brand-bg`; `Base.astro:26` theme-color | **Linen** ✓ | body, nav bar, sticky bar, gallery tile bg, hero text |
| `#302E2C` | `--color-brand-ink`; `Admin.astro:26`; `rgba(48,46,44,…)` gradients in `index.astro:40,45`, `our-story.astro:71`, `the-weekend.astro:18,28,42` | **Espresso** ✓ | text, buttons, hero/band gradients, lightbox |
| `#5B5546` | `--color-brand-muted` | **Olive** ✓ | secondary text only (35 uses) — never a background |
| `#875F45` | `--color-brand-accent` | **Cinnamon** ✓ | kickers, links, times, radio accent — never a background |
| `#BCB3A6` | — | **Burlap** — **absent from the codebase** | 0 |
| `#EFEBE3` | `--color-brand-soft` | off-palette (between Linen and Burlap) | footer bg, orientation bg, hover fills, selected attendance button |
| `#D5CEC4` | `--color-brand-rule` | off-palette | 33 hairlines/borders; gallery gutters and slab |
| `#3D3B38` | `--color-brand-ink-hover` | off-palette | button hover (3) |
| `#C08B68` | `--color-brand-accent-light` | off-palette | **0 uses** |
| `#CFC9BF` | `--color-brand-hero-secondary` | off-palette | hero venue line (1) |
| `#9B3B2E` | literal, `RsvpForm.tsx:30` | off-palette (error red) | form errors |
| `rgba(0,0,0,0.35)` | literal, `Nav.astro:19` | — (shadow) | nav text-shadow |
| `#FFFFFF` (`bg-white`) | Tailwind | off-palette | admin (6) |
| `amber-100/800/900`, `emerald-100/900`, `red-50/100/200/700/800/900` | Tailwind | off-palette | admin badges/alerts/danger links |
| `#000` / `#FFF` | `public/favicon.svg` | off-palette | Astro default favicon |
| `#fafafa` / `#1f1d1b` | `manifest.webmanifest:10-11` | off-palette (near-Linen / near-Espresso, but not the tokens) | admin PWA chrome |

Summary: 4 of the 5 locked colours are used; Burlap is missing; 6 off-palette tints were added on the public site, plus 17 off-palette values in admin/static files.

### Section-by-section colour map

Abbreviations: **Lin** `#F8F7F3` · **Soft** `#EFEBE3` · **Esp** `#302E2C` · **Oli** `#5B5546` · **Cin** `#875F45` · **Rule** `#D5CEC4` · **Img+Esp** = photograph with Espresso alpha gradient.

| Page | Block (file:line) | Background | Text | Accent |
|---|---|---|---|---|
| Home | Nav overlay (`index:48`) | transparent over image | Lin (+ shadow) | Lin border on RSVP |
| Home | Hero (`index:28`) | Img+Esp (0→.85 bottom; .45→0 top) | Lin; `#CFC9BF` | — |
| Home | Welcome letter (`index:61`) | Lin | Esp; Oli (italic) | — |
| Home | Gallery preview (`index:70`) | Lin | Cin kicker | Cin link |
| Home | Orientation strip (`index:92`) | Soft | Esp | Cin kickers; Rule hairlines |
| Home | CTA (`index:106`) | Lin | Lin on Esp block | Esp fill |
| Home | Footer | Soft | Esp; Oli | Rule top hairline |
| Our Story | Nav bar | Lin | Esp | Rule bottom hairline |
| Our Story | Chapter 01 (`:54`) | Lin | Esp; Oli | Cin kicker |
| Our Story | Chapter 02 | Lin | Esp; Oli | Cin |
| Our Story | Quote band (`:66`) | Img+Esp (.15→.55) | Lin | — |
| Our Story | Chapter 03 | Lin | Esp; Oli | Cin |
| Our Story | Chapter 04 | Lin | Esp; Oli | Cin |
| Our Story | Closing line (`:84`) | Lin | Oli | — |
| Our Story | Footer | Soft | Esp; Oli | — |
| The Weekend | Nav bar | Lin | Esp | — |
| The Weekend | Invitation (`:83`) | Lin | Esp | Cin kicker |
| The Weekend | Friday band (`:95`) | Img+Esp (.9→0, 65 % h) | Lin | — |
| The Weekend | Friday timeline (`:104`) | Lin | Esp; Oli | Cin times; Rule |
| The Weekend | Saturday band | Img+Esp (.95→0, 70 % h) | Lin | — |
| The Weekend | Saturday timeline | Lin | Esp; Oli | Cin |
| The Weekend | Sunday band | Img+Esp (.85→0, 60 % h) | Lin | — |
| The Weekend | Sunday timeline | Lin | Esp | Cin |
| The Weekend | Throughout (`:134`) | Lin | Esp | Cin; Rule |
| The Weekend | Staying (`:139`) | Lin | Esp; Oli | Cin |
| The Weekend | Costs (`:158`) | Lin | Esp; Oli | Cin |
| The Weekend | Good to know (`:170`) | Lin | Esp | Cin |
| The Weekend | What to wear (`:175`) | Lin | Esp | Cin |
| The Weekend | Finding us (`:183`) | Lin | Cin (italic link) | Cin |
| The Weekend | Footer | Soft | Esp; Oli | — |
| Gallery | Nav bar | Lin | Esp | — |
| Gallery | Grid (`:51`) | Rule slab + 2 px gutters; tiles Lin under images | — | — |
| Gallery | Credit (`:90`) | Lin | Oli | — |
| Gallery | Footer | Soft | Esp; Oli | — |
| Gallery | Lightbox (`:97`) | Esp | Lin | — |
| FAQ | Nav bar | Lin | Esp | — |
| FAQ | Heading (`:36`) | Lin | Esp | — |
| FAQ | Questions (`:40`) | Lin | Esp (italic); Oli | Cin on hover; Rule |
| FAQ | Footer | Soft | Esp; Oli | — |
| RSVP | Nav bar | Lin | Esp | — |
| RSVP | Banner (`rsvp:16`) | Img (no gradient) | — | — |
| RSVP | Heading (`rsvp:21`) | Lin | Esp; Oli | — |
| RSVP | Form (`RsvpForm`) | Lin | Esp; Oli | Cin kickers/prices; Rule; Soft fills; Esp send button |
| RSVP | Sticky total (`RsvpForm:334`) | Lin | Oli; Esp | Esp top rule |
| RSVP | Footer | Soft | Esp; Oli | — |

**Shared backgrounds: 29 of 45 blocks are Linen; 7 are Soft (1.11:1 from Linen — perceptually the same); 36 of 45 (80 %) are therefore one surface. The remaining 9 are photographs (6), one Espresso lightbox, one `#D5CEC4` gallery slab, one transparent nav.** No block on any page uses Cinnamon, Olive or Burlap as a background. Across all six pages, palette variation is achieved only by placing a photo with a dark gradient.

### WCAG contrast (relative luminance, sRGB)

| Foreground | Background | Ratio | Where | Verdict |
|---|---|---|---|---|
| Esp `#302E2C` | Lin | 12.62:1 | body text everywhere | pass |
| Oli `#5B5546` | Lin | 6.92:1 | muted text | pass |
| Cin `#875F45` | Lin | 5.22:1 | kickers 12.5 px, links, times | pass (AA body) |
| `#9B3B2E` | Lin | 6.40:1 | form errors 12.8 px | pass |
| Esp | Soft | 11.37:1 | orientation, footer | pass |
| Oli | Soft | 6.24:1 | footer | pass |
| Cin | Soft | 4.71:1 | orientation kickers 12.5 px | pass (narrow margin) |
| Lin | Esp | 12.62:1 | buttons, lightbox counter | pass |
| `#CFC9BF` | Esp (solid, best case) | 8.22:1 | hero venue line | pass **against solid Espresso only** — the actual background is the photo under a 0.85-alpha gradient; **cannot determine from code**, needs a render |
| Lin | hero image top (0.45→0 gradient) | — | overlay nav | **cannot determine from code**; the text-shadow at `Nav.astro:19` suggests it was found insufficient |
| Lin | Weekend band gradients (.85–.95 at bottom) | ≥ ~10:1 estimated | day titles | very likely pass; needs render |
| Rule `#D5CEC4` | Lin | **1.46:1** | input borders, hairlines | **fails 3:1 non-text** for form-field boundaries (M-15) |
| Rule | Soft | **1.31:1** | orientation cell borders | decorative — exempt |
| `#C08B68` | Lin | **2.75:1** | (unused token) | would fail if used for text |
| Oli | white | 7.41:1 | admin | pass |
| Esp | white | 13.52:1 | admin | pass |
| Rule | white | **1.56:1** | admin input borders | fails 3:1 non-text |
| amber-800 / amber-100 | | 6.36:1 | admin offline chip | pass |
| amber-900 / amber-100 | | 8.13:1 | admin badges | pass |
| emerald-900 / emerald-100 | | 8.47:1 | admin badges | pass |
| red-900 / red-100 | | 8.22:1 | admin badges | pass |
| red-800 / red-50 | | 7.64:1 | admin error box | pass |
| red-700 / white | | 6.42:1 | admin danger links (12 px) | pass |

Placeholder text (`RsvpForm.tsx:181,203,226,306`) uses browser-default placeholder colour — **cannot determine from code**.

No text pairing on the public site falls below 4.5:1 against a solid background. The failures are non-text (form-field borders) and the two image-backed pairings that cannot be verified statically.

---

## 4. Typography

### Families, weights, sizes actually rendered

**Families loaded** (`Base.astro:31`): Cormorant Garamond 400, 500, 600, italic 400, italic 500; Jost 400, 500, 600.
**Weights used:** 400 (default) and 500 (`font-medium`, 30 uses). **600 is never used** in either family. **Jost italic is used** (`RsvpForm.tsx:323`) **but not loaded.**
Admin loads a reduced set (`Admin.astro:24`): Cormorant 500 + italic 500; Jost 400/500/600.

**Sizes rendered (public site), by role:**

| Role | Size | Family | Where |
|---|---|---|---|
| Hero h1 | `clamp(2.2rem, 9cqw, 5rem)` → 35 px @390, 80 px @≥889 | Cormorant 500, hard-coded caps, 0.02em | `index:50` |
| Page h1 | `clamp(2.2rem,8cqw,3rem)` FAQ; `clamp(2.4rem,9cqw,3.2rem)` RSVP | Cormorant 500 | `faq:37`, `rsvp:22` |
| Day title | `clamp(2rem,7.5cqw,3rem)` | Cormorant 500 | `weekend:99` |
| Closing line | `clamp(1.8rem,5cqw,2.6rem)` | Cormorant italic | `our-story:85` |
| Oversized pull | `clamp(1.6rem,4.4cqw,2.4rem)` | Cormorant italic 500 | `our-story:60` |
| Thank-you | `clamp(1.5rem,4cqw,2rem)` | Cormorant italic 500 | `RsvpForm:131` |
| Quote band | `clamp(1.2rem,3.2cqw,1.7rem)` | Cormorant italic | `our-story:73` |
| Letter | `clamp(1.25rem,3.4cqw,1.5rem)` | Cormorant 400 | `index:62` |
| Lead / FAQ q / cost title / map link / attendance btn | `clamp(1.2rem,2.8cqw,1.4rem)` (×4), `clamp(1.2rem,3cqw,1.4rem)` | Cormorant (italic on FAQ/costs/link) | `weekend:85,163,189`, `faq:44`, `RsvpForm:167` |
| Timeline event | `clamp(1.15rem,2.6cqw,1.35rem)` | Cormorant | `weekend:108` |
| Sign-off / orientation / stay label | `clamp(1.15rem,3cqw,1.3rem)`, `clamp(1.1rem,3cqw,1.3rem)`, `clamp(1.1rem,2.8cqw,1.3rem)`, `clamp(1.1rem,2.6cqw,1.3rem)`, `clamp(1.1rem,2.8cqw,1.25rem)` | Cormorant | `index:66,98`, `Footer:2`, `RsvpForm:260`, `rsvp:24` |
| Serif body | `clamp(1.05rem,2.4cqw,1.2rem)` (×7), `clamp(1.05rem,2.6cqw,1.2rem)` | Cormorant 400 | `weekend:76,126,152`, `our-story:61`, `RsvpForm:135,272,310,317` |
| Hero date / venue | `clamp(1rem,2.4cqw,1.25rem)`, `clamp(0.95rem,2.2cqw,1.15rem)` | Jost | `index:53,54` |
| Fixed serif | 1.5rem, 1.4rem, 1.35rem, 1.15rem | Cormorant 500 | totals `RsvpForm:301,336,300`; logo `Nav:32` |
| Sans body | 0.95rem (×5) | Jost 400 | FAQ answers, cost detail, RSVP values |
| Sans small | 0.9rem (×3), 0.85rem (×12), 0.8rem (×2), 0.78rem (×3 + utility), 0.72rem | Jost 400/500 | times, labels, small print, credit, kickers, hashtag |
| Inputs | 16px (×3) | Jost | prevents iOS zoom |

**Type-scale ratio:** none. Maxima step 1.15 → 1.2 → 1.25 → 1.3 → 1.35 → 1.4 → 1.5 → 1.7 → 2.0 → 2.4 → 2.6 → 3.0 → 3.2 → 5.0 rem; ratios between neighbours range from 1.04 to 1.56. Small sizes 0.72/0.78/0.80/0.85/0.90/0.95 are six values inside 0.23 rem. **Sizes are arbitrary.**

### Measure (characters per line, desktop)

Assumptions: Cormorant Garamond average advance ≈ 0.42 em, Jost ≈ 0.50 em (estimates — exact values need a render).

| Copy | Width @1440 | Size | ≈ CPL @1440 | ≈ CPL @1920 | ≈ CPL @390 |
|---|---|---|---|---|---|
| Weekend serif body | 507 px | 19.2 px | 63 | 56 | 48 |
| Home welcome letter | 467 px | 24 px | 46 | 41 | 41 |
| FAQ answers (Jost) | 507 px | 15.2 px | 67 | 59 | 45 |
| Our Story chapter body | ≈ 397 px | 19.2 px | 49 | 44 | 48 |
| RSVP small print (Jost) | 427 px | 13.6 px | 63 | 54 | 50 |

Measures are inside the 45–75 CPL range. The problem is not line length; it is that the column holding it occupies 23–35 % of a desktop viewport.

### Italic serif — reserved or general?

Expressive (compliant): `index:66` sign-off · `our-story:60` oversized pull lines · `our-story:73` quote band · `our-story:85` and `rsvp:24` "Slegs goeie besluite" · `RsvpForm:131` thank-you · `Nav:32` "P & J" mark (brand, acceptable).
Structural/informational (non-compliant): `faq:44` all 8 question headings · `the-weekend:163` all 3 cost headings · `the-weekend:126` accommodation notes · `the-weekend:189` map link · `RsvpForm:323` disclaimer (Jost, faux italic).
**Verdict: italic is the default heading style on FAQ and Costs, i.e. used as general styling on two of six pages.**

### Letterspacing on uppercase kickers

| Element | Tracking | Size |
|---|---|---|
| `.eyebrow` (`global.css:38`) and the React copy (`RsvpForm:22`) | 0.15em | 0.78rem / 12.5 px |
| `.nav-link` (`global.css:47`) | 0.15em | 0.78rem |
| Home CTA (`index:110`), send button (`RsvpForm:29`), sticky "Total" (`RsvpForm:335`) | 0.10em | 0.85–1rem |
| Declining message label (`RsvpForm:188`) | 0.10em | 0.78rem |
| Admin kickers | 0.15em | 0.68rem / 10.9 px |
| Hero h1 (uppercase in content) | 0.02em | 35–80 px |

---

## 5. Spacing and rhythm

**Scale:** there is no scale. Section-level values are `cqw` from the set {3, 4, 4.5, 5, 6, 8, 9, 10, 11, 12, 14, 16}; element-level values are `em` from a 46-value set (0.3 … 6em, with 1.4em the most common at 10 uses); gaps are `cqw` (3, 4, 5, 11) or `em`; the gallery uses `2px`; the admin uses Tailwind's numeric scale (`p-4`, `gap-2`, `mb-6`…). Three unrelated systems, and the `cqw` set is not a progression. **Spacing is ad hoc.**

**Section vertical padding:**

| Token | @390 | @768 | @1440 | @1920 | Ratio 1440:390 |
|---|---|---|---|---|---|
| `pt-[9cqw]` (Home letter, preview, CTA; Weekend, FAQ tops) | 35 px | 69 | 130 | 173 | 3.69 |
| `pb-[12cqw]` (Weekend invitation/finding; FAQ list) | 47 | 92 | 173 | 230 | 3.69 |
| `pb-[8cqw]` (Weekend sub-sections) | 31 | 61 | 115 | 154 | 3.69 |
| `gap-[11cqw]` (Our Story chapters) | 43 | 84 | 158 | 211 | 3.69 |
| `pt-[14cqw] pb-[16cqw]` (Our Story closing) | 55 / 62 | 108 / 123 | 202 / 230 | 269 / 307 | 3.69 |
| `py-[6cqw]` (Footer) | 23 | 46 | 86 | 115 | 3.69 |
| `py-[5cqw]` (Gallery slab, credit) | 20 | 38 | 72 | 96 | 3.69 |
| `pt-[2.4em] pb-[1em]` (RSVP heading) | 38 / 16 | 38 / 16 | 38 / 16 | 38 / 16 | 1.00 |

**The ratio between mobile and desktop never changes** because every value is linear in the viewport; the rhythm is the mobile rhythm enlarged 3.7× at 1440 and 4.9× at 1920. The RSVP page is the exception (fixed `em`), which makes it the one page that does *not* inflate — so it is inconsistent with its siblings instead.

---

## 6. Imagery

### Every image placement

| # | File | Source (px, ratio) | Container | Aspect / size | object-fit | Visible portion |
|---|---|---|---|---|---|---|
| 1 | `photo-6` | 1600 × 2400, 2:3, B&W | Home hero `index:28` | `w-full h-[78vh] min-h-[520px]` | cover | 89 % @390 · 32 % @1440 · 29 % @1920 |
| 2 | `photo-10` | 2:3, colour | Home preview `index:76` | `aspect-ratio:3/4`, 200–320 px | cover | 89 % (crops 11 % of height) |
| 3 | `photo-12` | 2400 × 1600, 3:2, B&W | Home preview | `aspect-ratio:4/3`, offset 4cqw | cover | 89 % (crops 11 % of width) |
| 4 | `photo-11` | 2:3, B&W | Home preview | `3/4`, offset 2cqw | cover | 89 % |
| 5–8 | `photo-8`, `-9`, `-11`, `-7` | 2:3 | Our Story chapters `:55` | `aspect-ratio:4/5`, flex column | cover | 83 % (crops 17 % of height) |
| 9 | `photo-10` | 2:3, colour | Our Story band `:68` | `h-[clamp(380px,60cqw,600px)]` × (100 % + 12cqw, max 1040) | cover | 65 % @390 (390 × 380 box) · 38.5 % @≥1182 (boxed 1040 × 600) |
| 10 | `photo-9` | 2:3, B&W | Weekend Friday band `:95` | `w-full h-[40vh] max-h-[340px] min-h-[220px]` | cover | 58 % @390 · 15.7 % @1440 · 11.8 % @1920 — **faces cut at desktop** |
| 11 | `photo-6` | 2:3, B&W | Weekend Saturday band | same | cover | same — faces on top edge under 0.95 gradient |
| 12 | `photo-7` | 2:3, B&W | Weekend Sunday band | same | cover | same — **heads cut at desktop** |
| 13 | `photo-12` | 3:2, B&W | RSVP banner `rsvp:16` | `w-full aspect-ratio:16/9 max-h-[340px]` | cover | 84 % @≤604 (16:9 box on a 3:2 image) · 35 % @1440 · 27 % @1920 |
| 14–59 | `g-01…g-46` | 43 × (1066 × 1600, 2:3), 3 × (1600 × 1066, 3:2); 29 colour, 17 B&W | Gallery `:55-80` | band / single / pair / trio (see H-02) | cover | 31–81 % depending on frame and viewport; never 100 % |
| — | lightbox `#lightbox-img` | 1800 px webp requested from 1066 px sources | `fixed inset-0` | `max-h-[82%] max-w-[92%]` | **contain** | 100 % (the only place a photo is shown whole) |

`loading="eager" fetchpriority="high"` on the hero (`index:34-35`) and `loading="eager"` on the RSVP banner (`rsvp:17`); everything else lazy.

**Art direction per breakpoint:** none. Every placement uses one `src`, `object-position` is never set (default 50 % 50 %), there are no `<picture>` elements and no per-breakpoint sources. The same centre crop is served at every viewport; only the container ratio changes, which is why the same photo shows 89 % on a phone and 29 % on a desktop.

**Bleed:** images bleed only as symmetric full-width bands (hero, three day bands, RSVP banner, gallery grid). No image breaks a container edge, overlaps text, or extends beyond its column. The Our Story band is intended to but stops at 1040 px (H-01).

---

## 7. Motion

### Inventory

| # | Effect | Where | Trigger | Reduced-motion |
|---|---|---|---|---|
| 1 | Scroll reveal: opacity 0→1, 0.7 s ease | `global.css:57-62`; observer in `Base.astro:43-59` (rootMargin −8 %, threshold 0, unobserve after first) | 25 `data-reveal` elements — Home (4), Our Story (6), Weekend (7), FAQ (8) — plus every gallery block | ✓ honoured |
| 2 | Reveal + lift: `translateY(20px)`→0, 0.8 s | `global.css:61`; Our Story only (`data-reveal="lift"`, 6 elements) | scroll | ✓ |
| 3 | `.fade-in` keyframe opacity, 0.7 s | `global.css:68-69`; RSVP sections `RsvpForm:34,130,179,326` | mount | ✓ |
| 4 | Gallery image zoom `scale(1.03)`, 500 ms | `gallery.astro:45` | hover | ✗ |
| 5 | Smooth scroll to top | `RsvpForm.tsx:121` | RSVP submit | ✗ |
| 6 | `transition-colors` on buttons/links/hover fills | `Nav:50`, `index:110`, `RsvpForm:29,167,233,256`, `faq:44`, admin | hover | n/a (colour) |
| 7 | `transition-opacity` logo hover 65 % | `Nav:32` | hover | n/a |
| 8 | Underline-offset transition on "+ Add another guest" | `RsvpForm:245` | hover | n/a |
| 9 | Lightbox open/close | `gallery.astro:110-153` | click / swipe / keys | instant (no animation) |

`prefers-reduced-motion` is respected for items 1–3 and not for 4–5. There is no scroll-linked, parallax, staggered, or image-reveal motion; no page transitions.

**Verdict: motion is purely decorative fade-in.** Every reveal is the same 0.7 s opacity on whole blocks; nothing enters from a side, nothing reveals in sequence, nothing moves at a different rate to anything else. Motion is not doing compositional work.

---

## 8. Style-rule compliance

**`border-radius` > 0:** none declared anywhere in `src/` or `public/`. Native controls (`RsvpForm:259` radios; admin `<select>` at `AdminDashboard:116,122`, `HouseholdCard:133,138`; `type="search"` at `AdminDashboard:109`; `type="number"` spinners) will render with browser chrome that is rounded on iOS/macOS — **cannot determine from code**; needs a render.

**`box-shadow` / any shadow:** one — `Nav.astro:19` `text-shadow: 0 1px 4px rgba(0,0,0,0.35)` on the overlay nav. No `box-shadow`, no `shadow-*` utility, no `drop-shadow`.

**Boxed/card components that should be hairline rules:**

| File:line | Component | Current treatment |
|---|---|---|
| `RsvpForm.tsx:167-168` | Attending / Declining choice | four-sided `border`, `bg-brand-soft` fill + `border-brand-ink` when selected |
| `RsvpForm.tsx:27` | `boxInput` textareas (message, dietary) | four-sided `border` box |
| `Nav.astro:50-52` | RSVP nav link | four-sided `border` box with padding |
| `index.astro:110` | Home CTA | solid Espresso filled block |
| `RsvpForm.tsx:28-29` | Send buttons | solid filled block (arguably fine for a primary action; listed for completeness) |
| `AdminDashboard.tsx:100` | Stat grid | `border` + `bg-brand-rule gap-px` boxed grid |
| `AdminDashboard.tsx:95` | Error banner | `border border-red-200 bg-red-50 p-4` box |
| `AdminDashboard.tsx:133` | Empty state | `border-dashed p-8` box |
| `AdminDashboard.tsx:13,15`; `AddHouseholdForm.tsx:4,46`; `HouseholdCard.tsx:13` | Buttons/inputs | `border bg-white` boxes |
| `AddHouseholdForm.tsx:35` | Add-household panel | `border bg-brand-soft p-4` card |
| `HouseholdCard.tsx:75` | Household card | `border bg-white` card |
| `HouseholdCard.tsx:5-12,85,90` | Status badges | filled colour chips |

Compliant hairline patterns worth noting as the reference: Weekend timeline rows (`the-weekend:106`, `border-t` only), FAQ items (`faq:43`), RSVP `lineInput` (`RsvpForm:25`, `border-b` only), detail rows (`RsvpForm:45`), orientation strip (`index:96`, hairline grid).

**Letterspaced uppercase kickers:** compliant — `.eyebrow` 0.15em uppercase on every section label. **Italic reserved for expressive lines:** not compliant (H-04).

---

## "Mobile-scaled-up" verdict

**Yes.** The desktop view is the mobile composition at a larger size. Evidence:

1. **No discrete layout rules exist above 640 px.** `grep` for `md:|lg:|xl:|@media (min-width` across `src/pages`, `src/components/site`, `src/layouts`, `src/styles` returns nothing. The single public `sm:` rule (`RsvpForm.tsx:206`) puts two inputs side by side.
2. **Every dimension is a linear function of viewport width.** 13 × `px-[6cqw]`, 26 distinct `cqw` paddings/gaps, 22 `clamp(…, Ncqw, …)` type sizes. At 1440 every space is 3.69× its 390 px value; at 1920, 4.92×. Nothing is capped or re-proportioned.
3. **Columns stay single and centred, and get narrower.** Content width of the 680 px containers: 557 @1024 → 507 @1440 → 450 @1920 (C-04). Every page is `mx-auto` with `text-center` or a left-aligned single column; no asymmetric spans, no offsets, no overlaps, no sidebars.
4. **The only "desktop" behaviours are flex-wrap side effects** — Our Story going two-column at ~723 px (the one genuine recomposition), the preview row going 3-up at ~805 px, the orientation strip 3-up at 660 px, gallery 2/3-up at 522/604 px. These are "same content, more columns", not different compositions, and they finish happening below 810 px; from 810 to 1920 nothing changes except scale.
5. **Full-width imagery is the same file with the same centre crop at every size** (§6), so the desktop hero and bands are the mobile images stretched to a wider box, losing 60–88 % of the frame.
6. **The one desktop-specific moment fails at desktop:** the Our Story breakout band is boxed at 1040 px above ~1182 px (H-01).
7. **Nav has no mobile pattern and no desktop pattern** — a single `flex-wrap` row that wraps on phones and floats in a 1080 px box on desktop.

The honest description of the current build is: a well-proportioned phone layout whose proportions have been multiplied by the viewport width.

---

## Items that cannot be determined from code

- Exact wrap points of the nav and of `whitespace-nowrap` lines (H-11, H-12): need renders at 375, 390, 414 px.
- Contrast of Linen text over the hero photo and of `#CFC9BF` over the gradient (§3): need renders or sampled luminance under the text.
- Native control corners (radios, selects, search) on iOS/macOS (L-08): need renders in Safari.
- Placeholder text contrast: browser default; need a render.
- Precise characters-per-line: glyph advance widths for the two Google fonts were estimated (0.42 em / 0.50 em).

*End of audit. No fixes proposed, per brief.*
