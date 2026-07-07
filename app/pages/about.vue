<script setup lang="ts">
useHead({ title: 'About — Thought Vault' })
</script>

<template>
  <section class="min-h-screen px-6 py-16 sm:px-10 lg:px-16">
    <div class="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col justify-center gap-6">
      <p class="text-sm uppercase tracking-[0.22em] text-[var(--tv-dim)]">About</p>
      <h1 class="font-doodle text-4xl text-[var(--tv-text)]">A place to empty your head.</h1>
      <p class="text-lg leading-8 text-[var(--tv-muted)]">
        Thought Vault is a scratchpad that forgets on purpose. Type out whatever's rattling around, then
        <span class="font-mono text-[var(--tv-text)]">/scrap</span> it — no save, no history, no account.
        Just a page, a moment, and a clean slate after.
      </p>
      <div class="flex flex-wrap items-center gap-4 pt-2">
        <a
          href="https://github.com/chiefnhanle/thought-vault"
          target="_blank"
          rel="noopener noreferrer"
          class="tv-doodle-panel rounded-full px-5 py-2 font-doodle text-base text-[var(--tv-text)] transition-transform hover:-rotate-1"
        >
          View the code on GitHub ↗
        </a>
        <NuxtLink
          to="/"
          class="font-doodle text-base text-[var(--tv-dim)] underline decoration-dashed underline-offset-4 hover:text-[var(--tv-text)]"
        >
          ← back to the page
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
