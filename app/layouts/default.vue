<template>
  <div class="min-h-screen">
    <header class="border-b border-stone-200 bg-stone-50/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <NuxtLink to="/" class="text-lg font-semibold tracking-normal">Thought Vault</NuxtLink>
        <nav class="flex items-center gap-1 text-sm">
          <NuxtLink class="rounded px-3 py-2 hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:hover:bg-neutral-800" to="/">Capture</NuxtLink>
          <NuxtLink class="rounded px-3 py-2 hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:hover:bg-neutral-800" to="/inbox">Inbox</NuxtLink>
          <NuxtLink class="rounded px-3 py-2 hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:hover:bg-neutral-800" to="/settings">Settings</NuxtLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-5 py-6">
      <slot />
    </main>
  </div>
</template>
