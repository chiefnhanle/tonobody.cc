<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { ghostWindow } from '~/utils/ghosts'

const props = defineProps<{
  modelValue: string
  ghostLines: string[]
  ghostIndex: number
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'line-count': [count: number]
  'submit-request': []
  'help-request': []
  'bar-request': []
  'ghost-request': []
}>()

interface Command {
  name: string
  hint: string
  run: () => void
}

const commandQuery = ref('')
const commandRange = ref<{ from: number, to: number } | null>(null)
const commandPosition = ref({ left: 0, top: 56 })
const highlightedCommand = ref(0)
const editorShell = ref<HTMLElement | null>(null)
const isEmpty = ref(true)

const commands = computed<Command[]>(() => [
  { name: 'send', hint: 'Release everything and reset the page', run: () => emit('submit-request') },
  { name: 'bar', hint: 'Adjust how big the goal bar is', run: () => emit('bar-request') },
  { name: 'ghost', hint: 'Add your own starting prompts', run: () => emit('ghost-request') },
  { name: 'help', hint: 'Show every command', run: () => emit('help-request') },
  { name: 'bold', hint: 'Toggle bold text', run: () => editor.value?.chain().focus().toggleBold().run() },
  { name: 'italic', hint: 'Toggle italic text', run: () => editor.value?.chain().focus().toggleItalic().run() },
  { name: 'list', hint: 'Start a bullet list', run: () => editor.value?.chain().focus().toggleBulletList().run() },
  { name: 'quote', hint: 'Set something aside as a quote', run: () => editor.value?.chain().focus().toggleBlockquote().run() }
])
const filteredCommands = computed(() => {
  const query = commandQuery.value.toLowerCase()
  return commands.value.filter(command => command.name.startsWith(query)).slice(0, 6)
})
const showCommands = computed(() => Boolean(commandRange.value && filteredCommands.value.length))
const commandStyle = computed(() => ({
  left: `${commandPosition.value.left}px`,
  top: `${commandPosition.value.top}px`
}))

const visibleGhosts = computed(() => ghostWindow(props.ghostLines, props.ghostIndex, 3))

const editor = useEditor({
  content: props.modelValue || '<p></p>',
  extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
  editorProps: {
    attributes: { class: 'prose prose-invert max-w-none focus:outline-none' },
    handleKeyDown: (_view, event) => {
      if (!showCommands.value) return false
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        highlightedCommand.value = (highlightedCommand.value + 1) % filteredCommands.value.length
        return true
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        highlightedCommand.value = (highlightedCommand.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
        return true
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        runCommand(filteredCommands.value[highlightedCommand.value])
        return true
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        closeCommands()
        return true
      }
      return false
    }
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
    emitLineCount()
    updateCommandState()
  },
  onSelectionUpdate: updateCommandState
})

function emitLineCount() {
  const instance = editor.value
  if (!instance) return
  isEmpty.value = instance.isEmpty
  let count = 0
  instance.state.doc.descendants((node) => {
    if (node.isTextblock && node.textContent.trim().length > 0) count++
    return true
  })
  emit('line-count', count)
}

watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(value || '<p></p>', false)
    emitLineCount()
  }
})

function closeCommands() {
  commandRange.value = null
  commandQuery.value = ''
  highlightedCommand.value = 0
}

function updateCommandPosition() {
  const instance = editor.value
  const shell = editorShell.value
  if (!instance || !shell) return
  const coords = instance.view.coordsAtPos(instance.state.selection.from)
  const bounds = shell.getBoundingClientRect()
  const menuWidth = Math.min(480, window.innerWidth - 48)
  const left = Math.min(Math.max(coords.left - bounds.left, 0), Math.max(bounds.width - menuWidth, 0))
  commandPosition.value = {
    left,
    top: coords.bottom - bounds.top + 10
  }
}

function updateCommandState() {
  const instance = editor.value
  if (!instance) return
  const { selection } = instance.state
  if (!selection.empty) {
    closeCommands()
    return
  }
  const anchor = selection.$from
  const textBeforeCursor = anchor.parent.textBetween(0, anchor.parentOffset, '\n', '\n')
  const match = textBeforeCursor.match(/(?:^|\s)([\\/])([a-z]*)$/i)
  if (!match) {
    closeCommands()
    return
  }
  const query = match[2] || ''
  commandQuery.value = query.toLowerCase()
  highlightedCommand.value = 0
  commandRange.value = {
    from: selection.from - query.length - 1,
    to: selection.from
  }
  updateCommandPosition()
}

function runCommand(command: Command | undefined) {
  const instance = editor.value
  const range = commandRange.value
  if (!instance || !command || !range) return
  instance.chain().focus().deleteRange(range).run()
  closeCommands()
  command.run()
}

function focus() {
  editor.value?.chain().focus().run()
}

defineExpose({ focus })
</script>

<template>
  <div ref="editorShell" class="relative">
    <div
      v-if="isEmpty && visibleGhosts.length"
      class="pointer-events-none absolute inset-x-0 top-0 select-none pt-4 text-xl leading-9"
      aria-hidden="true"
    >
      <p
        v-for="(line, index) in visibleGhosts"
        :key="`${index}-${line}`"
        class="tv-ghost-line"
        :style="{ opacity: index === 0 ? 0.4 : index === 1 ? 0.2 : 0.1 }"
      >
        {{ line }}
      </p>
    </div>

    <EditorContent :editor="editor" class="capture-editor px-0 py-0" />

    <div
      v-if="showCommands"
      class="matte-glass absolute z-10 w-[min(30rem,calc(100vw-3rem))] overflow-hidden rounded-xl shadow-2xl shadow-black/50"
      :style="commandStyle"
      role="listbox"
    >
      <div
        v-for="(command, index) in filteredCommands"
        :key="command.name"
        class="grid grid-cols-[96px_1fr] gap-3 px-4 py-3 text-left text-sm"
        :class="index === highlightedCommand ? 'bg-white/10 text-white' : 'text-stone-400'"
        role="option"
        :aria-selected="index === highlightedCommand"
        @mousedown.prevent="runCommand(command)"
      >
        <code class="font-mono text-xs text-stone-200">/{{ command.name }}</code>
        <span>{{ command.hint }}</span>
      </div>
    </div>
  </div>
</template>
