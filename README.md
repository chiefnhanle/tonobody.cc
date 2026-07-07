# Thought Vault

Thought Vault is a deliberately forgetful scratchpad. You type whatever is on your mind, and when you're done you `/send` — which rips the whole page and resets it to blank. Nothing is stored, anywhere. It exists to help with anxiety: a place to empty your head that you never have to tend, revisit, or clean up.

## The idea

- **Empty slate.** Open it and there's just a page and a few faint prompts.
- **`/send` is a purge button.** It doesn't save or transmit anything. It clears the page so you can start fresh.
- **A goal bar** at the top of the screen fills as you add lines and drains slowly over time. The aim is to keep writing fast enough to top it off — a gentle nudge to get the thoughts out.
- **Ghost lines** are the faint witty prompts on the empty page. You can add your own.

## What it deliberately does not do

There is no storage, no persistence, no memory. No files, no database, no browser storage, no accounts, no network calls, no telemetry. Close the tab and it's gone.

## Slash is the interface

Everything lives behind `/` commands typed into the page — there are no visible buttons.

| Command    | What it does                              |
| ---------- | ----------------------------------------- |
| `/send`    | release everything and reset the page     |
| `/bar`     | adjust how big the goal bar is (a slider) |
| `/ghost`   | add your own starting prompts             |
| `/bold`    | toggle bold text                          |
| `/italic`  | toggle italic text                        |
| `/list`    | start a bullet list                       |
| `/quote`   | set something aside as a quote            |
| `/help`    | show every command                        |

`Cmd/Ctrl+Enter` is a shortcut for `/send`.

## The goal bar

The bar rewards momentum. Each new line pushes it up; time gently pulls it back down. You never lose progress by editing or deleting — only by pausing. Use `/bar` to set how big the goal is: a bigger goal takes more sustained writing to fill.

## Ghost lines

The faint prompts on the empty page (e.g. "Message yourself here…"). The defaults live in `app/utils/ghosts.ts` — add strings there for permanent prompts, or use `/ghost` to add prompts for the current session.

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
pnpm preview
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```
