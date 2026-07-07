<script setup lang="ts">
import { DEFAULT_GHOST_LINES } from '~/utils/ghosts'
import {
  DEFAULT_TARGET, MIN_TARGET, MAX_TARGET,
  DEFAULT_DECAY_MULTIPLIER, MIN_DECAY_MULTIPLIER, MAX_DECAY_MULTIPLIER, DECAY_PER_SECOND,
  applyCharDelta, decay, barPercent
} from '~/utils/bar'
import { THEMES } from '~/utils/themes'

type ModalName = 'help' | 'bar' | 'ghost' | 'theme' | null
interface EditorHandle { focus: () => void }

const html = ref('<p></p>')
const modal = ref<ModalName>(null)
const status = ref('')
const editorRef = ref<EditorHandle | null>(null)
const { themeId, setTheme } = useColorScheme()

// Momentum bar state.
const fill = ref(0)
const target = ref(DEFAULT_TARGET)
const drainSpeed = ref(DEFAULT_DECAY_MULTIPLIER)
const prevChars = ref(0)
const progress = computed(() => barPercent(fill.value, target.value))
const isFull = computed(() => progress.value >= 100)

// Ghost prompts (session only — nothing is persisted anywhere).
const ghostLines = ref<string[]>([...DEFAULT_GHOST_LINES])
const ghostIndex = ref(0)
const newGhost = ref('')

