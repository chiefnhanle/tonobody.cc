<script setup lang="ts">
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, Node, mergeAttributes, useEditor } from '@tiptap/vue-3'

export interface EditorAttachmentBlock {
  id: string
  name: string
  type: string
  size: string
  previewUrl: string
}

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'attach-request': []
  'submit-request': []
  'help-request': []
  'inbox-request': []
  'settings-request': []
  'vault-request': []
  'graph-request': []
  'examples-request': []
  'math-request': [mode: 'inline' | 'block']
}>()

interface CaptureCommand {
  name: string
  hint: string
  run: () => void
}

type DomSpec = string | [string, Record<string, string>, ...DomSpec[]]

const latexSymbols: Record<string, string> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  theta: 'θ',
  lambda: 'λ',
  mu: 'μ',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  phi: 'φ',
  omega: 'ω',
  Gamma: 'Γ',
  Delta: 'Δ',
  Theta: 'Θ',
  Lambda: 'Λ',
  Pi: 'Π',
  Sigma: 'Σ',
  Phi: 'Φ',
  Omega: 'Ω',
  times: '×',
  cdot: '⋅',
  pm: '±',
  leq: '≤',
  geq: '≥',
  neq: '≠',
  approx: '≈',
  infty: '∞',
  partial: '∂',
  nabla: '∇',
  int: '∫',
  sum: '∑'
}

function mathText(value: string): DomSpec {
  const className = /^[+\-=<>×⋅±≤≥≠≈,()[\]|]$/.test(value)
    ? 'tv-math-operator'
    : /^\d+(?:\.\d+)?$/.test(value)
      ? 'tv-math-number'
      : 'tv-math-identifier'
  return ['span', { class: className }, value]
}

function readGroup(input: string, start: number) {
  if (input[start] !== '{') return { value: input[start] || '', end: start + 1 }
  let depth = 0
  for (let index = start; index < input.length; index++) {
    if (input[index] === '{') depth++
    if (input[index] === '}') depth--
    if (depth === 0) return { value: input.slice(start + 1, index), end: index + 1 }
  }
  return { value: input.slice(start + 1), end: input.length }
}

function readScript(input: string, start: number) {
  if (input[start] === '{') return readGroup(input, start)
  if (input[start] === '\\') {
    const command = input.slice(start + 1).match(/^[A-Za-z]+/)?.[0] || ''
    return { value: `\\${command}`, end: start + command.length + 1 }
  }
  return { value: input[start] || '', end: start + 1 }
}

function latexToRenderSpec(latex: string): DomSpec {
  const nodes: DomSpec[] = []
  let index = 0

  while (index < latex.length) {
    const char = latex[index]
    if (!char) break
    if (/\s/.test(char)) {
      index++
      continue
    }

    let node: DomSpec
    if (char === '\\') {
      const command = latex.slice(index + 1).match(/^[A-Za-z]+/)?.[0] || ''
      index += command.length + 1
      if (command === 'frac') {
        const numerator = readGroup(latex, index)
        const denominator = readGroup(latex, numerator.end)
        node = ['span', { class: 'tv-math-frac' }, ['span', { class: 'tv-math-frac-num' }, latexToRenderSpec(numerator.value)], ['span', { class: 'tv-math-frac-den' }, latexToRenderSpec(denominator.value)]]
        index = denominator.end
      } else if (command === 'sqrt') {
        const radicand = readGroup(latex, index)
        node = ['span', { class: 'tv-math-sqrt' }, ['span', { class: 'tv-math-sqrt-symbol' }, '√'], ['span', { class: 'tv-math-sqrt-body' }, latexToRenderSpec(radicand.value)]]
        index = radicand.end
      } else {
        node = mathText(latexSymbols[command] || command)
      }
    } else if (char === '{') {
      const group = readGroup(latex, index)
      node = latexToRenderSpec(group.value)
      index = group.end
    } else {
      node = mathText(char)
      index++
    }

    while (latex[index] === '^' || latex[index] === '_') {
      const operator = latex[index]
      const script = readScript(latex, index + 1)
      node = operator === '^'
        ? ['span', { class: 'tv-math-script' }, node, ['sup', { class: 'tv-math-sup' }, latexToRenderSpec(script.value)]]
        : ['span', { class: 'tv-math-script' }, node, ['sub', { class: 'tv-math-sub' }, latexToRenderSpec(script.value)]]
      index = script.end
    }

    nodes.push(node)
  }

  return ['span', { class: 'tv-math-row' }, ...nodes]
}

const AttachmentBlock = Node.create({
  name: 'attachmentBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: { default: '' },
      name: { default: 'attachment' },
      type: { default: 'application/octet-stream' },
      size: { default: '' },
      previewUrl: { default: '' }
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-thought-vault-attachment]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const isImage = String(HTMLAttributes.type || '').startsWith('image/')
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-thought-vault-attachment': 'true',
        'data-attachment-id': HTMLAttributes.id,
        class: 'tv-attachment-card',
        contenteditable: 'false'
      }),
      isImage
        ? ['img', { src: HTMLAttributes.previewUrl, alt: HTMLAttributes.name, class: 'tv-attachment-image' }]
        : ['div', { class: 'tv-attachment-file' }, ['span', { class: 'tv-attachment-dot' }, ''], ['span', { class: 'tv-attachment-name' }, HTMLAttributes.name]],
      ['figcaption', { class: 'tv-attachment-caption' }, `${HTMLAttributes.name} - ${HTMLAttributes.size || HTMLAttributes.type}`]
    ]
  }
})

