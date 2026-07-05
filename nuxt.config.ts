export default defineNuxtConfig({
  compatibilityDate: '2026-07-05',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  future: { compatibilityVersion: 4 },
  srcDir: 'app/',
  typescript: { strict: true, typeCheck: true },
  runtimeConfig: {
    thoughtVaultRoot: process.env.THOUGHT_VAULT_ROOT || '',
    maxAttachmentBytes: Number(process.env.THOUGHT_VAULT_MAX_ATTACHMENT_BYTES || 100 * 1024 * 1024)
  }
})
