<script setup lang="ts">
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue || '<p></p>',
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Underline,
    Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
    Placeholder.configure({ placeholder: 'Capture the raw thought before it tries to become tidy.' })
  ],
  editorProps: {
    attributes: { class: 'prose prose-stone max-w-none dark:prose-invert focus:outline-none' }
  },
  onUpdate: ({ editor }) => emit('update:modelValue', editor.getHTML())
})

watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) editor.value.commands.setContent(value || '<p></p>', false)
})

function setLink() {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('URL', previousUrl || '')
  if (url === null) return
  if (url === '') editor.value.chain().focus().unsetLink().run()
  else editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const buttonClass = 'h-9 min-w-9 rounded border border-stone-300 px-2 text-sm font-medium hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:hover:bg-neutral-800'
</script>

<template>
  <div class="overflow-hidden rounded border border-stone-300 bg-white dark:border-neutral-800 dark:bg-neutral-950">
    <div v-if="editor" class="flex flex-wrap gap-1 border-b border-stone-200 bg-stone-100 p-2 dark:border-neutral-800 dark:bg-neutral-900">
      <button type="button" :class="buttonClass" title="Undo" @click="editor.chain().focus().undo().run()">↶</button>
      <button type="button" :class="buttonClass" title="Redo" @click="editor.chain().focus().redo().run()">↷</button>
      <button type="button" :class="buttonClass" title="Bold" :aria-pressed="editor.isActive('bold')" @click="editor.chain().focus().toggleBold().run()">B</button>
      <button type="button" :class="buttonClass" title="Italic" :aria-pressed="editor.isActive('italic')" @click="editor.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" :class="buttonClass" title="Underline" :aria-pressed="editor.isActive('underline')" @click="editor.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <button type="button" :class="buttonClass" title="Inline code" :aria-pressed="editor.isActive('code')" @click="editor.chain().focus().toggleCode().run()">`</button>
      <button type="button" :class="buttonClass" title="Heading 1" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">H1</button>
      <button type="button" :class="buttonClass" title="Heading 2" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" :class="buttonClass" title="Bullet list" @click="editor.chain().focus().toggleBulletList().run()">•</button>
      <button type="button" :class="buttonClass" title="Numbered list" @click="editor.chain().focus().toggleOrderedList().run()">1.</button>
      <button type="button" :class="buttonClass" title="Block quote" @click="editor.chain().focus().toggleBlockquote().run()">“</button>
      <button type="button" :class="buttonClass" title="Code block" @click="editor.chain().focus().toggleCodeBlock().run()">{}</button>
      <button type="button" :class="buttonClass" title="Link" @click="setLink">🔗</button>
      <button type="button" :class="buttonClass" title="Horizontal rule" @click="editor.chain().focus().setHorizontalRule().run()">—</button>
    </div>
    <EditorContent :editor="editor" class="px-5 py-4" />
  </div>
</template>
