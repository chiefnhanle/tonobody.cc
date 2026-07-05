import { APP_VERSION } from '../../shared/constants/vault'

export default defineEventHandler(() => ({ ok: true, appVersion: APP_VERSION, serverStatus: 'online' }))
