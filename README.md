# tonobody.cc

tonobody.cc is a deliberately forgetful scratchpad. You type whatever is on your mind, and when you're done you `/scrap` it — which rips the whole page and resets it to blank. Nothing is stored, anywhere. It exists to help with anxiety: a place to empty your head that you never have to tend, revisit, or clean up.

## The idea

- **Empty slate.** Open it and there's just a page and a few faint prompts.
- **`/scrap` is a purge button.** It doesn't save or transmit anything. It clears the page so you can start fresh.
- **A momentum bar** fills as you type — every character counts — and drains slowly over time. The aim is to keep writing fast enough to top it off. Drag it anywhere; drop it near a screen edge and it docks there as a bar, or drop it in the open and it stays a floating circle. On touch devices, tap it to switch between bar and circle instead of dragging.
- **Ghost lines** are the faint witty prompts on the empty page. You can add your own.
- **Color schemes.** Five pastel presets, three dark and two light — pick one with `/theme`.

## What it deliberately does not do

There is no storage, no persistence, no memory. No files, no database, no browser storage, no accounts, no network calls, no telemetry. Close the tab and it's gone.

## Slash is the interface

Everything lives behind `/` commands typed into the page — there are no visible buttons.

| Command   | What it does                          |
| --------- | -------------------------------------- |
| `/scrap`  | release everything and reset the page |
| `/bar`    | adjust the goal size and drain speed (sliders) |
| `/ghost`  | add your own starting prompts          |
| `/theme`  | pick a color scheme                    |
| `/about`  | read the mission, find the source      |
| `/bold`   | toggle bold text                       |
| `/italic` | toggle italic text                     |
| `/list`   | start a bullet list                    |
| `/quote`  | set something aside as a quote         |
| `/help`   | show every command                     |

`Cmd/Ctrl+Enter` is a shortcut for `/scrap`.

## The momentum bar

The bar rewards momentum. Every character you type pushes it up; time gently pulls it back down. You never lose progress by editing or deleting — only by pausing. Use `/bar` to set how big the goal is (in characters) and how fast it drains.

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

## Deploying (Cloudflare Pages)

There's no server-side logic anywhere in this app — no API routes, no server-only data — so it deploys as a plain static site rather than needing Cloudflare's Workers/Functions runtime.

Cloudflare Pages build settings:

- **Build command:** `pnpm run generate`
- **Build output directory:** `.output/public`
- **Node version:** 22 (pinned in `.node-version`; Cloudflare also picks up `packageManager` for pnpm automatically)

`/about` is only reachable via a client-side slash command rather than a real link, so it's listed explicitly in `nitro.prerender.routes` (`nuxt.config.ts`) to make sure the static crawler generates it — if you add more pages that aren't linked with a real `<a>`/`<NuxtLink>`, add them there too.
