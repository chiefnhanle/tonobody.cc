<script setup lang="ts">
import type { SettingsResponse } from '../../shared/types/capture'

const vaultPath = ref('')
const message = ref('')
const error = ref('')
const { data: settings, refresh } = await useFetch<SettingsResponse>('/api/settings')
watchEffect(() => { vaultPath.value = settings.value?.selectedVaultRoot || vaultPath.value })

async function saveVault() {
  error.value = ''
  message.value = ''
  try {
    await $fetch('/api/settings/vault', { method: 'POST', body: { path: vaultPath.value } })
    await refresh()
    message.value = 'Vault path saved. Initialise or repair the structure before capturing.'
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'Could not save vault path.'
  }
}

async function initialise() {
  error.value = ''
  message.value = ''
  try {
    await $fetch('/api/vault/initialise', { method: 'POST', body: { path: vaultPath.value } })
    await refresh()
    message.value = 'Vault structure is ready.'
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'Could not initialise vault.'
  }
}

async function repair() {
  error.value = ''
  message.value = ''
  try {
    await initialise()
    const status = await $fetch<{ captureCount: number }>('/api/vault/status')
    message.value = `Vault structure repaired and index rebuilt. Captures indexed: ${status.captureCount}.`
  } catch (caught: unknown) {
    error.value = caught instanceof Error ? caught.message : 'Could not repair vault.'
  }
}

async function revealVault() {
  await $fetch('/api/reveal', { method: 'POST', body: {} })
}
</script>

<template>
  <section class="max-w-3xl space-y-6">
    <div class="border-b border-stone-200 pb-5 dark:border-neutral-800">
      <h1 class="text-3xl font-semibold">Settings</h1>
      <p class="mt-2 text-stone-700 dark:text-stone-300">Thought Vault writes ordinary files to one local folder. OneDrive sync is optional and external; this app does not use OneDrive APIs.</p>
    </div>

    <div v-if="!settings?.hasVault" class="rounded border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">No vault is selected. Choose or create a folder before sending captures.</div>

    <div class="space-y-3 rounded border border-stone-300 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
      <label class="block">
        <span class="mb-2 block text-sm font-medium">Selected vault path</span>
        <input v-model="vaultPath" class="w-full rounded border border-stone-300 bg-white px-3 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950" placeholder="C:\Users\USERNAME\Documents\ThoughtVault">
      </label>
      <div class="flex flex-wrap gap-2">
        <button class="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-stone-100 dark:text-stone-950" @click="saveVault">Choose Vault Folder</button>
        <button class="rounded border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:hover:bg-neutral-800" @click="initialise">Create New Vault</button>
        <button class="rounded border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:hover:bg-neutral-800" @click="repair">Initialise / Repair Vault Structure</button>
        <button class="rounded border border-stone-300 px-4 py-2 text-sm hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-neutral-700 dark:hover:bg-neutral-800" :disabled="!settings?.hasVault" @click="revealVault">Open vault directory</button>
      </div>
    </div>

    <dl class="grid gap-3 rounded border border-stone-300 bg-white p-5 text-sm dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-[180px_1fr]">
      <dt class="font-medium">Application version</dt><dd>{{ settings?.appVersion }}</dd>
      <dt class="font-medium">Local server status</dt><dd>{{ settings?.serverStatus }}</dd>
      <dt class="font-medium">Current root path</dt><dd class="break-all font-mono">{{ settings?.selectedVaultRoot || 'Not selected' }}</dd>
      <dt class="font-medium">Attachment limit</dt><dd>{{ Math.round((settings?.maxAttachmentBytes || 0) / 1024 / 1024) }} MB per file</dd>
    </dl>

    <p class="text-sm text-stone-600 dark:text-stone-400">The vault remains useful without this app: Markdown files, attachment folders, AGENTS.md, CONTEXT.md, README.md, and rebuildable JSON state.</p>
    <p v-if="message" class="rounded border border-teal-300 bg-teal-50 p-3 text-sm text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100">{{ message }}</p>
    <p v-if="error" class="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">{{ error }}</p>
  </section>
</template>