const helpCommands = [
  ['/scrap', 'release everything and reset the page'],
  ['/bar', 'adjust how big the goal bar is'],
  ['/ghost', 'add your own starting prompts'],
  ['/theme', 'pick a color scheme'],
  ['/about', 'read the mission, find the source'],
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
  fill.value = decay(fill.value, dt, DECAY_PER_SECOND * drainSpeed.value)
  rafId = requestAnimationFrame(tick)
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

// The "scrap" button of an anxiety scratchpad: rip everything, keep nothing.
function resetPage() {
  html.value = '<p></p>'
  fill.value = 0
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
  <section class="min-h-screen px-8 py-20 sm:px-12 sm:py-24 lg:px-20 lg:py-28">
    <!-- Momentum bar: a draggable, clickable blob that fills as you type and drains slowly with time. Top it off. -->
    <MomentumBar :progress="progress" :is-full="isFull" />

    <div class="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl flex-col justify-center">
      <TiptapEditor
        ref="editorRef"
        v-model="html"
        :ghost-lines="ghostLines"
        :ghost-index="ghostIndex"
        class="w-full"
        @char-count="onCharCount"
        @submit-request="resetPage"
        @help-request="modal = 'help'"
        @bar-request="modal = 'bar'"
        @ghost-request="modal = 'ghost'"
        @theme-request="modal = 'theme'"
        @about-request="navigateTo('/about')"
      />
    </div>

    <div v-if="status" class="tv-pop-in tv-doodle-panel fixed bottom-6 left-1/2 z-20 w-[min(42rem,calc(100%-3rem))] -translate-x-1/2 rounded-full px-4 py-2 text-center font-doodle text-base text-[var(--tv-text)]">
      {{ status }}
    </div>

    <div
      v-if="modal"
      class="matte-overlay fixed inset-0 z-30 grid place-items-center px-5"
      @mousedown.self="modal = null"
    >
      <aside class="tv-blob tv-doodle-panel max-h-[86vh] w-[min(40rem,100%)] overflow-auto p-6">
        <div v-if="modal === 'help'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-[var(--tv-dim)]">Commands</p>
            <h2 class="mt-2 font-doodle text-3xl text-[var(--tv-text)]">Slash is the interface.</h2>
            <p class="mt-2 text-sm text-[var(--tv-dim)]">Nothing you type is saved. <span class="font-mono text-[var(--tv-text)]">/scrap</span> wipes the page clean — that's the whole point.</p>
          </div>
          <dl class="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
            <template v-for="[command, description] in helpCommands" :key="command">
              <dt class="font-mono text-[var(--tv-text)]">{{ command }}</dt>
              <dd class="font-doodle text-base text-[var(--tv-muted)]">{{ description }}</dd>
            </template>
          </dl>
        </div>

        <div v-else-if="modal === 'bar'" class="space-y-6">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-[var(--tv-dim)]">Goal bar</p>
            <h2 class="mt-2 font-doodle text-3xl text-[var(--tv-text)]">How big is the goal?</h2>
            <p class="mt-2 text-sm text-[var(--tv-dim)]">The bar fills as you type — every character counts — and drains slowly over time. A bigger goal takes more sustained writing to fill.</p>
          </div>
          <div class="space-y-3">
            <input
              v-model.number="target"
              type="range"
              :min="MIN_TARGET"
              :max="MAX_TARGET"
              step="20"
              class="tv-slider w-full"
            >
            <div class="flex items-center justify-between font-doodle text-base text-[var(--tv-dim)]">
              <span>smaller ({{ MIN_TARGET }})</span>
              <span class="font-mono text-sm text-[var(--tv-text)]">{{ target }} chars</span>
              <span>bigger ({{ MAX_TARGET }})</span>
            </div>
            <div class="h-[3px] w-full bg-[var(--tv-chip)]">
              <div
                class="h-full"
                :style="{ width: `${progress}%`, backgroundImage: 'linear-gradient(to right, var(--tv-accent-a), var(--tv-accent-b), var(--tv-accent-c))' }"
              />
            </div>
          </div>
          <div class="space-y-3">
            <p class="text-sm text-[var(--tv-dim)]">How fast it drains while you pause.</p>
            <input
              v-model.number="drainSpeed"
              type="range"
              :min="MIN_DECAY_MULTIPLIER"
              :max="MAX_DECAY_MULTIPLIER"
              step="0.2"
              class="tv-slider w-full"
            >
            <div class="flex items-center justify-between font-doodle text-base text-[var(--tv-dim)]">
              <span>slower ({{ MIN_DECAY_MULTIPLIER }}x)</span>
              <span class="font-mono text-sm text-[var(--tv-text)]">{{ drainSpeed.toFixed(1) }}x</span>
              <span>faster ({{ MAX_DECAY_MULTIPLIER }}x)</span>
            </div>
          </div>
        </div>

        <div v-else-if="modal === 'ghost'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-[var(--tv-dim)]">Ghost lines</p>
            <h2 class="mt-2 font-doodle text-3xl text-[var(--tv-text)]">Starting prompts</h2>
            <p class="mt-2 text-sm text-[var(--tv-dim)]">The faint lines shown on the empty page. Added prompts last for this session only.</p>
          </div>
          <input
            v-model="newGhost"
            class="w-full border-0 border-b border-[var(--tv-dim)] bg-transparent px-0 py-3 text-sm text-[var(--tv-text)] outline-none focus:border-[var(--tv-accent-b)]"
            placeholder="Add a prompt, then press Enter…"
            @keydown.enter.prevent="addGhost"
          >
          <ul class="space-y-1">
            <li
              v-for="(line, index) in ghostLines"
              :key="`${index}-${line}`"
              class="group flex items-center justify-between gap-3 rounded-lg px-3 py-2 font-doodle text-base text-[var(--tv-muted)] hover:bg-[var(--tv-chip)]"
            >
              <span class="min-w-0 truncate">{{ line }}</span>
              <button
                type="button"
                class="shrink-0 font-sans text-xs uppercase tracking-[0.18em] text-[var(--tv-dim)] transition-transform hover:-rotate-3 hover:text-red-300"
                @click="removeGhost(index)"
              >
                remove
              </button>
            </li>
          </ul>
        </div>

        <div v-else-if="modal === 'theme'" class="space-y-5">
          <div>
            <p class="text-sm uppercase tracking-[0.22em] text-[var(--tv-dim)]">Color scheme</p>
            <h2 class="mt-2 font-doodle text-3xl text-[var(--tv-text)]">Pick your cozy.</h2>
            <p class="mt-2 text-sm text-[var(--tv-dim)]">Session only — it resets next time you open the page.</p>
          </div>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <button
              v-for="t in THEMES"
              :key="t.id"
              type="button"
              class="flex flex-col items-center gap-2 rounded-2xl p-3 font-doodle text-sm transition-transform hover:-rotate-1 hover:scale-[1.03]"
              :style="{
                color: t.vars['--tv-text'],
                outline: t.id === themeId ? `2px solid ${t.vars['--tv-accent-b']}` : 'none',
                outlineOffset: '2px'
              }"
              @click="setTheme(t.id)"
            >
              <span
                class="flex h-14 w-14 items-center justify-center rounded-full"
                :style="{ background: t.vars['--tv-bg'], border: `2px solid ${t.vars['--tv-ink']}` }"
              >
                <span
                  class="h-7 w-7 rounded-full"
                  :style="{ background: `linear-gradient(135deg, ${t.vars['--tv-accent-a']}, ${t.vars['--tv-accent-b']}, ${t.vars['--tv-accent-c']})` }"
                />
              </span>
              {{ t.name }}
            </button>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
