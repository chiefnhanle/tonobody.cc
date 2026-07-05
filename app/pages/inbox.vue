<script setup lang="ts">
import type { CaptureDetail, CaptureSummary } from '../../shared/types/capture'

const search = ref('')
const selectedId = ref('')
const copied = ref('')
const { data, refresh } = await useFetch<{ captures: CaptureSummary[] }>('/api/captures', { query: { search }, watch: [search], default: () => ({ captures: [] }) })
const selected = ref<CaptureDetail | null>(null)
const loadingDetail = ref(false)

async function openCapture(id: string) {
  selectedId.value = id
  loadingDetail.value = true
  try {
    const response = await $fetch<{ capture: CaptureDetail }>(`/api/captures/${id}`)
    selected.value = response.capture
  } finally {
    loadingDetail.value = false
  }
}

async function copyText(text: string, label: string) {
  await navigator.clipboard.writeText(text)
  copied.value = label
  setTimeout(() => copied.value = '', 1800)
}

function codexPrompt(capture: CaptureDetail | CaptureSummary) {
  return `Process this raw capture as a co-thinking exercise.

Read:
${capture.relativePath}

Do not merely summarise it.

1. Identify the core ideas I may be reaching toward.
2. Separate claims, assumptions, questions, evidence, ambiguities,
   possible novelty, and speculative fragments.
3. Search the existing vault for related notes.
4. Identify duplicates, contradictions, and missing definitions.
5. Propose a structured set of Markdown files and relationships.
6. Write the proposal only to 90-proposals/pending/.
7. Do not edit, move, rename, delete, merge, summarise, or overwrite
   the raw capture.
8. Cite exact file paths and headings for every meaningful conclusion.
9. Wait for my approval before creating canonical notes.`
}

function downloadUrl(path: string) {
  return path
}

onMounted(() => void refresh())
</script>

<template>
  <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
    <div class="space-y-4">
      <div class="flex flex-col gap-3 border-b border-stone-200 pb-5 dark:border-neutral-800 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-3xl font-semibold">Inbox</h1>
          <p class="mt-2 text-stone-700 dark:text-stone-300">Raw captures in <code>00-inbox/ready/</code>, newest first.</p>
        </div>
        <input v-model="search" class="rounded border border-stone-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950" placeholder="Search title, preview, path">
      </div>

      <div v-if="!data?.captures.length" class="rounded border border-stone-300 p-6 text-stone-700 dark:border-neutral-800 dark:text-stone-300">No ready captures found.</div>

      <ul class="space-y-3">
        <li v-for="capture in data?.captures" :key="capture.id" class="rounded border border-stone-300 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <button type="button" class="block w-full text-left focus:outline-none focus:ring-2 focus:ring-teal-600" @click="openCapture(capture.id)">
            <span class="block text-lg font-semibold">{{ capture.title }}</span>
            <span class="mt-1 block text-sm text-stone-600 dark:text-stone-400">{{ new Date(capture.created).toLocaleString() }} - {{ capture.id }} - {{ capture.attachmentCount }} attachment{{ capture.attachmentCount === 1 ? '' : 's' }}</span>
            <span class="mt-2 block text-sm text-stone-700 dark:text-stone-300">{{ capture.preview }}</span>
            <code class="mt-2 block truncate text-xs text-stone-600 dark:text-stone-400">{{ capture.relativePath }}</code>
          </button>
          <div class="mt-3 flex flex-wrap gap-2 text-sm">
            <button class="rounded border border-stone-300 px-3 py-2 hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800" @click="copyText(capture.relativePath, 'Path copied')">Copy path</button>
            <a class="rounded border border-stone-300 px-3 py-2 hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800" :href="downloadUrl(`/api/captures/${capture.id}/download`)">Download Markdown</a>
            <button class="rounded border border-stone-300 px-3 py-2 hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800" @click="copyText(codexPrompt(capture), 'Prompt copied')">Copy Codex Processing Prompt</button>
          </div>
        </li>
      </ul>
    </div>

    <aside class="min-h-[520px] rounded border border-stone-300 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
      <p v-if="copied" class="mb-3 rounded bg-teal-50 p-2 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100">{{ copied }}</p>
      <div v-if="loadingDetail" class="text-stone-600 dark:text-stone-400">Loading capture...</div>
      <div v-else-if="selected" class="space-y-4">
        <div>
          <h2 class="text-2xl font-semibold">{{ selected.title }}</h2>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">{{ selected.created }}</p>
          <code class="mt-2 block break-all text-xs text-stone-600 dark:text-stone-400">{{ selected.relativePath }}</code>
        </div>
        <div class="flex flex-wrap gap-2 text-sm">
          <button class="rounded border border-stone-300 px-3 py-2 hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800" @click="copyText(selected.absolutePath || selected.relativePath, 'Full path copied')">Copy file path</button>
          <a class="rounded border border-stone-300 px-3 py-2 hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800" :href="`/api/captures/${selected.id}/download`">Download Markdown</a>
          <button class="rounded border border-stone-300 px-3 py-2 hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800" @click="copyText(codexPrompt(selected), 'Prompt copied')">Copy Codex Processing Prompt</button>
        </div>
        <pre class="max-h-[420px] overflow-auto whitespace-pre-wrap rounded bg-stone-100 p-4 font-mono text-sm leading-6 dark:bg-neutral-900">{{ selected.body }}</pre>
        <div v-if="selected.attachments.length" class="space-y-2">
          <h3 class="font-semibold">Attachments</h3>
          <a v-for="(attachment, index) in selected.attachments" :key="attachment.relativePath" class="block rounded border border-stone-300 px-3 py-2 text-sm hover:bg-stone-100 dark:border-neutral-700 dark:hover:bg-neutral-800" :href="`/api/captures/${selected.id}/attachments/${index}/download`">{{ attachment.filename }} - {{ attachment.contentType }}</a>
        </div>
      </div>
      <div v-else class="text-stone-600 dark:text-stone-400">Select a capture to open a read-only viewer.</div>
    </aside>
  </section>
</template>
