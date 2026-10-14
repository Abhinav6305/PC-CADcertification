# PSCAD Workshop — Certificate Portal

Certificate portal for **PSCAD: A Hands-on Workshop on Power System Simulation**
(Department of EEE, St. Peter's Engineering College, 5–6 October 2026).

A participant enters their **roll number or name**, sees their details, previews
their certificate and downloads it as **PDF or PNG**. Winners (Team Shakalaka) get only
the First Place Merit certificate, runners-up (Team Aura 4) only the Runner Up Merit
certificate; everyone else gets the Participation certificate.

- 30 participants · 7 First Place · 4 Runner Up
- Everything runs in the browser — no backend, no database.

## Quick start

```bash
node server.js        # → http://localhost:5173
```

> Open it through the server (or use `dist/index.html`). Opening the root
> `index.html` straight from disk blocks canvas downloads in Chrome.

## Deploy

`dist/index.html` is a single self-contained file (≈3 MB) with the templates and
data embedded. Upload it to Netlify Drop, Vercel, GitHub Pages or any static host.

## Updating participants

1. Edit `data/participants.csv`
   (`award` = blank, `first-place` or `runner-up`; roll numbers must be unique).
2. `node scripts/bundle.js` — regenerates `js/data.js` and rebuilds `dist/index.html`.

## Adjusting the name position

`js/config.js` → each template has `x`, `y` (baseline), `size` and `maxWidth`, all as
fractions of the template image. Long names shrink automatically to fit `maxWidth`.

## Structure

```
index.html                 page
css/style.css              styles (ELECSPIRE theme — white + orange)
js/config.js               templates + name placement
js/data.js                 generated from data/participants.csv
js/pdf.js                  dependency-free PDF writer
js/app.js                  search, render, download
js/gallery.js              photo lightbox
assets/logo.png            ELECSPIRE logo
assets/gallery/            event photos
assets/people/             resource person photos
assets/templates/          first-place.jpg, runner-up.jpg, participation.jpg
data/participants.csv      source of truth
data/PSCAD_Workshop_Participants.pdf   original list
scripts/build-data.js      CSV → js/data.js
scripts/bundle.js          → dist/index.html
server.js                  local dev server
```

Deep link to a participant: `…/index.html#25BK1A0219`
