<script setup lang="ts">
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

type GraphRenderAttributes = Record<string, unknown>

interface RuntimeGraph {
  addNode: (id: string, attributes: GraphRenderAttributes) => void
  addEdgeWithKey: (id: string, source: string, target: string, attributes: GraphRenderAttributes) => void
  getNodeAttributes: (id: string) => GraphRenderAttributes
  hasEdge: (id: string) => boolean
  hasNode: (id: string) => boolean
  neighbors: (id: string) => string[]
}

interface RuntimeRenderer {
  getCamera: () => {
    animate: (state: { x: number, y: number, ratio: number }, options: { duration: number }) => void
    animatedReset: (options?: { duration: number }) => Promise<void>
  }
  kill: () => void
  on: {
    (event: 'clickNode' | 'enterNode', callback: (payload: { node: string }) => void): void
    (event: 'leaveNode', callback: () => void): void
  }
  refresh: () => void
  resize: (force?: boolean) => void
}

const props = defineProps<{ nodes: GraphNode[], edges: GraphEdge[] }>()
const emit = defineEmits<{ openCapture: [id: string] }>()

const container = ref<HTMLElement | null>(null)
const selectedId = ref('')
const hoveredId = ref('')
const search = ref('')
const enabledTypes = ref(new Set<GraphNode['type']>(['capture', 'concept', 'claim', 'question', 'source', 'method']))
const graphError = ref('')
let renderer: RuntimeRenderer | null = null
let graph: RuntimeGraph | null = null
let renderVersion = 0

const selectedNode = computed(() => props.nodes.find(node => node.id === selectedId.value) || null)
const captureCount = computed(() => props.nodes.filter(node => node.type === 'capture').length)
const nodeCount = computed(() => props.nodes.length)
const edgeCount = computed(() => props.edges.length)
const typeOptions: Array<{ type: GraphNode['type'], label: string }> = [
  { type: 'capture', label: 'Captures' },
  { type: 'concept', label: 'Concepts' },
  { type: 'claim', label: 'Claims' },
  { type: 'question', label: 'Questions' },
  { type: 'source', label: 'Sources' },
  { type: 'method', label: 'Methods' }
]

const colors: Record<GraphNode['type'], string> = {
  capture: '#5eead4',
  concept: '#e7e5e4',
  claim: '#f0abfc',
  question: '#fde68a',
  source: '#93c5fd',
  method: '#c4b5fd'
}

watch([() => props.nodes, () => props.edges], () => void queueRenderGraph(), { deep: true, flush: 'post' })
watch([enabledTypes, search], () => renderer?.refresh(), { deep: true })

onMounted(() => void queueRenderGraph())
onBeforeUnmount(() => renderer?.kill())

function toggleType(type: GraphNode['type']) {
  const next = new Set(enabledTypes.value)
  if (next.has(type)) next.delete(type)
  else next.add(type)
  enabledTypes.value = next
}

function captureIdFromNode(nodeId: string) {
  return nodeId.startsWith('capture:') ? nodeId.slice('capture:'.length) : ''
}

function focusSearch() {
  if (!graph || !renderer) return
  const query = search.value.trim().toLowerCase()
  if (!query) return
  const nodeId = props.nodes.find(node => node.label.toLowerCase().includes(query))?.id
  if (!nodeId || !graph.hasNode(nodeId)) return
  selectedId.value = nodeId
  const attrs = graph.getNodeAttributes(nodeId)
  renderer.getCamera().animate({ x: Number(attrs.x), y: Number(attrs.y), ratio: 0.55 }, { duration: 420 })
}

async function queueRenderGraph() {
  const version = ++renderVersion
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  if (version !== renderVersion) return
  await renderGraph()
}

async function renderGraph() {
  if (!container.value) return
  graphError.value = ''
  renderer?.kill()
  renderer = null
  graph = null
  if (!props.nodes.length) return

  const bounds = container.value.getBoundingClientRect()
  if (!bounds.width || !bounds.height) {
    graphError.value = 'Graph panel has no visible size yet. Close and reopen /graph.'
    return
  }

  const [{ default: Graph }, { default: Sigma }, { default: forceAtlas2 }] = await Promise.all([
    import('graphology'),
    import('sigma'),
    import('graphology-layout-forceatlas2')
  ])
  const runtimeGraph = new Graph()
  graph = runtimeGraph as RuntimeGraph

  const radius = Math.max(4, props.nodes.length * 2)
  props.nodes.forEach((node, index) => {
    const angle = (index / Math.max(props.nodes.length, 1)) * Math.PI * 2
    graph?.addNode(node.id, {
      ...node,
      x: Math.cos(angle) * radius + Math.random(),
      y: Math.sin(angle) * radius + Math.random(),
      size: node.type === 'capture' ? 9 : 5,
      color: colors[node.type],
      label: node.label
    })
  })
  props.edges.forEach(edge => {
    if (graph?.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.id)) {
      graph.addEdgeWithKey(edge.id, edge.source, edge.target, { ...edge, size: Math.min(4, Math.max(1, edge.weight)), color: '#ffffff22' })
    }
  })

  if (props.nodes.length > 1) {
    forceAtlas2.assign(runtimeGraph, { iterations: 120, settings: { gravity: 1.6, scalingRatio: 18, slowDown: 8 } })
  }

  try {
    renderer = new Sigma(runtimeGraph, container.value, {
      allowInvalidContainer: true,
      renderEdgeLabels: false,
      labelColor: { color: '#e7e5e4' },
      defaultEdgeColor: '#ffffff22',
      nodeReducer: (nodeId: string, data: Record<string, unknown>) => reduceNode(nodeId, data),
      edgeReducer: (_edgeId: string, data: Record<string, unknown>) => reduceEdge(data)
    }) as RuntimeRenderer
  } catch (error) {
    graphError.value = error instanceof Error ? error.message : 'Could not render graph.'
    return
  }
  renderer.on('clickNode', ({ node }) => {
    selectedId.value = node
  })
  renderer.on('enterNode', ({ node }) => {
    hoveredId.value = node
    renderer?.refresh()
  })
  renderer.on('leaveNode', () => {
    hoveredId.value = ''
    renderer?.refresh()
  })
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  renderer.resize(true)
  renderer.refresh()
  void renderer.getCamera().animatedReset({ duration: 240 })
}

