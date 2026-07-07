<script setup lang="ts">
// A small draggable HUD pill instead of a fixed bar — it should feel like an
// object sitting on the page, not chrome. Position is session-only state,
// consistent with the app's no-persistence rule.

const props = defineProps<{
  progress: number
  isFull: boolean
}>()

const PILL_WIDTH = 128
const PILL_HEIGHT = 32
const MARGIN = 24

const pillRef = ref<HTMLElement | null>(null)
const position = ref({ x: MARGIN, y: MARGIN })
const dragging = ref(false)
let pointerOffset = { x: 0, y: 0 }

onMounted(() => {
  position.value = {
    x: Math.max(MARGIN, window.innerWidth - PILL_WIDTH - MARGIN),
    y: MARGIN
  }
  window.addEventListener('resize', clampPosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', clampPosition)
})

function clamp(x: number, y: number) {
  return {
    x: Math.min(Math.max(x, 0), Math.max(window.innerWidth - PILL_WIDTH, 0)),
    y: Math.min(Math.max(y, 0), Math.max(window.innerHeight - PILL_HEIGHT, 0))
  }
}

function clampPosition() {
  position.value = clamp(position.value.x, position.value.y)
}

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  pointerOffset = { x: event.clientX - position.value.x, y: event.clientY - position.value.y }
  pillRef.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  position.value = clamp(event.clientX - pointerOffset.x, event.clientY - pointerOffset.y)
}

function onPointerUp(event: PointerEvent) {
  dragging.value = false
  pillRef.value?.releasePointerCapture(event.pointerId)
}
</script>

<template>
  <div
    ref="pillRef"
    class="matte-glass fixed z-20 flex h-8 w-32 select-none items-center rounded-full p-1"
    :class="[props.isFull ? 'tv-bar-full' : '', dragging ? 'cursor-grabbing' : 'cursor-grab']"
    :style="{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }"
    data-testid="momentum-bar"
    role="slider"
    aria-label="Momentum bar — drag to move"
    :aria-valuenow="Math.round(props.progress)"
    aria-valuemin="0"
    aria-valuemax="100"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="h-full w-full overflow-hidden rounded-full bg-white/5">
      <div
        class="h-full rounded-full bg-teal-300/80 transition-[width] duration-150 ease-out"
        data-testid="momentum-bar-fill"
        :style="{ width: `${props.progress}%` }"
      />
    </div>
  </div>
</template>
