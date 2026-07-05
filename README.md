# Thought Vault

Thought Vault is a local-first Nuxt application for capturing raw research thoughts into a Codex-ready Markdown inbox. It is not a general notes app and not an AI chatbot. The app captures; Codex co-thinks later; you approve structure before canonical knowledge files are created.

## What it deliberately does not do

Version 1 does not include automatic AI classification, semantic search, embeddings, graph databases, cloud storage, user accounts, authentication, analytics, telemetry, payments, advertisements, external APIs, or OpenAI API calls.

## Prerequisites

- Node.js 22 or newer
- pnpm 10 or newer
- A local folder to use as your knowledge vault

## Install

```bash
pnpm install
```

## Local development

```bash
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

## Production build and local deployment

```bash
pnpm build
pnpm preview
```

This runs a local Node/Nitro server. Version 1 is designed for one computer and ordinary local files.

## Configuration

Optional environment variables:

```bash
THOUGHT_VAULT_ROOT=
THOUGHT_VAULT_MAX_ATTACHMENT_BYTES=104857600
```

If `THOUGHT_VAULT_ROOT` is not set, choose a vault folder in Settings. The selected path is stored in a small local app settings file. The vault itself stores rebuildable app state in `.thought-vault/app-state.json`.

## Choose a vault folder

Open Settings and enter a folder path such as:

```text
C:\Users\USERNAME\Documents\ThoughtVault
```

Then click `Create New Vault` or `Initialise / Repair Vault Structure`.

## OneDrive folders

You may choose a OneDrive-synchronised folder. Thought Vault does not call OneDrive APIs. It writes normal local files and lets OneDrive sync externally.

## Where captures are stored

Raw captures are immutable Markdown files under:

```text
00-inbox/ready/YYYY-MM-DD/YYYY-MM-DD_HHmmss__short-slug__cap_xxxxxxxxxx.md
```

Attachments are copied under:

```text
00-inbox/attachments/cap_xxxxxxxxxx/
```

Markdown front matter stores capture metadata and relative attachment paths only.

## Open the vault in Codex

Open the vault folder, not necessarily this app repository, as a Codex project. Codex will read `AGENTS.md`, which describes the co-thinking protocol and raw capture immutability rules.

## Rebuild the local index

Open Settings and click `Initialise / Repair Vault Structure`, or call:

```bash
curl http://localhost:3000/api/vault/status
```

The index is rebuildable from Markdown files in `00-inbox/ready/`.

## Security and privacy notes

- Capture content is written to local Markdown files only after you send it.
- Draft text is stored in browser IndexedDB before sending.
- Attachment binary data is not restored after browser restart.
- The browser never receives arbitrary filesystem access.
- Server routes resolve captures by ID and relative vault paths.
- Raw captures cannot be edited or deleted through the app in version 1.

## Version 1 limitations

- The folder chooser is a path field, not a native directory picker.
- Attachment uploads are handled by the local Nitro server request pipeline.
- Reveal-in-file-browser depends on the local operating system.
- Search is simple indexed text search over title, preview, ID, and path.
- The read-only viewer displays Markdown text rather than a full rendered Markdown preview.

## Version 2 roadmap

- direct Codex-assisted processing panel;
- review and approval UI for Codex proposals;
- structured note creation workflow;
- knowledge graph visualisation;
- semantic search;
- PDF extraction;
- source/page evidence mapping;
- optional local Git integration;
- optional cloud sync;
- optional multi-device capture.
