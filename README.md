# Sandy’s Scrapbook

A private scrapbook built with Next.js App Router, React, TypeScript, and GSAP. OpenNext packages the app for Cloudflare Workers. The movie lives in the private Cloudflare R2 bucket sandyfave-media.

## Preview on this PC

Use Node.js 24 or newer. Install dependencies in the project folder.

```powershell
npm ci
```

Create an ignored .dev.vars file for local settings if it does not exist.

```dotenv
NEXTJS_ENV=development
SITE_PASSPHRASE=sandy-preview
SESSION_SECRET=local-test-session-secret-this-is-for-preview-only
```

Start Next.js.

```powershell
npm run dev
```

Open [localhost:8787](http://localhost:8787), enter sandy-preview, and click **Unlock**. Next.js reads the local Cloudflare bindings and development secrets through OpenNext. Notes and playback position are saved in the current browser.

The local movie import persists in .wrangler/state and is available across development-server restarts. On this PC, the movie has already been downloaded from R2 and imported. On a fresh checkout, download and import the cloud copy before starting the preview.

```powershell
npm exec -- wrangler login
npm exec -- wrangler r2 object get sandyfave-media/forrest-gump.mp4 --remote --file .wrangler/forrest-gump-r2-download.mp4
npm run media:local -- .wrangler/forrest-gump-r2-download.mp4
npm run dev
```

To import a different local copy, pass its absolute MP4 path to npm run media:local.

## Deploy to Cloudflare

The production Worker sandyfave uses the existing private R2 bucket sandyfave-media and the object forrest-gump.mp4. Sandy can stream the movie through the deployed site after entering its production passphrase. Cloudflare serves the movie independently of this PC.

1. Sign in with npm exec -- wrangler login.
2. Ensure SITE_PASSPHRASE and SESSION_SECRET are configured as secrets on the sandyfave Worker. Existing production secrets are reused on deployment. SESSION_SECRET must contain at least 32 characters.
3. Build and deploy the Next.js app with OpenNext.

   ```powershell
   npm run deploy
   ```

   For a first deployment, an ignored .production.json file may supply the two secrets as string values.

   ```powershell
   npm run deploy -- --secrets-file .production.json
   ```

4. Open [the deployed scrapbook](https://sandyfave.sandyfave.workers.dev/) in a fresh browser, unlock it with the production passphrase, and test playback, sound, seeking, fullscreen, and resume before sharing it.

To test the built Worker locally, stop the development server and run npm run preview. This builds with OpenNext and serves the app on port 8787 using the local Cloudflare bindings.

## Vercel deployment

The same Next.js project can also run on Vercel. Set the server environment variable `CLOUDFLARE_BACKEND_URL` to `https://sandyfave.sandyfave.workers.dev` and deploy the GitHub repository with the Next.js preset.

Vercel renders the scrapbook pages and forwards unlock, lock, session validation, and weather requests to Cloudflare. For movie playback, Cloudflare issues a temporary movie-only link after validating the session. The browser then streams directly from Cloudflare, which reads the movie from the private R2 bucket. Both sites accept the Cloudflare production passphrase. Notes and playback position are saved separately for each site's browser origin.

## Upload a replacement movie

Store R2 S3 credentials in the ignored .r2.vars file.

```dotenv
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
```

Set R2_SESSION_TOKEN too when using temporary credentials, then upload the replacement.

```powershell
npm run media:upload -- 'C:\path\to\your-movie.mp4'
```

The upload uses the object name forrest-gump.mp4. The R2 bucket stays private and the Worker checks the session before serving it.

## Checks

```powershell
npm run check
npm test
npm run build
npm exec -- opennextjs-cloudflare build
npm exec -- wrangler deploy --dry-run
```

The route tests use isolated Cloudflare bindings to exercise authentication, rate limiting, locking, and movie byte ranges. Unlock failures redirect to the cover with feedback so reloading the page does not resubmit the passphrase.

## Project structure

- src/app contains the page, layout, and unlock, lock, movie, and weather route handlers.
- src/components contains the React notebook, artwork, player, weather, and notes components.
- src/client contains the existing browser interaction logic, scoped to component refs with cleanup on unmount.
- src/auth.ts, src/movie.ts, and src/weather.ts contain the shared server logic.
- web contains the existing notebook styles.
- public/assets contains the artwork served by Next.js.

## Artwork

The built-in ImageGen tool created the still used in `public/assets/bench.webp` and its smaller exports.

<details>
<summary>Image prompt</summary>

Create one original photorealistic cinematic landscape still for a personal birthday movie shelf poster. A quiet, empty old wooden slat park bench with dark wrought iron arms sits on the edge of a pale curving path in a southern American public garden. A small naturally wrapped bunch of two muted strawberry-red tulips and a pale lily rests at the far end of the bench. The bench is the main readable silhouette centered slightly to the right, all visible with generous framing; foreground of soft grass, layers of oak trees and late-afternoon sun filtering through Spanish moss, warm side light from the left, soft shadows. Wide landscape framing meant to crop around the center to 16:9. Natural 35mm film still, fine grain, olive foliage, honey and bronze light, charcoal wood shadows, tactile and understated. Make it resemble a photograph you could actually take in a park; emotionally quiet, a little nostalgic. No people, no text, no lettering, no borders, no logos, no watermarks, no movie still reproduction.

</details>

The built-in ImageGen tool created the open notebook in `public/assets/notebook-spread.webp` and the phone version in `public/assets/notebook-page.webp`.

<details>
<summary>Notebook spread prompt</summary>

Create one original photorealistic cutout product photograph of a blank open journal, viewed exactly overhead. This is a wide landscape website background, and all notebook edges must be straight and level, with no perspective tilt or rotation. The open notebook itself is wide, around 1.8:1, with two large blank writable cream ivory paper pages, fine realistic paper fibers, a very faint blush pink inner margin line, and a small neat pearl-metal spiral binding exactly at the center seam. The left page is very clean and mostly plain so dark handwriting and a form can be laid over the photo later. The right page has an almost invisible lavender dot grid. A thin dusty lavender hard cover peeks out around the pages, with gently rounded outer corners, layered paper edges, and a tiny soft realistic contact shadow. The whole notebook is in frame and nearly fills the landscape canvas with minimal, even transparent padding around all edges. Light, delicate and understated, Japanese stationery product photography. Transparent isolation outside the notebook, no table, no objects, no text, no handwriting, no stamps, no logos, no watermarks. One open notebook only.

</details>

<details>
<summary>Single notebook page prompt</summary>

Create one original photorealistic cutout product photograph of a single visible blank cream ivory notebook page with a thin dusty lavender hard cover and pearl-metal spiral binding down its extreme left edge. View exactly overhead with straight level edges, no rotation or perspective. Portrait aspect ratio approximately 2:3. Match a light Japanese stationery journal: warm ivory paper, subtle fine paper fibers, a nearly invisible blush margin line near the binding, tidy layered paper edges, gently rounded right cover corners and a tiny soft contact shadow. A faint lavender dot grid is acceptable near the top, with the middle and lower part visually clean for a web sign-in form to be overlaid. Keep the page completely blank. The notebook nearly fills the portrait canvas, with minimal even transparent padding around every edge. Transparent isolation outside the notebook. No table, no objects, no hands, no text, no handwriting, no labels, no logos, no watermarks. One blank single-page spiral notebook only.

</details>

The built-in ImageGen tool created the passphrase page illustration in `public/assets/journal-sketch.webp`.

<details>
<summary>Notebook illustration prompt</summary>

Create a single isolated editorial illustration for the cover of a very light, feminine personal notebook about movie nights. This must look like original hand-drawn pencil art on a transparent background, ready to place over pale grid paper. Main composition: a loosely gathered pair of blush pink tulips and one ivory lily with long muted sage stems, lying diagonally across a gently curling strip of 35 mm film. In one small film frame include a simple sketch of an empty park bench, very subtle. A small old-fashioned brass key sits near the loose stems. Include two tiny hand-drawn four-point pencil sparkles separate from the cluster. Keep the composition natural and airy, grouped in a roughly square silhouette with generous, evenly distributed transparent padding at every edge. Use soft but visible graphite contour lines, uneven pencil pressure, fine hatching, dry colored pencil with dusty lilac, blush and muted sage accents. Keep the forms clear when displayed at 180 px wide. No lettering, no words, no numbers, no labels, no photorealism, no 3D, no logos, no paper background, no visible layer of gray or white outside the marks, no checkerboard pattern. Illustration only, no website UI.

</details>
