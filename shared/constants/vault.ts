export const APP_VERSION = '0.1.0'
export const APP_SOURCE = 'thought-vault-local'
export const CAPTURE_SCHEMA_VERSION = 1
export const DEFAULT_MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024

export const VAULT_DIRECTORIES = [
  '00-inbox/ready',
  '00-inbox/processing',
  '00-inbox/processed',
  '00-inbox/attachments',
  '01-concepts',
  '02-projects',
  '03-sources',
  '04-questions',
  '05-claims',
  '06-methods',
  '07-output',
  '90-proposals/pending',
  '90-proposals/approved',
  '.thought-vault'
] as const

export const ALLOWED_ATTACHMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.md', '.docx', '.xlsx', '.pptx', '.csv', '.json'] as const
export const ALLOWED_ATTACHMENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'application/json'
] as const
