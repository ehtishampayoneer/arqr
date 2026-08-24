# ARQR

Marketing site for ARQR — AR catalogs for furniture, rug and decor sellers.

One static page. No build step, no dependencies.

## Structure

- `index.html` — the whole site: hero, how it works, catalogs, why it works, pricing, contact
- `assets/` — card artwork, room render, step images, and the two how-it-works clips
- `vercel.json` — cache headers for `/assets`. Deliberately NOT `immutable`:
  art is replaced under the same filenames, and `immutable` pins the old file
  even through a hard refresh. Raise to a long max-age once the art is final.
  Note: vercel.json is strict JSON — no comments, and no keys outside
  `source`/`headers` and `key`/`value`, or the deploy is rejected.

## Running it locally

Open `index.html` in a browser, or serve the folder:

    npx serve .

## Deploying

Vercel is connected to this repository. Any push to `main` deploys.

## Still to do

- Connect the contact form: set `FORM_ENDPOINT` in the page script to a Formspree
  or Web3Forms URL. Until then the form validates but does not send.
- Verify the Shopify and Houzz figures in the "Why it works" section and link sources.
- Compress the images in `assets/` — they are full-size PNGs and dominate page weight.
- Prices in the pricing section are hypotheses, not yet validated with customers.

## Replacing an image

Asset URLs carry a version query — `assets/why-size.png?v=2`. A browser that
cached a file under the old `immutable` header will not revalidate it, so
replacing the file alone is not enough: the URL has to change too.

After replacing anything in `assets/`, bump every `?v=N` in `index.html` to the
next number. There is a script for it:

    npm run bump


## The sample catalogs

These are **not** a marketplace. Each sample is one shop's own catalog, at its
own address, carrying only that shop's name, colour, products and code. Four of
them exist purely to show a seller one that sells what they sell.

| Business | Shop | Address | Button says |
|---|---|---|---|
| Furniture | Novara Living | `/novara` | See it in your room |
| Footwear | Corso Footwear | `/corso` | Try them on |
| Decoration | Maison Ora | `/maison` | See it in your room |
| Rugs & carpets | Terra & Weave | `/terra` | See it on your floor |

`catalog.html` (`/catalog`) is only the sampler that hands you off to one of
them — the QR on the home page points there. `store.html` renders whichever
shop the address names; `vercel.json` rewrites `/novara` and friends onto it,
so each shop gets a clean address of its own.

`stores.js` holds all four shops. **Adding a fifth means three edits:** append
it to `stores.js`, add a rewrite in `vercel.json`, then `npm run qr`.

### The QR codes

Generated, not drawn — one for the sampler and one per shop, so a shop's code
opens that shop's catalog and nothing else. They point at
`https://arqr-two.vercel.app`.

**If the site moves to a custom domain every code must be regenerated**,
otherwise scans land on the old address:

    node qr-gen.js https://yourdomain.com

### Product photos

Tiles fall back to line art. Drop a real photo at

    assets/catalog/<shop>-<n>.webp     e.g. assets/catalog/corso-1.webp

and it appears on that tile by itself — no code change. `<n>` is the product's
position in its shop, counting from 1. Until a photo exists the page probes for
it and the browser console logs a 404; that is the fallback working, not a bug.

### What still needs 3D files

The AR button cannot open a real camera view until each product has a 3D model
— `.usdz` for iPhone, `.glb` for Android. The wiring is already there
(`rel="ar"` on iOS, Scene Viewer on Android); add `usdz:` and `glb:` paths to a
product in `stores.js` and that product goes straight into AR. Without them the
button explains what would happen instead of failing.

## Commands

    npm run images   # re-encode assets/*.png to webp after replacing art
    npm run qr       # rebuild every QR code
    npm run bump     # raise ?v=N across all pages so browsers refetch
    npm run art      # images + bump, the usual one after swapping art
