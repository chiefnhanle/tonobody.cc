// Renders the page's text as a cozy "captured" snapshot — a deliberate,
// user-triggered export (via /capture), not automatic persistence. Nothing
// here touches a server; the image is built and downloaded entirely
// client-side, styled like a gentle surveillance-still: soft vignette, faint
// grain, viewfinder corner brackets, and a camera-style date stamp — but warm
// and handwritten rather than clinical.

export interface CaptureColors {
  bg: string
  text: string
  ink: string
  chip: string
  accentA: string
  accentB: string
  accentC: string
}

const WIDTH = 960
const PADDING = 64
const MIN_HEIGHT = 640
const LINE_HEIGHT = 40
const FONT = '28px "Patrick Hand", cursive'
const STAMP_FONT = '16px ui-monospace, monospace'
const STAMP_COLOR = '#ff7a45' // fixed "camera LED" orange — deliberately theme-independent
const BAR_HEIGHT = 10
const BAR_TOP = 40

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim().length === 0) {
      lines.push('')
      continue
    }
    let current = ''
    for (const word of paragraph.split(' ')) {
      const attempt = current ? `${current} ${word}` : word
      if (current && ctx.measureText(attempt).width > maxWidth) {
        lines.push(current)
        current = word
      } else {
        current = attempt
      }
    }
    lines.push(current)
  }
  return lines
}

function drawCornerBrackets(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const inset = 28
  const arm = 32
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  const corners: Array<[number, number, number, number]> = [
    [inset, inset, 1, 1],
    [width - inset, inset, -1, 1],
    [inset, height - inset, 1, -1],
    [width - inset, height - inset, -1, -1]
  ]
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath()
    ctx.moveTo(x, y + arm * dy)
    ctx.lineTo(x, y)
    ctx.lineTo(x + arm * dx, y)
    ctx.stroke()
  }
}

// A thin echo of the on-page momentum bar, so the snapshot captures how full
// it was at the moment of capture, not just the words.
function drawMomentumBar(ctx: CanvasRenderingContext2D, width: number, progress: number, colors: CaptureColors) {
  const trackX = PADDING
  const trackWidth = width - PADDING * 2
  const radius = BAR_HEIGHT / 2

  ctx.fillStyle = colors.chip
  ctx.beginPath()
  ctx.roundRect(trackX, BAR_TOP, trackWidth, BAR_HEIGHT, radius)
  ctx.fill()

  const fillWidth = trackWidth * (Math.min(Math.max(progress, 0), 100) / 100)
  if (fillWidth <= 0) return

  const gradient = ctx.createLinearGradient(trackX, 0, trackX + trackWidth, 0)
  gradient.addColorStop(0, colors.accentA)
  gradient.addColorStop(0.55, colors.accentB)
  gradient.addColorStop(1, colors.accentC)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.roundRect(trackX, BAR_TOP, fillWidth, BAR_HEIGHT, radius)
  ctx.fill()
}

function drawGrain(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const dots = Math.floor((width * height) / 900)
  for (let i = 0; i < dots; i++) {
    const shade = Math.random() < 0.5 ? 255 : 0
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${(Math.random() * 0.05).toFixed(3)})`
    ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1)
  }
}

function timestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}  ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/** Build the snapshot canvas. Call `document.fonts.load` first isn't required — this does it. */
export async function renderCaptureCanvas(text: string, progress: number, colors: CaptureColors): Promise<HTMLCanvasElement> {
  await document.fonts.load(FONT)

  const measurer = document.createElement('canvas').getContext('2d')
  if (!measurer) throw new Error('2D canvas context unavailable')
  measurer.font = FONT
  const maxTextWidth = WIDTH - PADDING * 2
  const lines = wrapLines(measurer, text, maxTextWidth)
  const height = Math.max(MIN_HEIGHT, lines.length * LINE_HEIGHT + PADDING * 2 + 56)

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')

  // Soft rounded frame in the active color scheme's background.
  ctx.fillStyle = colors.bg
  ctx.beginPath()
  ctx.roundRect(0, 0, WIDTH, height, 32)
  ctx.fill()
  ctx.clip()

  // Gentle vignette.
  const vignette = ctx.createRadialGradient(
    WIDTH / 2, height / 2, Math.min(WIDTH, height) * 0.3,
    WIDTH / 2, height / 2, Math.max(WIDTH, height) * 0.75
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.28)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, WIDTH, height)

  drawGrain(ctx, WIDTH, height)
  drawCornerBrackets(ctx, WIDTH, height, colors.ink)
  drawMomentumBar(ctx, WIDTH, progress, colors)

  // The note itself.
  ctx.fillStyle = colors.text
  ctx.font = FONT
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  let y = PADDING + LINE_HEIGHT
  for (const line of lines) {
    ctx.fillText(line, PADDING, y)
    y += LINE_HEIGHT
  }

  // Camera-style date stamp + a tiny "recording" mark, bottom corners.
  ctx.font = STAMP_FONT
  ctx.fillStyle = STAMP_COLOR
  ctx.textAlign = 'right'
  ctx.fillText(timestamp(), WIDTH - 36, height - 36)

  ctx.beginPath()
  ctx.arc(36, height - 40, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.textAlign = 'left'
  ctx.fillText('tonobody.cc', 48, height - 34)

  return canvas
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
