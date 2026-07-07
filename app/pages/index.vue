<script setup lang="ts">
import type { CaptureDetail, CaptureSummary, SettingsResponse } from '../../shared/types/capture'

type ModalName = 'help' | 'inbox' | 'settings' | 'math' | 'vault' | 'graph' | null
interface QueuedAttachment {
  id: string
  file: File
  previewUrl: string
}
interface VaultTreeItem {
  name: string
  relativePath: string
  type: 'directory' | 'file'
  children?: VaultTreeItem[]
}
interface AttachmentEditor {
  insertAttachmentBlock: (attachment: { id: string, name: string, type: string, size: string, previewUrl: string }) => void
  insertMath: (mode: 'inline' | 'block', latex: string) => void
}
interface GraphNode {
  id: string
  label: string
  type: 'capture' | 'concept' | 'claim' | 'question' | 'source' | 'method'
  preview?: string
  relativePath?: string
}
interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  weight: number
}

const title = ref('')
const html = ref('<p></p>')
const files = ref<QueuedAttachment[]>([])
const status = ref('')
const error = ref('')
const success = ref('')
const sending = ref(false)
const editingCaptureId = ref('')
const modal = ref<ModalName>(null)
const selected = ref<CaptureDetail | null>(null)
const imagePreview = ref<{ src: string, title: string } | null>(null)
const mathMode = ref<'inline' | 'block'>('inline')
const mathInput = ref('')
const loadingDetail = ref(false)
const vaultRoot = ref('')
const vaultTree = ref<VaultTreeItem[]>([])
const loadingVault = ref(false)
const graphNodes = ref<GraphNode[]>([])
const graphEdges = ref<GraphEdge[]>([])
const loadingGraph = ref(false)
const vaultPath = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const editorRef = ref<AttachmentEditor | null>(null)
const suppressAttachmentSync = ref(false)
const { getDraft, saveDraft, clearDraft } = useDraftStore()
const { data: settings, refresh: refreshSettings } = await useFetch<SettingsResponse>('/api/settings')
const { data: inbox, refresh: refreshInbox } = await useFetch<{ captures: CaptureSummary[] }>('/api/captures', { default: () => ({ captures: [] }) })

const visibleStatus = computed(() => error.value || success.value || status.value)
const helpCommands = [
  ['/send', 'save this capture'],
  ['/title', 'turn the current line into the title'],
  ['/section', 'start a section heading'],
  ['/bold', 'toggle bold text'],
  ['/italic', 'toggle italic text'],
  ['/list', 'start a bullet list'],
  ['/numbered', 'start a numbered list'],
  ['/quote', 'capture a quote or aside'],
  ['/code', 'start a code block'],
  ['/math', 'insert inline LaTeX'],
  ['/equation', 'insert a display equation'],
  ['/link', 'add a link to selected text'],
  ['/attach', 'attach files into the page'],
  ['/inbox', 'open recent captures'],
  ['/vault', 'browse and open vault files'],
  ['/graph', 'open the knowledge graph'],
  ['/examples', 'seed a few example inbox maps'],
  ['inbox -> reopen', 'load a sent capture back into the page as a new draft'],
  ['/settings', 'set or repair the vault'],
  ['/help', 'show this panel']
]

watchEffect(() => {
  vaultPath.value = settings.value?.selectedVaultRoot || vaultPath.value
})

onMounted(async () => {
  const draft = await getDraft()
  if (draft) {
    html.value = draft.html
    setStatus(`draft restored from ${new Date(draft.savedAt).toLocaleTimeString()}`)
  }
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => {
  clearQueuedAttachments()
})

let saveTimer: ReturnType<typeof setTimeout> | null = null
watch(html, () => {
  syncQueuedAttachmentsToEditor()
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    await saveDraft({ title: '', html: html.value })
    if (!success.value && !error.value) status.value = 'draft saved'
  }, 350)
})

function onGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    imagePreview.value = null
    modal.value = null
    mathInput.value = ''
    selected.value = null
  }
}

function setStatus(message: string) {
  status.value = message
  error.value = ''
  success.value = ''
}

