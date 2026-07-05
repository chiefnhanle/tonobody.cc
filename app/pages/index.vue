<script setup lang="ts">
import type { SettingsResponse } from '../../shared/types/capture'

const title = ref('')
const html = ref('<p></p>')
const files = ref<File[]>([])
const status = ref('Draft not saved yet')
const error = ref('')
const success = ref('')
const sending = ref(false)
const attachmentNotice = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const { getDraft, saveDraft, clearDraft } = useDraftStore()
const { data: settings, refresh: refreshSettings } = await useFetch<SettingsResponse>('/api/settings')

onMounted(async () => {
  const draft = await getDraft()
  if (draft) {
    title.value = draft.title
    html.value = draft.html
    status.value = `Draft restored from this browser, saved ${new Date(draft.savedAt).toLocaleString()}`
    attachmentNotice.value = 'Attachments are not restored after a browser restart. Attach them again before sending.'
  }
  window.addEventListener('keydown', onShortcut)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onShortcut))

let saveTimer: ReturnType<typeof setTimeout> | null = null
watch([title, html], () => {
  if (saveTimer) clearTimeout(saveTimer)
  status.value = 'Saving draft locally in this browser...'
  saveTimer = setTimeout(async () => {
    await saveDraft({ title: title.value, html: html.value })
    status.value = `Draft saved locally at ${new Date().toLocaleTimeString()}`
  }, 350)
})

function onShortcut(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    void submitCapture()
  }
}

function addFiles(selected: FileList | null) {
  if (!selected) return
  files.value = [...files.value, ...Array.from(selected)]
  attachmentNotice.value = ''
}

function removeFile(index: number) {
  files.value.splice(index, 1)
}

function humanSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

async function submitCapture() {
  error.value = ''
  success.value = ''
  if (!settings.value?.hasVault) {
    error.value = 'Choose and initialise a vault in Settings before sending captures.'
    return
  }
  sending.value = true
  try {
    const form = new FormData()
    form.append('title', title.value)
    form.append('html', html.value)
    form.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)
    for (const file of files.value) form.append('attachment', file, file.name)
    const response = await $fetch<{ capture: { id: string, relativePath: string } }>('/api/captures', { method: 'POST', body: form })
    await clearDraft()
    title.value = ''
    html.value = '<p></p>'
    files.value = []
    status.value = 'Draft cleared after confirmed vault save.'
    success.value = `Saved raw capture ${response.capture.id} to ${response.capture.relativePath}`
    await refreshSettings()
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'The capture could not be saved.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col gap-3 border-b border-stone-200 pb-5 dark:border-neutral-800 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-3xl font-semibold">Capture</h1>
        <p class="mt-2 max-w-2xl text-stone-700 dark:text-stone-300">Raw thoughts are preserved first. Codex processes them later when you choose.</p>
      </div>
      <div class="rounded border border-stone-300 px-3 py-2 text-sm text-stone-700 dark:border-neutral-700 dark:text-stone-300">
        <span class="font-medium">Vault:</span>
        <span v-if="settings?.selectedVaultRoot">{{ settings.selectedVaultRoot }}</span>
        <NuxtLink v-else to="/settings" class="text-teal-700 underline dark:text-teal-300">Choose a vault</NuxtLink>
      </div>
    </div>

    <label class="block">
      <span class="mb-2 block text-sm font-medium">Optional title</span>
      <input v-model="title" class="w-full rounded border border-stone-300 bg-white px-3 py-3 text-lg outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950" placeholder="A short name, if it already has one">
    </label>

    <TiptapEditor v-model="html" />

    <div class="rounded border border-dashed border-stone-400 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-950" @dragover.prevent @drop.prevent="addFiles($event.dataTransfer?.files || null)">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="font-medium">Attachments</p>
          <p class="text-sm text-stone-600 dark:text-stone-400">PDF, images, Office files, Markdown, text, CSV, and JSON. Default limit: 100 MB per file.</p>
        </div>
        <button type="button" class="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-stone-100 dark:text-stone-950" @click="fileInput?.click()">Choose files</button>
        <input ref="fileInput" class="hidden" type="file" multiple @change="addFiles(($event.target as HTMLInputElement).files)">
      </div>
      <p v-if="attachmentNotice" class="mt-3 text-sm text-amber-700 dark:text-amber-300">{{ attachmentNotice }}</p>
      <ul v-if="files.length" class="mt-4 divide-y divide-stone-200 dark:divide-neutral-800">
        <li v-for="(file, index) in files" :key="`${file.name}-${index}`" class="flex items-center justify-between gap-3 py-3 text-sm">
          <span class="min-w-0 truncate"><span class="font-medium">{{ file.name }}</span> - {{ file.type || 'unknown type' }} - {{ humanSize(file.size) }}</span>
          <button type="button" class="rounded px-2 py-1 text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600 dark:text-red-300 dark:hover:bg-red-950" @click="removeFile(index)">Remove</button>
        </li>
      </ul>
    </div>

    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p class="text-sm text-stone-600 dark:text-stone-400">{{ status }}</p>
      <button type="button" class="rounded bg-teal-700 px-6 py-3 text-base font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-neutral-950" :disabled="sending" @click="submitCapture">Send to Codex Inbox</button>
    </div>

    <p v-if="success" class="rounded border border-teal-300 bg-teal-50 p-3 text-sm text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100">{{ success }}</p>
    <p v-if="error" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">{{ error }}</p>
  </section>
</template>