const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return { latex: { default: '' } }
  },

  parseHTML() {
    return [{ tag: 'span[data-thought-vault-math-inline]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const latex = String(HTMLAttributes.latex || '')
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-thought-vault-math-inline': 'true',
        'data-latex': latex,
        class: 'tv-math-inline',
        contenteditable: 'false'
      }),
      ['span', { class: 'tv-math-rendered' }, latexToRenderSpec(latex)]
    ]
  }
})

const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return { latex: { default: '' } }
  },

  parseHTML() {
    return [{ tag: 'figure[data-thought-vault-math-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const latex = String(HTMLAttributes.latex || '')
    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-thought-vault-math-block': 'true',
        'data-latex': latex,
        class: 'tv-math-block',
        contenteditable: 'false'
      }),
      ['div', { class: 'tv-math-rendered' }, latexToRenderSpec(latex)],
      ['code', { class: 'tv-math-source' }, latex]
    ]
  }
})

const commandQuery = ref('')
const commandRange = ref<{ from: number, to: number } | null>(null)
const commandPosition = ref({ left: 0, top: 56 })
const highlightedCommand = ref(0)
const editorShell = ref<HTMLElement | null>(null)
const commands = computed<CaptureCommand[]>(() => [
  { name: 'send', hint: 'Save this capture to the vault', run: () => emit('submit-request') },
  { name: 'help', hint: 'Show every command', run: () => emit('help-request') },
  { name: 'inbox', hint: 'Open recent captures', run: () => emit('inbox-request') },
  { name: 'vault', hint: 'Browse the vault', run: () => emit('vault-request') },
  { name: 'graph', hint: 'Open the knowledge graph', run: () => emit('graph-request') },
  { name: 'examples', hint: 'Seed example inbox maps', run: () => emit('examples-request') },
  { name: 'settings', hint: 'Open vault settings', run: () => emit('settings-request') },
  { name: 'title', hint: 'Turn this line into the capture title', run: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run() },
  { name: 'section', hint: 'Start a second-level heading', run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run() },
  { name: 'bold', hint: 'Toggle bold for the next words', run: () => editor.value?.chain().focus().toggleBold().run() },
  { name: 'italic', hint: 'Toggle italic text', run: () => editor.value?.chain().focus().toggleItalic().run() },
  { name: 'list', hint: 'Start a bullet list', run: () => editor.value?.chain().focus().toggleBulletList().run() },
  { name: 'numbered', hint: 'Start a numbered list', run: () => editor.value?.chain().focus().toggleOrderedList().run() },
  { name: 'quote', hint: 'Capture a quote or aside', run: () => editor.value?.chain().focus().toggleBlockquote().run() },
  { name: 'code', hint: 'Start a code block', run: () => editor.value?.chain().focus().toggleCodeBlock().run() },
  { name: 'math', hint: 'Insert inline LaTeX math', run: () => emit('math-request', 'inline') },
  { name: 'equation', hint: 'Insert a display equation', run: () => emit('math-request', 'block') },
  { name: 'link', hint: 'Add a link to selected text', run: setLink },
  { name: 'rule', hint: 'Insert a horizontal rule', run: () => editor.value?.chain().focus().setHorizontalRule().run() },
  { name: 'attach', hint: 'Attach files to this capture', run: () => emit('attach-request') }
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

const editor = useEditor({
  content: props.modelValue || '<p></p>',
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    AttachmentBlock,
    MathInline,
    MathBlock,
    Underline,
    Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
    Placeholder.configure({ placeholder: 'Type. Use /help when you need the room to answer.' })
  ],
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
    updateCommandState()
  },
  onSelectionUpdate: updateCommandState
})

watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) editor.value.commands.setContent(value || '<p></p>', false)
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
  const { state } = instance
  const { selection } = state
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

function runCommand(command: CaptureCommand | undefined) {
  const instance = editor.value
  const range = commandRange.value
  if (!instance || !command || !range) return
  instance.chain().focus().deleteRange(range).run()
  closeCommands()
  command.run()
}

function setLink() {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('URL', previousUrl || '')
  if (url === null) return
  if (url === '') editor.value.chain().focus().unsetLink().run()
  else editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function insertAttachmentBlock(attachment: EditorAttachmentBlock) {
  editor.value?.chain().focus().insertContent([
    {
      type: 'attachmentBlock',
      attrs: attachment
    },
    {
      type: 'paragraph'
    }
  ]).run()
}

function insertMath(mode: 'inline' | 'block', latex: string) {
  const trimmed = latex.trim()
  if (!trimmed) return
  if (mode === 'inline') {
    editor.value?.chain().focus().insertContent([
      {
        type: 'mathInline',
        attrs: { latex: trimmed }
      },
      {
        type: 'text',
        text: ' '
      }
    ]).run()
    return
  }
  editor.value?.chain().focus().insertContent([
    {
      type: 'mathBlock',
      attrs: { latex: trimmed }
    },
    {
      type: 'paragraph'
    }
  ]).run()
}

defineExpose({ insertAttachmentBlock, insertMath })
</script>

<template>
  <div ref="editorShell" class="relative">
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
