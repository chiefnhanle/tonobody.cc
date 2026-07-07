<script setup lang="ts">
interface VaultTreeItem {
  name: string
  relativePath: string
  type: 'directory' | 'file'
  children?: VaultTreeItem[]
}

defineProps<{ item: VaultTreeItem, depth?: number }>()
defineEmits<{ reveal: [relativePath: string] }>()
</script>

<template>
  <div>
    <div
      class="matte-glass cursor-default rounded-xl px-3 py-2 text-sm text-stone-300 transition hover:text-white"
      :style="{ marginLeft: `${(depth || 0) * 14}px` }"
      @click="$emit('reveal', item.relativePath)"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="min-w-0 truncate">
          <span class="mr-2 text-stone-600">{{ item.type === 'directory' ? '/' : '-' }}</span>{{ item.name }}
        </span>
        <span class="shrink-0 text-xs uppercase tracking-[0.18em] text-stone-700">{{ item.type }}</span>
      </div>
    </div>
    <div v-if="item.children?.length" class="mt-1 space-y-1">
      <VaultTreeRow
        v-for="child in item.children"
        :key="child.relativePath"
        :item="child"
        :depth="(depth || 0) + 1"
        @reveal="$emit('reveal', $event)"
      />
    </div>
  </div>
</template>
