export interface AttachmentMetadata {
  id: string
  relativePath: string
  filename: string
  contentType: string
  sizeBytes: number
}

export interface CaptureSummary {
  id: string
  title: string
  created: string
  updated: string
  relativePath: string
  preview: string
  attachmentCount: number
  attachments: AttachmentMetadata[]
  malformed?: boolean
  warning?: string
}

export interface CaptureDetail extends CaptureSummary {
  markdown: string
  body: string
  absolutePath?: string
}

export interface AppState {
  appVersion: string
  selectedVaultRoot: string
  lastSuccessfulScanAt: string | null
  captures: CaptureSummary[]
  capturePathById: Record<string, string>
  warnings: Array<{ relativePath: string, message: string }>
}

export interface SettingsResponse {
  appVersion: string
  selectedVaultRoot: string
  maxAttachmentBytes: number
  hasVault: boolean
  serverStatus: 'online'
}
