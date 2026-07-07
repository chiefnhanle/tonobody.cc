<script setup lang="ts">
import { DEFAULT_GHOST_LINES } from '~/utils/ghosts'
import {
  DEFAULT_TARGET, MIN_TARGET, MAX_TARGET,
  applyLineDelta, applyCharDelta, decay, barPercent
} from '~/utils/bar'

type ModalName = 'help' | 'bar' | 'ghost' | null
interface EditorHandle { focus: () => void }

const html = ref('<p></p>')
const modal = ref<ModalName>(null)
const status = ref('')
const editorRef = ref<EditorHandle | null>(null)

// Momentum bar state.
const fill = ref(0)
const target = ref(DEFAULT_TARGET)
const prevLines = ref(0)
const prevChars = ref(0)
const progress = computed(() => barPercent(fill.value, target.value))
const isFull = computed(() => progress.value >= 100)

// Ghost prompts (session only — nothing is persisted anywhere).
const ghostLines = ref<string[]>([...DEFAULT_GHOST_LINES])
const ghostIndex = ref(0)
const newGhost = ref('')

const helpCommands = [
  ['/send', 'release everything and reset the page'],
  ['/bar', 'adjust how big the goal bar is'],
  ['/ghost', 'add your own starting prompts'],
  ['/bold', 'toggle bold text'],
  ['/italic', 'toggle italic text'],
  ['/list', 'start a bullet list'],
  ['/quote', 'set something aside as a quote'],
  ['/help', 'show this panel']
]

let statusTimer: ReturnType<typeof setTimeout> | null = null
let rafId: number | null = null
let lastTs = 0

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  lastTs = performance.now()
  rafId = requestAnimationFrame(tick)
  editorRef.value?.focus()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  if (rafId !== null) cancelAnimationFrame(rafId)
  if (statusTimer) clearTimeout(statusTimer)
})

function tick(now: number) {
  const dt = (now - lastTs) / 1000
  lastTs = now
  fill.value = decay(fill.value, dt)
  rafId = requestAnimationFrame(tick)
}

function onLineCount(count: number) {
  fill.value = applyLineDelta(fill.value, count - prevLines.value)
  prevLines.value = count
}

function onCharCount(count: number) {
  fill.value = applyCharDelta(fill.value, count - prevChars.value)
  prevChars.value = count
}

function onGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    modal.value = null
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault()
    resetPage()
  }
}

function flashStatus(message: string) {
  status.value = message
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => { status.value = '' }, 2200)
}

// The "send" button of an anxiety scratchpad: rip everything, keep nothing.
function resetPage() {
  html.value = '<p></p>'
  fill.value = 0
  prevLines.value = 0
  prevChars.value = 0
  ghostIndex.value = (ghostIndex.value + 1) % Math.max(ghostLines.value.length, 1)
  modal.value = null
  flashStatus('let it go — the page is empty again')
  nextTick(() => editorRef.value?.focus())
}

function addGhost() {
  const line = newGhost.value.trim()
  if (!line) return
  ghostLines.value = [...ghostLines.value, line]
  newGhost.value = ''
}

function removeGhost(index: number) {
  ghostLines.value = ghostLines.value.filter((_, i) => i !== index)
  if (ghostIndex.value >= ghostLines.value.length) ghostIndex.value = 0
}
</script>

<template>
  <section class="min-h-screen px-6 py-10 sm:px-10 lg:px-16">
    <!-- Momentum bar: a draggable pill that fills as you type and drains slowly with time. Top it off. -->
    <MomentumBar :progress="progress" :is-full="isFull" />

    <div class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
      <TiptapEditor
        ref="editorRef"
        v-model="html"
        :ghost-lines="ghostLines"
        :ghost-index="ghostIndex"
        class="w-full"
        @line-count="onLineCount"
        @char-count="onCharCount"
        @submit-request="resetPage"
        @help-request="modal = 'help'"
        @bar-request="modal = 'bar'"
        @ghost-request="modal = 'ghost'"
      />
    </div>

    <div v-if="status" class="matte-glass fixed bottom-6 left-1/2 z-20 w-[min(42rem,calc(100%-3rem))] -translate-x-1/2 rounded-full px-4 py-2 text-center text-xs text-stone-400">
      {{ status }}
    </div>

    <div
      v-if="modal"
      class="matte-overlay fixed inset-0 z-30 grid place-items-center px-5"
      @mousedown.self="modal = null"
    >
      <aside class="matte-glass max-h-[86vh] w-[min(40rem,100%)] overflow-auto rounded-2xl p-6 shadow-2xl shadow-black/50">
        <div v-if="modal === 'help'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-stone-500">Commands</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">Slash is the interface.</h2>
            <p class="mt-2 text-sm text-stone-500">Nothing you type is saved. <span class="font-mono text-stone-300">/send</span> wipes the page clean — that's the whole point.</p>
          </div>
          <dl class="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
            <template v-for="[command, description] in helpCommands" :key="command">
              <dt class="font-mono text-stone-200">{{ command }}</dt>
              <dd class="text-stone-400">{{ description }}</dd>
            </template>
          </dl>
        </div>

        <div v-else-if="modal === 'bar'" class="space-y-6">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-stone-500">Goal bar</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">How big is the goal?</h2>
            <p class="mt-2 text-sm text-stone-500">The bar fills as you add lines and drains slowly over time. A bigger goal takes more sustained writing to fill.</p>
          </div>
          <div class="space-y-3">
            <input
              v-model.number="target"
              type="range"
              :min="MIN_TARGET"
              :max="MAX_TARGET"
              step="2"
              class="tv-slider w-full"
            >
            <div class="flex items-center justify-between text-xs text-stone-500">
              <span>smaller ({{ MIN_TARGET }})</span>
              <span class="font-mono text-stone-200">{{ target }} lines</span>
              <span>bigger ({{ MAX_TARGET }})</span>
            </div>
            <div class="h-[3px] w-full bg-white/5">
              <div class="h-full bg-teal-300/80" :style="{ width: `${progress}%` }" />
            </div>
          </div>
        </div>

        <div v-else-if="modal === 'ghost'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-stone-500">Ghost lines</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">Starting prompts</h2>
            <p class="mt-2 text-sm text-stone-500">The faint lines shown on the empty page. Added prompts last for this session only.</p>
          </div>
          <input
            v-model="newGhost"
            class="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm text-stone-100 outline-none focus:border-teal-300"
            placeholder="Add a prompt, then press Enter…"
            @keydown.enter.prevent="addGhost"
          >
          <ul class="space-y-1">
            <li
              v-for="(line, index) in ghostLines"
              :key="`${index}-${line}`"
              class="group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-stone-400 hover:bg-white/5"
            >
              <span class="min-w-0 truncate">{{ line }}</span>
              <button
                type="button"
                class="shrink-0 text-xs uppercase tracking-[0.18em] text-stone-600 hover:text-red-300"
                @click="removeGhost(index)"
              >
                remove
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </section>
</template>
