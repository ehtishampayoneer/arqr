# ARQR

Marketing site for ARQR — AR catalogs for furniture, rug and decor sellers.

One static page. No build step, no dependencies.

## Structure

- `index.html` — the whole site: hero, how it works, catalogs, why it works, pricing, contact
- `assets/` — card artwork, room render, step images, and the two how-it-works clips
- `vercel.json` — long-lived cache headers for `/assets`

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
