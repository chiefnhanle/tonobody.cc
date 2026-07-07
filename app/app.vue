<script setup lang="ts">
const { theme } = useColorScheme()

const htmlStyle = computed(() => {
  const vars = Object.entries(theme.value.vars).map(([key, value]) => `${key}:${value}`).join(';')
  return `${vars};color-scheme:${theme.value.isDark ? 'dark' : 'light'}`
})

useHead({
  title: 'tonobody.cc',
  titleTemplate: (title) => (title && title !== 'tonobody.cc' ? `${title} — tonobody.cc` : 'tonobody.cc'),
  htmlAttrs: { style: htmlStyle },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap' }
  ]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
