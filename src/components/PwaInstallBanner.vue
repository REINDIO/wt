<script setup>
import { usePwa } from '../composables/usePwa.js'
import { useAppStore } from '../stores/appStore.js'

const pwa = usePwa()
const store = useAppStore()
const iconSrc = `${import.meta.env.BASE_URL}icons/icon-192x192.png`

function onInstall() {
  pwa.triggerInstall(() => store.openModal('pwaInstall'))
}
</script>

<template>
  <div
    v-if="pwa.shouldShowBanner.value"
    class="fixed right-3 left-3 z-20 mx-auto flex max-w-[480px] items-center gap-3 rounded-2xl border border-[#e3e3e3] bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:right-5 sm:bottom-5 sm:left-auto"
    :class="
      store.isReady.value
        ? 'bottom-[calc(78px+env(safe-area-inset-bottom))]'
        : 'bottom-[calc(16px+env(safe-area-inset-bottom))]'
    "
  >
    <img
      :src="iconSrc"
      alt="WANTOO"
      class="h-10 w-10 shrink-0 rounded-xl"
    />
    <div class="min-w-0 flex-1">
      <strong class="block truncate text-xs font-bold text-[#141414]">
        加入主畫面捷徑
      </strong>
      <small class="block truncate text-[11px] text-[#737373]">
        {{ pwa.isIOS.value ? 'Safari 分享 → 加入主畫面' : '全螢幕 App 體驗與離線開啟' }}
      </small>
    </div>
    <button
      type="button"
      class="min-h-[36px] shrink-0 rounded-xl border border-[#161616] bg-[#161616] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#333333]"
      @click="onInstall"
    >
      {{ pwa.canDirectInstall.value ? '安裝' : '教學' }}
    </button>
    <button
      type="button"
      aria-label="關閉安裝提示"
      class="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent p-0 text-lg text-[#737373] hover:bg-[#ededed]"
      @click="pwa.dismissBanner()"
    >
      ×
    </button>
  </div>
</template>