function reduceNode(nodeId: string, data: Record<string, unknown>) {
  const node = props.nodes.find(item => item.id === nodeId)
  if (!node) return data
  const next = { ...data }
  const query = search.value.trim().toLowerCase()
  const matchesSearch = !query || node.label.toLowerCase().includes(query)
  const visibleType = enabledTypes.value.has(node.type)
  const neighbors = hoveredId.value && graph?.hasNode(hoveredId.value) ? new Set([hoveredId.value, ...(graph?.neighbors(hoveredId.value) || [])]) : null
  const inNeighborhood = !neighbors || neighbors.has(nodeId)
  if (!visibleType || !matchesSearch || !inNeighborhood) {
    next.color = '#57534e44'
    next.label = ''
    next.size = Math.max(2, Number(data.size || 4) * 0.55)
  }
  if (selectedId.value === nodeId) {
    next.size = Number(data.size || 4) * 1.8
    next.color = '#ffffff'
  }
  return next
}

function reduceEdge(data: Record<string, unknown>) {
  if (!hoveredId.value || !graph?.hasNode(hoveredId.value)) return data
  const source = String(data.source)
  const target = String(data.target)
  if (source === hoveredId.value || target === hoveredId.value) return data
  return { ...data, color: '#ffffff08', size: 0.5 }
}
</script>

<template>
  <div class="grid h-[78vh] grid-rows-[auto_1fr] gap-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.22em] text-stone-500">Graph</p>
        <h2 class="mt-2 text-2xl font-semibold text-white">Knowledge map</h2>
        <p class="mt-2 text-xs text-stone-500">{{ captureCount }} captures · {{ nodeCount }} nodes · {{ edgeCount }} links</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="search"
          class="matte-glass w-56 rounded-xl px-3 py-2 text-sm text-stone-100 outline-none"
          placeholder="Search nodes"
          @keydown.enter.prevent="focusSearch"
        >
        <button
          v-for="option in typeOptions"
          :key="option.type"
          type="button"
          class="matte-glass rounded-xl px-3 py-2 text-xs text-stone-300"
          :class="enabledTypes.has(option.type) ? 'text-white' : 'opacity-35'"
          @click="toggleType(option.type)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="grid min-h-0 gap-4 lg:grid-cols-[1fr_18rem]">
      <div class="matte-glass relative min-h-[28rem] overflow-hidden rounded-2xl">
        <div ref="container" class="absolute inset-0" />
        <div v-if="!nodeCount || graphError" class="absolute inset-0 grid place-items-center p-6 text-center">
          <div class="max-w-sm">
            <p class="text-sm font-medium text-stone-200">{{ graphError || 'No graph nodes yet' }}</p>
            <p class="mt-2 text-sm leading-6 text-stone-500">Use /examples to seed a connected Thought Vault documentation set, then open /graph again.</p>
          </div>
        </div>
      </div>
      <aside class="matte-glass overflow-auto rounded-2xl p-4">
        <div v-if="selectedNode" class="space-y-3">
          <p class="text-xs uppercase tracking-[0.18em] text-stone-600">{{ selectedNode.type }}</p>
          <h3 class="text-lg font-semibold text-white">{{ selectedNode.label }}</h3>
          <p v-if="selectedNode.preview" class="text-sm leading-6 text-stone-400">{{ selectedNode.preview }}</p>
          <code v-if="selectedNode.relativePath" class="block break-all text-xs text-stone-600">{{ selectedNode.relativePath }}</code>
          <p
            v-if="captureIdFromNode(selectedNode.id)"
            class="cursor-default text-sm text-teal-300"
            @click="emit('openCapture', captureIdFromNode(selectedNode.id))"
          >
            open capture
          </p>
        </div>
        <p v-else class="text-sm text-stone-500">Click a node to inspect it. Hover to isolate its neighborhood.</p>
      </aside>
    </div>
  </div>
</template>
