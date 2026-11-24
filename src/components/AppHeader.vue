<script setup>
import { useAppStore } from '../stores/appStore.js'
import { usePwa } from '../composables/usePwa.js'

const store = useAppStore()
const pwa = usePwa()

function onInstallClick() {
  pwa.triggerInstall(() => store.openModal('pwaInstall'))
}
</script>

<template>
  <header
    class="flex h-[calc(44px+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-[#e3e3e3] bg-[#fafafa] px-3.5 pt-[env(safe-area-inset-top)] sm:h-[50px] sm:px-[5%] sm:pt-0"
  >
    <span class="text-[10px] tracking-[1px] text-[#737373] sm:text-[11px] sm:tracking-[2px]">
      WANTOO
    </span>

    <div class="flex items-center gap-1.5">
      <button
        v-if="pwa.swNeedRefresh.value"
        type="button"
        class="min-h-[34px] rounded-full border border-[#161616] bg-[#161616] px-3 py-1 text-xs text-white hover:bg-[#333333]"
        @click="pwa.applySwUpdate()"
      >
        更新版本
      </button>

      <button
        v-if="!pwa.isStandalone.value"
        type="button"
        class="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-[#e3e3e3] bg-white px-3 py-1 text-xs text-[#141414] transition-colors hover:bg-[#ededed]"
        @click="onInstallClick"
      >
        <span aria-hidden="true">＋</span>
        <span>加到主畫面</span>
      </button>

      <button
        type="button"
        class="min-h-[38px] rounded-xl border-0 bg-transparent px-2.5 py-1.5 text-[13px] text-[#141414] hover:bg-[#ededed]"
        @click="store.openModal('rules')"
      >
        原型說明 ↗
      </button>
    </div>
  </header>
</template>
