import { VAULT_DIRECTORIES, APP_VERSION } from '../../shared/constants/vault'
import { LocalVaultRepository, writeConfiguredVaultRoot } from '../repositories/local-vault-repository'

export const AGENTS_MD = `# Thought Vault Co-Thinking Protocol

This repository is a personal research knowledge vault.

## Core principle

Raw captures are records of the user's original thinking.

Do not treat a raw capture as polished knowledge, validated fact, or final claim.

## Raw capture policy

Files under \`00-inbox/ready/\` are immutable source records.

Do not:

- delete them;
- rename them;
- move them;
- overwrite them;
- merge them;
- summarise over them;
- replace them with cleaner language;
- silently extract content and discard the original.

## Processing workflow

When asked to process a raw capture:

1. Read the selected raw capture.
2. Search the existing vault for related concepts, projects, claims,
   methods, questions, and sources.
3. Distinguish clearly between:
   - user-authored ideas;
   - sourced evidence;
   - inferences;
   - assumptions;
   - ambiguities;
   - contradictions;
   - unresolved questions;
   - proposed next steps.
4. Create a proposed knowledge structure in \`90-proposals/pending/\`.
5. Include proposed filenames, links, and reasons.
6. Cite exact Markdown paths and headings.
7. Do not create canonical notes until the user explicitly approves.
8. After approval, create new Markdown files rather than altering raw
   captures.

## Canonical folders

- \`01-concepts/\`: stable concepts and definitions.
- \`02-projects/\`: active research programs and project context.
- \`03-sources/\`: papers, standards, references, quotations, and evidence.
- \`04-questions/\`: unresolved questions.
- \`05-claims/\`: candidate research claims and patent-related propositions.
- \`06-methods/\`: computational, engineering, and analytical methods.
- \`07-output/\`: papers, reports, patent drafts, code plans, and other outputs.

## Writing rules

- Preserve ordinary Markdown readability.
- Use relative links where appropriate.
- Cite source paths and headings.
- Prefer proposed new notes over rewriting existing notes.
- Explain uncertainty.
- Do not present inferences as sourced facts.
- Before any multi-file write, show a concise change plan.
`

export const CONTEXT_MD = `# Current Research Context

## Active themes

- Query-based structural engineering design
- Constraint satisfaction and candidate-domain construction
- Engineering knowledge representation
- Patent and research-paper development
- Computational methods for structural design standards

## Working preference

Use this vault as a co-thinking environment.

Help connect ideas, identify assumptions, distinguish claims from evidence,
develop rigorous research outputs, and preserve original thought records.

## Current objective

Build a durable, searchable knowledge base of ideas, sources, questions,
methods, claims, and project materials.
`

export const VAULT_README = `# Thought Vault

## Workflow

1. Capture raw thoughts in the local Thought Vault app.
2. The app saves immutable Markdown captures into \`00-inbox/ready/\`.
3. Open this vault folder as a local Codex project.
4. Ask Codex to analyse selected captures as a co-thinking exercise.
5. Require Codex to create proposals in \`90-proposals/pending/\`.
6. Approve before creating canonical notes.
7. Keep raw captures intact.

## Suggested Codex prompts

### Process recent captures

Read my recent captures in \`00-inbox/ready/\`.

Act as a research co-thinker, not merely a summariser.

Identify recurring ideas, actual claims, hidden assumptions,
contradictions, possible novelty, and unresolved technical questions.

Cite exact Markdown paths and headings.

Do not modify, move, rename, or summarise raw captures.

Create a proposal only in \`90-proposals/pending/\`.

### Build a proposed concept note

Read these captures and related notes.

Create a proposed canonical concept note.

First explain:
- what problem the note solves;
- which captures support it;
- which statements are still uncertain;
- what the proposed file path should be.

Only write the proposed note after I explicitly approve.

### Research consistency review

Search this vault for duplicated concepts, contradictory definitions,
unsupported claims, and open questions.

Return an auditable review with exact file paths and headings.

Do not edit files.
`

export async function initialiseVault(root: string) {
  const repo = new LocalVaultRepository(root)
  for (const dir of VAULT_DIRECTORIES) await repo.ensureDir(dir)
  const configPath = '.thought-vault/config.json'
  if (!(await repo.exists(configPath))) {
    await repo.writeFileExclusive(configPath, JSON.stringify({ appVersion: APP_VERSION, schemaVersion: 1, maxAttachmentBytes: 104857600 }, null, 2))
  }
  if (!(await repo.exists('.thought-vault/capture-log.jsonl'))) await repo.writeFileExclusive('.thought-vault/capture-log.jsonl', '')
  if (!(await repo.exists('.thought-vault/app-state.json'))) await repo.writeAppState(repo.emptyAppState())
  if (!(await repo.exists('AGENTS.md'))) await repo.writeFileExclusive('AGENTS.md', AGENTS_MD)
  if (!(await repo.exists('CONTEXT.md'))) await repo.writeFileExclusive('CONTEXT.md', CONTEXT_MD)
  if (!(await repo.exists('README.md'))) await repo.writeFileExclusive('README.md', VAULT_README)
  await writeConfiguredVaultRoot(root)
  return { root }
}
