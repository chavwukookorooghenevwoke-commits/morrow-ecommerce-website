# Morrow — responsive e-commerce storefront

A portfolio-ready **front-end e-commerce demonstration** built with semantic HTML5, Bootstrap 5, custom CSS and vanilla JavaScript. Morrow is a *fictional home-lifestyle brand*, not a real retailer.

## Run locally

1. Unzip the archive. All project files are at the top level; there are no subfolders.
2. Open `index.html` in Chrome, Safari or Firefox. The website has no build step. For GitHub, upload the individual extracted files, **not the ZIP archive**.
3. For more reliable testing, open Terminal in this folder and run:

   ```bash
   python3 -m http.server 5500
   ```

   Then open http://localhost:5500/ in a browser.

**Internet access is required** to load the Unsplash photos, Google Fonts, Font Awesome icons and Bootstrap CSS served by CDN. A local illustrated photo fallback and custom CSS are included if external resources fail. No account or API key is required.

## Features

- Responsive editorial homepage, sticky header and mobile navigation.
- 12 sample catalogue products across furniture, lighting, décor and textiles.
- Category filters, instant text search and five sorting modes.
- Load-more pagination, product ratings and clear result/empty states.
- Wishlist with saved state in `localStorage`.
- Basket with quantity controls, remove controls, calculated subtotal and estimated delivery threshold.
- Product quick-view modal and quantity selection.
- Simulated checkout that validates form fields, never transmits data and never accepts payment details.
- Demo newsletter interaction (no email is saved/sent).
- Keyboard accessible buttons and dialogs, focus trapping, Esc to close, alt text, reduced-motion support.
- Product records stored in one editable JavaScript file.

## GitHub upload — no subfolders

1. Create a **public** repository named `morrow-ecommerce-website` on GitHub.
2. In the repository, click **Add file → Upload files**.
3. **Extract the ZIP first**, then select or drag **all eight files** into the upload page. Do not upload the ZIP itself.
4. Commit the files. `index.html` must appear at the root of the repository alongside the CSS, JS and SVG files.
5. To publish the site, go to **Settings → Pages**, choose **Deploy from a branch**, then select **main** and **/(root)** and save.
6. Open the GitHub Pages address when the deployment is ready. The site uses external photo and library links, so it needs an internet connection.

## File layout — all files at repository root

```text
index.html           # Main page
styles.css           # Custom responsive design
products.js          # Product data
app.js               # Search, basket, favourites, quick view, checkout
favicon.svg          # Browser icon
image-fallback.svg   # Offline image fallback
README.md            # Setup and project overview
CREDITS.md           # Photo and software credits
```

## How to personalise it for your university portfolio

- Replace **Morrow** with a name you choose, or keep it as your fictional concept brand.
- Choose products and photographs you personally curated; update `products.js`.
- Replace the GitHub homepage link in `index.html` with **your own real repository URL**.
- Deploy the folder on GitHub Pages, Netlify or Vercel; all use static hosting.
- Write your own project entry describing your design approach, what you built and tested, plus challenges you personally solved. Check each feature yourself before making portfolio claims.
- **University assessment:** Acknowledge any AI assistance as required by your assessment brief, and be prepared to explain and modify the code yourself.
- Take desktop/mobile screenshots after testing; document any changes you make.

## Limitations / future development

This is **not** a production store. There is no database, inventory sync, server-side order handling, account authentication, payment gateway, tax service, stock management or true mailing-list integration. Products/prices/review counts are fictional, and photos are illustrative, not actual product listings. Use invented test details when trying the checkout; checkout fields are not persisted or transmitted.

For a stronger job portfolio, future iterations could add React or Vue, a test suite, a real data API, backend auth, a secure checkout provider in sandbox mode, image optimization and accessibility audits.
