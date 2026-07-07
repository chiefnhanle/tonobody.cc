<script setup lang="ts">
// A little cozy HUD blob that fills as you write. Pick it up (pointer down)
// and it becomes a marble while you carry it around; drop it near any screen
// edge and it docks there as a bar running along that edge (horizontal along
// top/bottom, vertical along left/right). Drop it away from every edge and it
// stays a floating marble. Position/dock/shape are session-only state,
// consistent with the app's no-persistence rule.
//
// On touch devices, dragging is disabled entirely — free-dragging a small
// target with a finger is fiddly and it fights with scrolling. Instead, a tap
// just toggles it between its last bar dock and a circle in place.

const props = defineProps<{
  progress: number
  isFull: boolean
}>()

type Edge = 'top' | 'bottom' | 'left' | 'right'
type Orientation = 'horizontal' | 'vertical' | 'circle'
interface Geometry { x: number, y: number, width: number, height: number, orientation: Orientation }

const EDGE_THICKNESS = 40
const CIRCLE_DIAMETER = 72
const MARGIN = 24
const EDGE_SNAP_THRESHOLD = 80

// The initial placement is a one-time, slightly smaller "default" — any later
// edge-drop commits to the bigger, permanent dock size.
const DEFAULT_DOCK_FRACTION = 0.6
const DOCKED_FRACTION = 0.7

// Cozy "sunset in a jar" gradient, using the active color scheme's accent stops.
const FILL_GRADIENT_VERTICAL = 'linear-gradient(0deg, var(--tv-accent-a) 0%, var(--tv-accent-b) 55%, var(--tv-accent-c) 100%)'
const FILL_GRADIENT_HORIZONTAL = 'linear-gradient(90deg, var(--tv-accent-a) 0%, var(--tv-accent-b) 55%, var(--tv-accent-c) 100%)'

const dockEdge = ref<Edge | null>('top')
const dockFraction = ref(DEFAULT_DOCK_FRACTION)
const floatingPos = ref({ x: MARGIN, y: MARGIN })
const dragging = ref(false)
const viewport = ref({ width: 0, height: 0 })
const isCoarsePointer = ref(false)
// Remembers which edge to restore to when a mobile tap turns the circle back into a bar.
const lastDockEdge = ref<Edge>('top')

const pillRef = ref<HTMLElement | null>(null)

function dockedGeometry(edge: Edge, fraction: number): Geometry {
  const vw = viewport.value.width
  const vh = viewport.value.height
  if (edge === 'top' || edge === 'bottom') {
    const width = Math.round(vw * fraction)
    return {
      x: Math.round((vw - width) / 2),
      y: edge === 'top' ? MARGIN : vh - EDGE_THICKNESS - MARGIN,
      width,
      height: EDGE_THICKNESS,
      orientation: 'horizontal'
    }
  }
  const height = Math.round(vh * fraction)
  return {
    x: edge === 'left' ? MARGIN : vw - EDGE_THICKNESS - MARGIN,
    y: Math.round((vh - height) / 2),
    width: EDGE_THICKNESS,
    height,
    orientation: 'vertical'
  }
}

const geometry = computed<Geometry>(() => {
  if (dragging.value || dockEdge.value === null) {
    return { x: floatingPos.value.x, y: floatingPos.value.y, width: CIRCLE_DIAMETER, height: CIRCLE_DIAMETER, orientation: 'circle' }
  }
  return dockedGeometry(dockEdge.value, dockFraction.value)
})

const style = computed(() => ({
  left: `${geometry.value.x}px`,
  top: `${geometry.value.y}px`,
  width: `${geometry.value.width}px`,
  height: `${geometry.value.height}px`,
  touchAction: 'none',
  transition: dragging.value ? 'none' : 'left 220ms ease, top 220ms ease, width 220ms ease, height 220ms ease'
}))

onMounted(() => {
  syncViewport()
  isCoarsePointer.value = window.matchMedia('(pointer: coarse)').matches
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
})

function syncViewport() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}

function onResize() {
  syncViewport()
  if (dockEdge.value === null) {
    floatingPos.value = clampFloating(floatingPos.value.x, floatingPos.value.y)
  }
}

