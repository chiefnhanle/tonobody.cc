export default defineNuxtConfig({
  compatibilityDate: '2026-07-05',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  future: { compatibilityVersion: 4 },
  srcDir: 'app/',
  typescript: { strict: true, typeCheck: true },
  nitro: {
    // /about is only reachable via a client-side slash command, not a real
    // <a>/<NuxtLink>, so the static crawler (which starts at "/" and only
    // follows discoverable links) would otherwise skip it entirely.
    prerender: { routes: ['/about'] }
  }
})
