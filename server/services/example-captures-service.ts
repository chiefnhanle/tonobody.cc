import type { LocalVaultRepository } from '../repositories/local-vault-repository'
import { createCapture, listCaptures } from './capture-service'

const exampleCaptures = [
  {
    title: 'Thought Vault Preliminary Documentation: Overview',
    html: `<h1>Thought Vault Preliminary Documentation: Overview</h1>
<p>Thought Vault is a local-first capture space for quickly writing messy thoughts and later letting an LLM organise them into structured knowledge.</p>
<h2>Core Ideas</h2>
<ul>
<li>Raw capture</li>
<li>Capture loop</li>
<li>Inbox review</li>
<li>Knowledge graph</li>
<li>Vault protocol</li>
<li>Slash command interface</li>
</ul>
<h2>Claim</h2>
<p>Claim: Thought Vault should preserve the original raw capture while making structured review feel lightweight.</p>
<h2>Open Questions</h2>
<ul>
<li>How should the knowledge graph distinguish a claim from a concept?</li>
<li>When should an inbox review become a canonical note?</li>
</ul>`
  },
  {
    title: 'How to Use Thought Vault: Capture Loop',
    html: `<h1>How to Use Thought Vault: Capture Loop</h1>
<p>The capture loop starts with plain typing. The user can spam thoughts without deciding the final structure first.</p>
<h2>Workflow</h2>
<ul>
<li>Raw capture</li>
<li>Slash command interface</li>
<li>Inbox review</li>
<li>Draft editing</li>
<li>Knowledge graph</li>
</ul>
<h2>Method</h2>
<p>Method: write first, send with slash command, reopen as draft when the original capture needs refinement.</p>
<h2>Question</h2>
<p>How can the capture loop stay invisible while still exposing enough power?</p>`
  },
  {
    title: 'Thought Vault Slash Commands: Working Interface',
    html: `<h1>Thought Vault Slash Commands: Working Interface</h1>
<p>The interface is intentionally sparse. Commands appear near the text cursor and replace visible buttons.</p>
<h2>Slash Command Interface</h2>
<ul>
<li>/send saves the raw capture</li>
<li>/help opens command documentation</li>
<li>/inbox opens inbox review</li>
<li>/vault opens vault browser</li>
<li>/graph opens knowledge graph</li>
<li>/math inserts rendered math</li>
</ul>
<h2>Related Concepts</h2>
<ul>
<li>Capture loop</li>
<li>Matte glass popup</li>
<li>Draft editing</li>
</ul>`
  },
  {
    title: 'Thought Vault Inbox Review: From Raw Notes to Structure',
    html: `<h1>Thought Vault Inbox Review: From Raw Notes to Structure</h1>
<p>Inbox review is where recent captures can be reopened, inspected, and turned into cleaner draft structure without losing the original context.</p>
<h2>Inbox Review</h2>
<ul>
<li>Raw capture</li>
<li>Draft editing</li>
<li>Attachment preview</li>
<li>Vault protocol</li>
<li>Canonical note proposal</li>
</ul>
<h2>Claim</h2>
<p>Claim: editing an opened draft should update the original capture intentionally, not create hidden duplicate knowledge.</p>
<h2>Question</h2>
<p>Which inbox review actions should remain reversible?</p>`
  },
  {
    title: 'Thought Vault Knowledge Graph: Maps and Links',
    html: `<h1>Thought Vault Knowledge Graph: Maps and Links</h1>
<p>The knowledge graph gives a visual route into the vault by connecting captures to repeated headings, concepts, claims, methods, sources, and questions.</p>
<h2>Knowledge Graph</h2>
<ul>
<li>Raw capture</li>
<li>Preliminary documentation</li>
<li>Capture loop</li>
<li>Inbox review</li>
<li>Vault protocol</li>
<li>Claim node</li>
<li>Question node</li>
</ul>
<h2>Method</h2>
<p>Method: extract graph terms from titles, headings, repeated words, and structured list items.</p>
<h2>Open Questions</h2>
<ul>
<li>Should attachments become graph nodes?</li>
<li>Should manual links outweigh repeated concepts?</li>
</ul>`
  },
  {
    title: 'Thought Vault Vault Protocol: LLM Collaboration',
    html: `<h1>Thought Vault Vault Protocol: LLM Collaboration</h1>
<p>The vault protocol tells the LLM to preserve raw captures and propose structure before changing canonical notes.</p>
<h2>Vault Protocol</h2>
<ul>
<li>Raw capture</li>
<li>Inbox review</li>
<li>Canonical note proposal</li>
<li>Source note</li>
<li>Claim node</li>
<li>Question node</li>
</ul>
<h2>Source</h2>
<p>Source: AGENTS.md and README.md define how Thought Vault expects Codex to handle local knowledge.</p>
<h2>Claim</h2>
<p>Claim: a vault protocol protects the user's original thinking from over-eager summarisation.</p>`
  },
  {
    title: 'Example Map: Constraint Design Loop',
    html: `<h1>Example Map: Constraint Design Loop</h1>
<p>A rough map of how a structural design query becomes a candidate domain.</p>
<h2>Nodes</h2>
<ul>
<li>Design intent</li>
<li>Geometry constraints</li>
<li>Material assumptions</li>
<li>Load cases</li>
<li>Candidate member families</li>
<li>Verification rules</li>
</ul>
<h2>Edges</h2>
<ul>
<li>Design intent narrows geometry constraints.</li>
<li>Load cases constrain candidate member families.</li>
<li>Verification rules reject infeasible candidates.</li>
</ul>`
  },
  {
    title: 'Example Map: Evidence to Claim',
    html: `<h1>Example Map: Evidence to Claim</h1>
<p>A knowledge map for separating raw evidence from claims.</p>
<h2>Claims</h2>
<ul>
<li>Query-first structural design can reduce premature modelling choices.</li>
<li>Candidate-domain construction may be a reusable method, not just an implementation detail.</li>
</ul>
<h2>Evidence</h2>
<ul>
<li>Source notes should support each claim directly.</li>
<li>Unsupported assumptions should remain visible as questions.</li>
</ul>
<h2>Open Questions</h2>
<ul>
<li>What counts as novelty?</li>
<li>Which constraints are domain-specific versus general?</li>
</ul>`
  },
  {
    title: 'Example Map: Obsidian Graph Semantics',
    html: `<h1>Example Map: Obsidian Graph Semantics</h1>
<p>A sketch of graph entities for Thought Vault.</p>
<h2>Node Types</h2>
<ul>
<li>Raw capture</li>
<li>Concept</li>
<li>Claim</li>
<li>Question</li>
<li>Source</li>
<li>Method</li>
</ul>
<h2>Relationship Types</h2>
<ul>
<li>mentions</li>
<li>supports</li>
<li>contradicts</li>
<li>depends on</li>
<li>refines</li>
</ul>`
  },
  {
    title: 'Example Knowledge: Candidate Domain',
    html: `<h1>Example Knowledge: Candidate Domain</h1>
<p>A candidate domain is the constrained design space produced before final selection.</p>
<h2>Definition</h2>
<p>The domain contains possible solutions that satisfy explicit constraints and remain available for later ranking or verification.</p>
<h2>Related Ideas</h2>
<ul>
<li>Constraint satisfaction</li>
<li>Parametric search</li>
<li>Structural design standards</li>
<li>Design intent capture</li>
</ul>`
  }
]

export async function seedExampleCaptures(repo: LocalVaultRepository, maxAttachmentBytes: number) {
  const existing = new Set((await listCaptures(repo)).map(capture => capture.title))
  const created = []
  const skipped = []

  for (const example of exampleCaptures) {
    if (existing.has(example.title)) {
      skipped.push(example.title)
      continue
    }
    created.push(await createCapture(repo, { ...example, attachments: [], maxAttachmentBytes }))
  }

  return { created, skipped }
}