async function addFiles(selectedFiles: FileList | null) {
  if (!selectedFiles) return
  const queued = Array.from(selectedFiles).map(file => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    previewUrl: URL.createObjectURL(file)
  }))
  files.value = [...files.value, ...queued]
  suppressAttachmentSync.value = true
  for (const item of queued) insertAttachmentBlock(item)
  await nextTick()
  suppressAttachmentSync.value = false
  syncQueuedAttachmentsToEditor()
  setStatus(`${files.value.length} attachment${files.value.length === 1 ? '' : 's'} queued`)
  if (fileInput.value) fileInput.value.value = ''
}

function clearQueuedAttachments() {
  for (const item of files.value) URL.revokeObjectURL(item.previewUrl)
  files.value = []
}

function syncQueuedAttachmentsToEditor() {
  if (suppressAttachmentSync.value) return
  if (!files.value.length) return
  const ids = new Set([...html.value.matchAll(/data-attachment-id="([^"]+)"/g)].map(match => match[1]))
  const removed = files.value.filter(item => !ids.has(item.id))
  for (const item of removed) URL.revokeObjectURL(item.previewUrl)
  files.value = files.value.filter(item => ids.has(item.id))
}

function requestAttachments() {
  fileInput.value?.click()
}

function insertAttachmentBlock(item: QueuedAttachment) {
  editorRef.value?.insertAttachmentBlock({
    id: item.id,
    name: item.file.name,
    type: item.file.type || 'application/octet-stream',
    size: humanSize(item.file.size),
    previewUrl: item.previewUrl
  })
}

function requestMath(mode: 'inline' | 'block') {
  mathMode.value = mode
  mathInput.value = ''
  modal.value = 'math'
}

function insertMath() {
  editorRef.value?.insertMath(mathMode.value, mathInput.value)
  mathInput.value = ''
  modal.value = null
}

function humanSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function isImageType(type: string) {
  return type.startsWith('image/')
}

function attachmentUrl(captureId: string, index: number) {
  return `/api/captures/${captureId}/attachments/${index}/download`
}

function hasDraftContent() {
  const text = html.value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return Boolean(text || files.value.length)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineMarkdownToHtml(value: string) {
  return escapeHtml(value)
    .replace(/\$([^$\n]+)\$/g, (_match, latex: string) => `<span data-thought-vault-math-inline="true" data-latex="${latex}" class="tv-math-inline" contenteditable="false">${latex}</span>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}

function markdownToEditorHtml(markdown: string) {
  const htmlBlocks: string[] = []
  let listItems: string[] = []
  let orderedItems: string[] = []
  let mathLines: string[] = []
  let inMathBlock = false

  function flushLists() {
    if (listItems.length) {
      htmlBlocks.push(`<ul>${listItems.map(item => `<li>${inlineMarkdownToHtml(item)}</li>`).join('')}</ul>`)
      listItems = []
    }
    if (orderedItems.length) {
      htmlBlocks.push(`<ol>${orderedItems.map(item => `<li>${inlineMarkdownToHtml(item)}</li>`).join('')}</ol>`)
      orderedItems = []
    }
  }

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '$$') {
      if (inMathBlock) {
        htmlBlocks.push(`<figure data-thought-vault-math-block="true" data-latex="${escapeHtml(mathLines.join('\n'))}" class="tv-math-block" contenteditable="false"><code class="tv-math-block-code">${escapeHtml(mathLines.join('\n'))}</code></figure>`)
        mathLines = []
        inMathBlock = false
      } else {
        flushLists()
        inMathBlock = true
      }
      continue
    }
    if (inMathBlock) {
      mathLines.push(line)
      continue
    }
    if (!trimmed) {
      flushLists()
      continue
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    const bullet = trimmed.match(/^[-*]\s+(.+)$/)
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/)
    if (heading?.[1] && heading[2]) {
      flushLists()
      const level = heading[1].length
      htmlBlocks.push(`<h${level}>${inlineMarkdownToHtml(heading[2])}</h${level}>`)
    } else if (bullet?.[1]) {
      listItems.push(bullet[1])
    } else if (ordered?.[1]) {
      orderedItems.push(ordered[1])
    } else if (trimmed.startsWith('> ')) {
      flushLists()
      htmlBlocks.push(`<blockquote>${inlineMarkdownToHtml(trimmed.slice(2))}</blockquote>`)
    } else {
      flushLists()
      htmlBlocks.push(`<p>${inlineMarkdownToHtml(trimmed)}</p>`)
    }
  }

  flushLists()
  if (inMathBlock && mathLines.length) {
    htmlBlocks.push(`<figure data-thought-vault-math-block="true" data-latex="${escapeHtml(mathLines.join('\n'))}" class="tv-math-block" contenteditable="false"><code class="tv-math-block-code">${escapeHtml(mathLines.join('\n'))}</code></figure>`)
  }
  return htmlBlocks.join('') || '<p></p>'
}

async function submitCapture() {
  error.value = ''
  success.value = ''
  if (!settings.value?.hasVault) {
    modal.value = 'settings'
    error.value = 'choose a vault first'
    return false
  }
  if (!hasDraftContent()) {
    error.value = 'nothing to send'
    return false
  }
  sending.value = true
  status.value = editingCaptureId.value ? 'updating' : 'sending'
  try {
    const form = new FormData()
    form.append('title', title.value)
    form.append('html', html.value)
    form.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)
    for (const item of files.value) form.append('attachment', item.file, item.file.name)
    const targetId = editingCaptureId.value
    const response = await $fetch<{ capture: { id: string, relativePath: string } }>(targetId ? `/api/captures/${targetId}` : '/api/captures', { method: targetId ? 'PUT' : 'POST', body: form })
    await clearDraft()
    title.value = ''
    html.value = '<p></p>'
    editingCaptureId.value = ''
    clearQueuedAttachments()
    status.value = ''
    success.value = `${targetId ? 'updated' : 'saved'} ${response.capture.id}`
    await refreshSettings()
    await refreshInbox()
    return true
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'the capture could not be saved'
    status.value = ''
    return false
  } finally {
    sending.value = false
  }
}

async function openInbox() {
  modal.value = 'inbox'
  selected.value = null
  await refreshInbox()
}

async function openVault() {
  modal.value = 'vault'
  loadingVault.value = true
  try {
    const response = await $fetch<{ root: string, tree: VaultTreeItem[] }>('/api/vault/tree')
    vaultRoot.value = response.root
    vaultTree.value = response.tree
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'could not open vault'
  } finally {
    loadingVault.value = false
  }
}

async function openGraph() {
  modal.value = 'graph'
  loadingGraph.value = true
  try {
    const response = await $fetch<{ nodes: GraphNode[], edges: GraphEdge[] }>('/api/graph')
    graphNodes.value = response.nodes
    graphEdges.value = response.edges
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'could not open graph'
  } finally {
    loadingGraph.value = false
  }
}

async function revealVault(relativePath = '') {
  try {
    await $fetch('/api/reveal', { method: 'POST', body: relativePath ? { relativePath } : {} })
    setStatus(relativePath ? `opened ${relativePath}` : 'opened vault')
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'could not reveal vault item'
  }
}

async function seedExamples() {
  try {
    const response = await $fetch<{ created: Array<{ id: string }>, skipped: string[] }>('/api/examples/seed', { method: 'POST' })
    await refreshInbox()
    setStatus(`seeded ${response.created.length}; skipped ${response.skipped.length}`)
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'could not seed examples'
  }
}

async function openCapture(id: string) {
  loadingDetail.value = true
  try {
    const response = await $fetch<{ capture: CaptureDetail }>(`/api/captures/${id}`)
    selected.value = response.capture
  } finally {
    loadingDetail.value = false
  }
}

async function openGraphCapture(id: string) {
  modal.value = 'inbox'
  await openCapture(id)
}

async function reopenSelectedAsDraft() {
  if (!selected.value) return
  const capture = selected.value
  if (hasDraftContent()) {
    const sent = await submitCapture()
    if (!sent) return
  }
  clearQueuedAttachments()
  html.value = markdownToEditorHtml(capture.body)
  await nextTick()
  const restoredAttachments: QueuedAttachment[] = []
  for (const [index, attachment] of capture.attachments.entries()) {
    const response = await fetch(attachmentUrl(capture.id, index))
    const blob = await response.blob()
    const file = new File([blob], attachment.filename, { type: attachment.contentType })
    restoredAttachments.push({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file)
    })
  }
  files.value = restoredAttachments
  suppressAttachmentSync.value = true
  for (const item of restoredAttachments) insertAttachmentBlock(item)
  await nextTick()
  suppressAttachmentSync.value = false
  syncQueuedAttachmentsToEditor()
  editingCaptureId.value = capture.id
  modal.value = null
  selected.value = null
  setStatus(`editing ${capture.id}`)
}

async function saveAndRepairVault() {
  const path = vaultPath.value.trim()
  if (!path) {
    error.value = 'enter a vault path'
    return
  }
  error.value = ''
  status.value = 'preparing vault'
  try {
    await $fetch('/api/settings/vault', { method: 'POST', body: { path } })
    await $fetch('/api/vault/initialise', { method: 'POST', body: { path } })
    await refreshSettings()
    status.value = 'vault ready'
    modal.value = null
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'could not prepare vault'
    status.value = ''
  }
}
</script>

<template>
  <section
    class="min-h-screen px-6 py-10 sm:px-10 lg:px-16"
    @dragover.prevent
    @drop.prevent="addFiles($event.dataTransfer?.files || null)"
  >
    <div class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
      <TiptapEditor
        ref="editorRef"
        v-model="html"
        class="w-full"
        @attach-request="requestAttachments"
        @submit-request="submitCapture"
        @help-request="modal = 'help'"
        @inbox-request="openInbox"
        @settings-request="modal = 'settings'"
        @vault-request="openVault"
        @graph-request="openGraph"
        @examples-request="seedExamples"
        @math-request="requestMath"
      />
    </div>

    <input ref="fileInput" class="hidden" type="file" multiple @change="addFiles(($event.target as HTMLInputElement).files)">

    <div v-if="visibleStatus" class="matte-glass fixed bottom-6 left-1/2 z-20 w-[min(42rem,calc(100%-3rem))] -translate-x-1/2 rounded-full px-4 py-2 text-center text-xs text-stone-500">
      <p v-if="error" class="text-red-300">{{ error }}</p>
      <p v-else-if="success" class="text-teal-300">{{ success }}</p>
      <p v-else>{{ status }}</p>
    </div>

    <div
      v-if="modal"
      class="matte-overlay fixed inset-0 z-30 grid place-items-center px-5"
      @mousedown.self="modal = null"
    >
      <aside class="matte-glass max-h-[86vh] w-[min(72rem,100%)] overflow-auto rounded-2xl p-6 shadow-2xl shadow-black/50">
        <div v-if="modal === 'help'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-stone-500">Commands</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">Slash is the interface.</h2>
          </div>
          <dl class="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
            <template v-for="[command, description] in helpCommands" :key="command">
              <dt class="font-mono text-stone-200">{{ command }}</dt>
              <dd class="text-stone-400">{{ description }}</dd>
            </template>
          </dl>
        </div>

        <div v-else-if="modal === 'settings'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-stone-500">Settings</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">Vault path</h2>
          </div>
          <input
            v-model="vaultPath"
            class="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 font-mono text-sm text-stone-100 outline-none focus:border-teal-300"
            placeholder="/Users/you/Documents/ThoughtVault"
            @keydown.enter.prevent="saveAndRepairVault"
          >
          <p class="text-sm text-stone-500">Press Enter to save and initialise. Escape closes.</p>
        </div>

        <div v-else-if="modal === 'math'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-stone-500">{{ mathMode === 'inline' ? 'Inline math' : 'Display equation' }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">LaTeX</h2>
          </div>
          <textarea
            v-model="mathInput"
            class="min-h-28 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 font-mono text-sm text-stone-100 outline-none focus:border-teal-300"
            placeholder="E = mc^2"
            autofocus
            @keydown.meta.enter.prevent="insertMath"
            @keydown.ctrl.enter.prevent="insertMath"
          />
          <p class="text-sm text-stone-500">Press Cmd+Enter or Ctrl+Enter to insert. Escape closes.</p>
        </div>

        <div v-else-if="modal === 'vault'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-stone-500">Vault</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">Files</h2>
            <code class="mt-2 block break-all text-xs text-stone-500">{{ vaultRoot || settings?.selectedVaultRoot || 'No vault selected' }}</code>
          </div>
          <p v-if="loadingVault" class="text-sm text-stone-500">loading</p>
          <div v-else class="space-y-1">
            <p class="matte-glass cursor-default rounded-xl px-3 py-2 text-sm text-stone-300" @click="revealVault()">open vault folder</p>
            <template v-for="item in vaultTree" :key="item.relativePath">
              <VaultTreeRow :item="item" @reveal="revealVault" />
            </template>
          </div>
        </div>

        <div v-else-if="modal === 'graph'" class="space-y-5">
          <p v-if="loadingGraph" class="text-sm text-stone-500">loading graph</p>
          <KnowledgeGraph
            v-else
            :nodes="graphNodes"
            :edges="graphEdges"
            @open-capture="openGraphCapture"
          />
        </div>

        <div v-else-if="modal === 'inbox'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-stone-500">Inbox</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">Recent captures</h2>
          </div>
          <div v-if="selected" class="space-y-3">
            <p class="text-sm text-stone-500" @click="selected = null">back to captures</p>
            <h3 class="text-xl font-semibold text-white">{{ selected.title }}</h3>
            <code class="block break-all text-xs text-stone-500">{{ selected.relativePath }}</code>
            <p class="cursor-default text-sm text-teal-300" @click="reopenSelectedAsDraft">reopen as draft</p>
            <pre class="max-h-[44vh] overflow-auto whitespace-pre-wrap text-sm leading-6 text-stone-300">{{ selected.body }}</pre>
            <div v-if="selected.attachments.length" class="space-y-3">
              <article
                v-for="(attachment, index) in selected.attachments"
                :key="attachment.relativePath"
                class="matte-glass overflow-hidden rounded-xl"
                :class="isImageType(attachment.contentType) ? 'cursor-zoom-in' : ''"
                @click="isImageType(attachment.contentType) && (imagePreview = { src: attachmentUrl(selected.id, index), title: attachment.filename })"
              >
                <img
                  v-if="isImageType(attachment.contentType)"
                  :src="attachmentUrl(selected.id, index)"
                  :alt="attachment.filename"
                  class="max-h-56 w-full object-contain"
                >
                <div class="flex items-center justify-between gap-4 px-3 py-2 text-xs">
                  <div class="min-w-0">
                    <p class="truncate text-stone-300">{{ attachment.filename }}</p>
                    <p class="mt-1 text-stone-600">{{ attachment.contentType }} - {{ humanSize(attachment.sizeBytes) }}</p>
                  </div>
                  <p class="shrink-0 uppercase tracking-[0.18em] text-stone-700">
                    {{ isImageType(attachment.contentType) ? 'open' : 'file' }}
                  </p>
                </div>
              </article>
            </div>
          </div>
          <div v-else class="space-y-2">
            <p v-if="loadingDetail" class="text-sm text-stone-500">loading</p>
            <p v-else-if="!inbox?.captures.length" class="text-sm text-stone-500">nothing captured yet</p>
            <template v-else>
              <article
                v-for="capture in inbox?.captures"
                :key="capture.id"
                class="matte-glass cursor-default rounded-xl px-3 py-3 text-sm transition hover:text-white"
                @click="openCapture(capture.id)"
              >
                <h3 class="font-medium text-stone-100">{{ capture.title }}</h3>
                <p class="mt-1 line-clamp-2 text-stone-500">{{ capture.preview }}</p>
                <code class="mt-2 block truncate text-xs text-stone-600">{{ capture.relativePath }}</code>
              </article>
            </template>
          </div>
        </div>
      </aside>
    </div>

    <div
      v-if="imagePreview"
      class="matte-overlay fixed inset-0 z-40 grid place-items-center p-5"
      @mousedown.self="imagePreview = null"
    >
      <figure class="matte-glass max-h-full max-w-5xl rounded-2xl p-3 shadow-2xl shadow-black/60">
        <img :src="imagePreview.src" :alt="imagePreview.title" class="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl shadow-black">
        <figcaption class="mt-3 text-center text-xs text-stone-500">{{ imagePreview.title }}</figcaption>
      </figure>
    </div>
  </section>
</template>
