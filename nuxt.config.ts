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
    prerender: { routes: ['/about'] },
    // This app is fully prerendered (no server routes), so `generate` never
    // emits a Worker script. Left at its default, Nitro's cloudflare-module
    // preset still unconditionally points `main` at a `.output/server/index.mjs`
    // that doesn't exist, breaking deploy. Disabling deployConfig stops Nitro
    // from overriding the committed `wrangler.jsonc`, which is assets-only.
    // No Worker script is emitted (see above), so Node.js compat is moot;
    // set explicitly to silence Nitro's misleading warning about it.
    cloudflare: { deployConfig: false, nodeCompat: false }
  }
})
