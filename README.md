# tonobody.cc

*A little pet project I did to learn vue*

tonobody.cc is a deliberately forgetful scratchpad. You type whatever is on your mind, and when you're done you `/scrap` it — which rips the whole page and resets it to blank. Nothing is stored, anywhere. It exists to help with anxiety: a place to empty your head that you never have to tend, revisit, or clean up.

## The idea

- **Empty slate.** Open it and there's just a page and a few faint prompts.
- **`/scrap` is a purge button.** It doesn't save or transmit anything. It clears the page so you can start fresh.
- **A momentum bar** fills as you type — every character counts — and drains slowly over time. The aim is to keep writing fast enough to top it off. Drag it anywhere; drop it near a screen edge and it docks there as a bar, or drop it in the open and it stays a floating circle. On touch devices, tap it to switch between bar and circle instead of dragging.
- **Ghost lines** are the faint witty prompts on the empty page. You can add your own.
- **Color schemes.** Five pastel presets, three dark and two light — pick one with `/theme`.

## What it deliberately does not do

There is no storage, no persistence, no memory. No database, no browser storage, no accounts, no network calls, no telemetry. Close the tab and it's gone.

The one exception is `/capture`, and even that keeps the promise: it never writes anything on its own and never transmits. It only builds a PNG in your browser and hands it to you as a download when you explicitly ask — see [Capture](#capture).

## Slash is the interface

Everything lives behind `/` commands typed into the page — there are no visible buttons.

| Command   | What it does                          |
| --------- | -------------------------------------- |
| `/scrap`  | release everything and reset the page |
| `/bar`    | adjust the goal size and drain speed (sliders) |
| `/ghost`  | add your own starting prompts          |
| `/theme`  | pick a color scheme                    |
| `/about`  | read the mission, find the source      |
| `/capture`| download a cozy snapshot of the page as an image |
| `/bold`   | toggle bold text                       |
| `/italic` | toggle italic text                     |
| `/list`   | start a bullet list                    |
| `/quote`  | set something aside as a quote         |
| `/help`   | show every command                     |

`Cmd/Ctrl+Enter` is a shortcut for `/scrap`.

## The momentum bar

The bar rewards momentum. Every character you type pushes it up; time gently pulls it back down. You never lose progress by editing or deleting — only by pausing. Use `/bar` to set how big the goal is (in characters) and how fast it drains.

## Capture

`/capture` downloads a cozy image of whatever is on the page — a deliberate, one-off keepsake you ask for, not automatic saving. The snapshot is drawn to look like a warm surveillance still: your text in a handwritten font, a soft vignette and film grain, viewfinder corner brackets, and a little camera-style date stamp. It uses the colors of your current `/theme`.

Everything happens in your browser on a `<canvas>` — nothing is uploaded or stored server-side. The result is saved to your downloads as `tonobody-<timestamp>.png`. If the page is empty there's nothing to capture, and it'll tell you so. The rendering logic lives in `app/utils/capture.ts`.

## Ghost lines

The faint prompts on the empty page (e.g. "Message yourself here…"). The defaults live in `app/utils/ghosts.ts` — add strings there for permanent prompts, or use `/ghost` to add prompts for the current session.

## Color schemes

Presets live in `app/utils/themes.ts` as CSS custom properties; `/theme` opens a picker. The choice is session-only, like everything else here.

## Prerequisites

- Node.js 22 or newer
- pnpm 10 or newer

## Install and run

```bash
pnpm install
pnpm dev
```

Default URL: http://localhost:3000

## Scripts

```bash
pnpm dev
pnpm build
pnpm generate
pnpm preview
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

## Deploying (Cloudflare Workers)

There's no server-side logic anywhere in this app — no API routes, no server-only data — so `pnpm run generate` prerenders every route to a static file in `.output/public` and no Worker script is ever built. This deploys as an **assets-only Worker**: Cloudflare serves those files directly with zero Worker code running per request, via the committed `wrangler.jsonc`.

Deploy is driven by [Wrangler](https://developers.cloudflare.com/workers/wrangler/). Point a Cloudflare **Workers** project (Workers & Pages → *Create* → *Import a repository* → *Workers*, i.e. "Workers Builds") at this repo with:

- **Build command:** `pnpm run generate`
- **Deploy command:** `npx wrangler deploy`
- **Node version:** 22 (pinned in `.node-version`; Cloudflare also picks up `packageManager` for pnpm automatically)

Cloudflare auto-detects Nuxt and builds with Nitro's `cloudflare-module` preset, which by default assumes it's deploying a Worker script and unconditionally points `main` at a `.output/server/index.mjs` — a file that's never generated here, since the app is fully static. Left alone, that breaks deploy with *"entry-point file at index.mjs was not found."* `nitro.cloudflare.deployConfig` is set to `false` in `nuxt.config.ts` so Nitro doesn't try to auto-manage the Cloudflare config, and the committed `wrangler.jsonc` declares an `assets`-only config (no `main`, no binding) instead.

To deploy by hand from your own machine (after `wrangler login`):

```bash
pnpm run generate
npx wrangler deploy        # or: npx wrangler versions upload  (staged, no traffic shift)
```

`/about` is only reachable via a client-side slash command rather than a real link, so it's listed explicitly in `nitro.prerender.routes` (`nuxt.config.ts`) to make sure the static crawler generates it — if you add more pages that aren't linked with a real `<a>`/`<NuxtLink>`, add them there too.

## Pointing your domain at it

Once a deploy succeeds, the Worker is live at `https://<worker-name>.<your-subdomain>.workers.dev`. To serve it from `tonobody.cc`, add a **custom domain** to the Worker — Cloudflare provisions the DNS record and TLS certificate for you:

1. **Get the domain onto Cloudflare first.** In the dashboard, *Add a site*, enter `tonobody.cc`, and at your registrar replace the nameservers with the two Cloudflare gives you. Wait until the zone shows **Active**. (Skip this step if the domain is already on your Cloudflare account.)
2. **Attach the domain to the Worker.** Open the Worker → **Settings** → **Domains & Routes** → **Add** → **Custom Domain**. Enter `tonobody.cc` (add `www.tonobody.cc` too if you want it). Cloudflare creates the proxied DNS records and issues the certificate automatically — no manual `CNAME`/`A` record needed.
3. **Wait for the cert.** It's usually ready within a minute or two; the domain flips to **Active** in that panel. Then `https://tonobody.cc` serves the app.

Prefer the CLI? The same thing lives in `wrangler.jsonc` — add a `routes` entry and it's applied on the next `npx wrangler deploy`:

```jsonc
"routes": [
  { "pattern": "tonobody.cc", "custom_domain": true }
]
```

Notes:

- The zone must be on the **same Cloudflare account** as the Worker.
- A **Custom Domain** (above) is the simple path and terminates directly on the Worker. A **Route** (e.g. `tonobody.cc/*`) is the other option — more flexible, but it needs a matching proxied (orange-cloud) DNS record to already exist for that hostname.
- Registrar propagation of nameservers in step 1 can take anywhere from minutes to a day; steps 2–3 are near-instant once the zone is Active.
