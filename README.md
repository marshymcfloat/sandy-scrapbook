# Sandy’s Scrapbook

Private movie shelf and birthday note, served by a Cloudflare Worker.

## Preview on this PC

Use Node.js 24 and run these commands in the project folder.

```powershell
npm ci
@'
SITE_PASSPHRASE=sandy-preview
SESSION_SECRET=local-test-session-secret-this-is-for-preview-only
'@ | Set-Content -Encoding utf8 .dev.vars
npm run media:local -- 'C:\Users\LENOVO\Downloads\Forrest Gump-1080P.mp4'
npm run dev
```

Open [localhost:8787](http://localhost:8787) with the preview passphrase `sandy-preview`. The movie import keeps a development copy in `.wrangler`. Import before starting the preview server.

## Deploy

1. Enable [R2](https://developers.cloudflare.com/r2/get-started/) in your Cloudflare account and sign in with `npm exec -- wrangler login`.
2. Create the Standard bucket with `npm exec -- wrangler r2 bucket create sandyfave-media`. Keep public access disabled.
3. Use [R2 API tokens](https://developers.cloudflare.com/r2/api/tokens/) to create an Object Read & Write credential scoped to `sandyfave-media`. Enter its credentials and your account ID in the ignored `.r2.vars` file.

   ```dotenv
   CLOUDFLARE_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   ```

   Set `R2_SESSION_TOKEN` too if using temporary credentials. Then upload the MP4.

   ```powershell
   npm run media:upload -- 'C:\Users\LENOVO\Downloads\Forrest Gump-1080P.mp4'
   ```

4. In the ignored `.production.json` file, set `SITE_PASSPHRASE` to the unique phrase Sandy will enter and `SESSION_SECRET` to a separate random key. Generate the key locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. The file is a JSON object with the two names as keys and both values as strings.

   ```powershell
   npm run deploy -- --secrets-file .production.json
   ```

5. Open the resulting `workers.dev` URL in a fresh browser. Confirm that the passphrase unlocks the page and the direct movie URL requires a session. Test playback, sound, seeking, fullscreen, and resume on both desktop and a phone on cellular data. Share the URL and passphrase with Sandy on November 20.

## Checks

```powershell
npm run check
npm test
npm run build
npm exec -- wrangler deploy --dry-run
```

## Artwork

The built-in ImageGen tool created the still used in `web/art/bench.webp` and its smaller exports.

<details>
<summary>Image prompt</summary>

Create one original photorealistic cinematic landscape still for a personal birthday movie shelf poster. A quiet, empty old wooden slat park bench with dark wrought iron arms sits on the edge of a pale curving path in a southern American public garden. A small naturally wrapped bunch of two muted strawberry-red tulips and a pale lily rests at the far end of the bench. The bench is the main readable silhouette centered slightly to the right, all visible with generous framing; foreground of soft grass, layers of oak trees and late-afternoon sun filtering through Spanish moss, warm side light from the left, soft shadows. Wide landscape framing meant to crop around the center to 16:9. Natural 35mm film still, fine grain, olive foliage, honey and bronze light, charcoal wood shadows, tactile and understated. Make it resemble a photograph you could actually take in a park; emotionally quiet, a little nostalgic. No people, no text, no lettering, no borders, no logos, no watermarks, no movie still reproduction.

</details>

The built-in ImageGen tool created the open notebook in `web/art/notebook-spread.webp` and the phone version in `web/art/notebook-page.webp`.

<details>
<summary>Notebook spread prompt</summary>

Create one original photorealistic cutout product photograph of a blank open journal, viewed exactly overhead. This is a wide landscape website background, and all notebook edges must be straight and level, with no perspective tilt or rotation. The open notebook itself is wide, around 1.8:1, with two large blank writable cream ivory paper pages, fine realistic paper fibers, a very faint blush pink inner margin line, and a small neat pearl-metal spiral binding exactly at the center seam. The left page is very clean and mostly plain so dark handwriting and a form can be laid over the photo later. The right page has an almost invisible lavender dot grid. A thin dusty lavender hard cover peeks out around the pages, with gently rounded outer corners, layered paper edges, and a tiny soft realistic contact shadow. The whole notebook is in frame and nearly fills the landscape canvas with minimal, even transparent padding around all edges. Light, delicate and understated, Japanese stationery product photography. Transparent isolation outside the notebook, no table, no objects, no text, no handwriting, no stamps, no logos, no watermarks. One open notebook only.

</details>

<details>
<summary>Single notebook page prompt</summary>

Create one original photorealistic cutout product photograph of a single visible blank cream ivory notebook page with a thin dusty lavender hard cover and pearl-metal spiral binding down its extreme left edge. View exactly overhead with straight level edges, no rotation or perspective. Portrait aspect ratio approximately 2:3. Match a light Japanese stationery journal: warm ivory paper, subtle fine paper fibers, a nearly invisible blush margin line near the binding, tidy layered paper edges, gently rounded right cover corners and a tiny soft contact shadow. A faint lavender dot grid is acceptable near the top, with the middle and lower part visually clean for a web sign-in form to be overlaid. Keep the page completely blank. The notebook nearly fills the portrait canvas, with minimal even transparent padding around every edge. Transparent isolation outside the notebook. No table, no objects, no hands, no text, no handwriting, no labels, no logos, no watermarks. One blank single-page spiral notebook only.

</details>

The built-in ImageGen tool created the passphrase page illustration in `web/art/journal-sketch.webp`.

<details>
<summary>Notebook illustration prompt</summary>

Create a single isolated editorial illustration for the cover of a very light, feminine personal notebook about movie nights. This must look like original hand-drawn pencil art on a transparent background, ready to place over pale grid paper. Main composition: a loosely gathered pair of blush pink tulips and one ivory lily with long muted sage stems, lying diagonally across a gently curling strip of 35 mm film. In one small film frame include a simple sketch of an empty park bench, very subtle. A small old-fashioned brass key sits near the loose stems. Include two tiny hand-drawn four-point pencil sparkles separate from the cluster. Keep the composition natural and airy, grouped in a roughly square silhouette with generous, evenly distributed transparent padding at every edge. Use soft but visible graphite contour lines, uneven pencil pressure, fine hatching, dry colored pencil with dusty lilac, blush and muted sage accents. Keep the forms clear when displayed at 180 px wide. No lettering, no words, no numbers, no labels, no photorealism, no 3D, no logos, no paper background, no visible layer of gray or white outside the marks, no checkerboard pattern. Illustration only, no website UI.

</details>