function clampFloating(x: number, y: number) {
  return {
    x: Math.min(Math.max(x, 0), Math.max(window.innerWidth - CIRCLE_DIAMETER, 0)),
    y: Math.min(Math.max(y, 0), Math.max(window.innerHeight - CIRCLE_DIAMETER, 0))
  }
}

function centerOnPointer(clientX: number, clientY: number) {
  return clampFloating(clientX - CIRCLE_DIAMETER / 2, clientY - CIRCLE_DIAMETER / 2)
}

function onPointerDown(event: PointerEvent) {
  if (isCoarsePointer.value) return // no free-drag on touch; the tap is handled on release
  // Picking it up: pop into a marble centered exactly on the cursor, wherever that was.
  floatingPos.value = centerOnPointer(event.clientX, event.clientY)
  dragging.value = true
  pillRef.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (isCoarsePointer.value || !dragging.value) return
  floatingPos.value = centerOnPointer(event.clientX, event.clientY)
}

function onPointerUp(event: PointerEvent) {
  if (isCoarsePointer.value) {
    toggleMobileShape()
    return
  }

  dragging.value = false
  pillRef.value?.releasePointerCapture(event.pointerId)

  const centerX = floatingPos.value.x + CIRCLE_DIAMETER / 2
  const centerY = floatingPos.value.y + CIRCLE_DIAMETER / 2
  const distances: Record<Edge, number> = {
    top: centerY,
    bottom: window.innerHeight - centerY,
    left: centerX,
    right: window.innerWidth - centerX
  }
  const nearestEdge = (Object.keys(distances) as Edge[]).reduce((a, b) => (distances[a] <= distances[b] ? a : b))

  if (distances[nearestEdge] <= EDGE_SNAP_THRESHOLD) {
    dockEdge.value = nearestEdge
    lastDockEdge.value = nearestEdge
    dockFraction.value = DOCKED_FRACTION
  } else {
    dockEdge.value = null
  }
}

function toggleMobileShape() {
  if (dockEdge.value === null) {
    // Currently a circle — restore the bar at whichever edge it last docked to.
    dockEdge.value = lastDockEdge.value
    dockFraction.value = DOCKED_FRACTION
    return
  }
  // Currently a bar — pop into a circle centered on the bar's current position.
  lastDockEdge.value = dockEdge.value
  const current = geometry.value
  floatingPos.value = clampFloating(
    current.x + current.width / 2 - CIRCLE_DIAMETER / 2,
    current.y + current.height / 2 - CIRCLE_DIAMETER / 2
  )
  dockEdge.value = null
}
</script>

<template>
  <div
    ref="pillRef"
    class="tv-doodle-panel fixed z-20 select-none overflow-hidden rounded-full"
    :class="[isCoarsePointer ? 'cursor-pointer' : (dragging ? 'cursor-grabbing' : 'cursor-grab'), props.isFull ? 'tv-bar-glow' : '']"
    :style="style"
    data-testid="momentum-bar"
    role="slider"
    :aria-label="isCoarsePointer ? 'Momentum bar — tap to switch between bar and circle' : 'Momentum bar — drag to move, drop near a screen edge to dock as a bar'"
    :aria-valuenow="Math.round(props.progress)"
    aria-valuemin="0"
    aria-valuemax="100"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      v-if="geometry.orientation === 'horizontal'"
      class="absolute inset-y-0 left-0 transition-[width] duration-150 ease-out"
      data-testid="momentum-bar-fill"
      :style="{
        width: `${props.progress}%`,
        backgroundImage: FILL_GRADIENT_HORIZONTAL,
        backgroundSize: `${geometry.width}px 100%`,
        backgroundPosition: 'left'
      }"
    />
    <div
      v-else
      class="absolute inset-x-0 bottom-0 transition-[height] duration-150 ease-out"
      data-testid="momentum-bar-fill"
      :style="{
        height: `${props.progress}%`,
        backgroundImage: FILL_GRADIENT_VERTICAL,
        backgroundSize: `100% ${geometry.height}px`,
        backgroundPosition: 'bottom'
      }"
    />
  </div>
</template>
