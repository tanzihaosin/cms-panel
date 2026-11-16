<script setup lang="ts">
import { ru } from '@nuxt/ui/locale'

const colorMode = useColorMode()
const config = useRuntimeConfig()
const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

function resetDemo() {
  try { localStorage.removeItem('cms-panel-demo-v1') } catch { /* Состояние в памяти сбросится при перезагрузке. */ }
  window.location.assign(config.app.baseURL)
}

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [{ rel: 'icon', type: 'image/png', href: `${useRuntimeConfig().app.baseURL.replace(/\/+$/, '')}/logo.png` }],
  htmlAttrs: { lang: 'ru' },
  titleTemplate: title => title ? `${title} · CMS Panel` : 'CMS Panel'
})
</script>

<template>
  <UApp :locale="ru">
    <NuxtLoadingIndicator />

    <div :class="config.public.demo ? 'fixed inset-0 flex flex-col' : ''">
      <div :class="config.public.demo ? 'relative min-h-0 flex-1' : ''">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </div>

      <div v-if="config.public.demo" class="shrink-0 bg-primary px-4 py-2 text-center text-sm font-medium text-white">
        Демо с вымышленными данными. Изменения сохраняются только в этом браузере и не влияют на реальные сайты.
        <button type="button" class="ml-2 underline" @click="resetDemo">Сбросить демо</button>
      </div>
    </div>
  </UApp>
</template>
