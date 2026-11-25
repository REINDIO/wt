<script setup>
import { ref } from 'vue'
import { usePwa } from '../../composables/usePwa.js'
import { useAppStore } from '../../stores/appStore.js'

const pwa = usePwa()
const store = useAppStore()
const activePlatform = ref(pwa.isIOS.value ? 'ios' : 'android')

async function installNow() {
  const accepted = await pwa.triggerInstall()
  if (accepted) {
    store.closeModal()
  }
}
</script>

<template>
  <div>
    <div class="mb-2 text-[11px] tracking-[3px] text-[#737373]">
      MOBILE SHORTCUT / PWA
    </div>
    <h2 class="mb-2 text-[22px] font-bold leading-snug">
      將 WANTOO 加入手機主畫面
    </h2>
    <p class="mb-4 text-sm text-[#737373]">
      免下載安裝包，直接建立桌面捷徑並以全螢幕 App 模式開啟，同時支援離線開啟。
    </p>

    <!-- 已安裝提示 -->
    <div
      v-if="pwa.isStandalone.value"
      class="mb-4 rounded-xl border border-[#e3e3e3] bg-[#f4f4f4] p-4 text-sm text-[#141414]"
    >
      你目前正透過主畫面捷徑模式使用 WANTOO！
    </div>

    <!-- Android / Chrome 原生一鍵安裝按鈕 -->
    <button
      v-else-if="pwa.canDirectInstall.value"
      type="button"
      class="mb-4 min-h-[48px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-3 text-sm font-semibold text-white hover:bg-[#333333]"
      @click="installNow"
    >
      一鍵加入主畫面捷徑
    </button>

    <!-- 平台步驟切換 -->
    <div class="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[#f3f3f3] p-1">
      <button
        type="button"
        class="min-h-[38px] rounded-lg border-0 text-xs font-semibold transition-colors"
        :class="
          activePlatform === 'ios'
            ? 'bg-white text-[#141414] shadow-xs'
            : 'bg-transparent text-[#737373]'
        "
        @click="activePlatform = 'ios'"
      >
        iOS (iPhone / iPad)
      </button>
      <button
        type="button"
        class="min-h-[38px] rounded-lg border-0 text-xs font-semibold transition-colors"
        :class="
          activePlatform === 'android'
            ? 'bg-white text-[#141414] shadow-xs'
            : 'bg-transparent text-[#737373]'
        "
        @click="activePlatform = 'android'"
      >
        Android (Chrome)
      </button>
    </div>

    <!-- iOS 步驟 -->
    <ol v-if="activePlatform === 'ios'" class="space-y-3 text-sm text-[#333333]">
      <li class="flex gap-3 rounded-xl border border-[#e3e3e3] bg-[#fafafa] p-3">
        <span
          class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#161616] text-xs font-bold text-white"
        >
          1
        </span>
        <div>
          <strong class="block text-[#141414]">使用 Safari 開啟此網頁</strong>
          <span class="text-xs text-[#737373]">
            iOS 僅支援透過 Safari（或 iOS 16.4+ 支援加入主畫面的瀏覽器）建立全螢幕桌面捷徑。
          </span>
        </div>
      </li>
      <li class="flex gap-3 rounded-xl border border-[#e3e3e3] bg-[#fafafa] p-3">
        <span
          class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#161616] text-xs font-bold text-white"
        >
          2
        </span>
        <div>
          <strong class="block text-[#141414]">點擊底部「分享」按鈕</strong>
          <span class="text-xs text-[#737373]">
            點擊工具列中央的分享圖示（方框加上向上箭頭 ⬆）。
          </span>
        </div>
      </li>
      <li class="flex gap-3 rounded-xl border border-[#e3e3e3] bg-[#fafafa] p-3">
        <span
          class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#161616] text-xs font-bold text-white"
        >
          3
        </span>
        <div>
          <strong class="block text-[#141414]">選擇「加入主畫面」並點「新增」</strong>
          <span class="text-xs text-[#737373]">
            桌面隨即會出現專屬 WANTOO 圖示，點開即可獨立全螢幕操作。
          </span>
        </div>
      </li>
    </ol>

    <!-- Android 步驟 -->
    <ol v-else class="space-y-3 text-sm text-[#333333]">
      <li class="flex gap-3 rounded-xl border border-[#e3e3e3] bg-[#fafafa] p-3">
        <span
          class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#161616] text-xs font-bold text-white"
        >
          1
        </span>
        <div>
          <strong class="block text-[#141414]">使用 Chrome 開啟此網頁</strong>
          <span class="text-xs text-[#737373]">
            若上方出現「一鍵加入主畫面捷徑」按鈕，直接點擊即可立即安裝。
          </span>
        </div>
      </li>
      <li class="flex gap-3 rounded-xl border border-[#e3e3e3] bg-[#fafafa] p-3">
        <span
          class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#161616] text-xs font-bold text-white"
        >
          2
        </span>
        <div>
          <strong class="block text-[#141414]">點右上角「⋮」選單</strong>
          <span class="text-xs text-[#737373]">
            選擇「安裝應用程式」或「加到主畫面」。
          </span>
        </div>
      </li>
      <li class="flex gap-3 rounded-xl border border-[#e3e3e3] bg-[#fafafa] p-3">
        <span
          class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#161616] text-xs font-bold text-white"
        >
          3
        </span>
        <div>
          <strong class="block text-[#141414]">長按桌面圖示還可使用快捷選單</strong>
          <span class="text-xs text-[#737373]">
            安裝後長按 WANTOO 圖示，即可一鍵直達探索任務、任務交流、好友動態或我的足跡。
          </span>
        </div>
      </li>
    </ol>
  </div>
</template>
