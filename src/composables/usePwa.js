import { ref, computed } from 'vue'
import { registerSW } from 'virtual:pwa-register'

// 管理 Android / iOS 加入主畫面（捷徑）偵測、安裝提示與離線快取更新

const deferredPrompt = ref(null)
const isStandalone = ref(false)
const isIOS = ref(false)
const isAndroid = ref(false)
const dismissedBanner = ref(false)
const swNeedRefresh = ref(false)
let updateSWFn = null
let initialized = false

const BANNER_DISMISS_KEY = 'wantoo-pwa-banner-dismissed'

function detectEnvironment() {
  const ua = navigator.userAgent || ''
  isStandalone.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true

  const iOSDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  isIOS.value = iOSDevice
  isAndroid.value = /Android/i.test(ua)

  try {
    dismissedBanner.value = sessionStorage.getItem(BANNER_DISMISS_KEY) === '1'
  } catch {
    dismissedBanner.value = false
  }
}

export function initPwa(onToast) {
  if (initialized) return
  initialized = true
  detectEnvironment()

  // 監聽 Android / Chromium 原生安裝事件
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    isStandalone.value = true
    onToast?.('已成功將 WANTOO 加入主畫面！')
  })

  // 監聽顯示模式改變
  const mq = window.matchMedia('(display-mode: standalone)')
  mq.addEventListener?.('change', (e) => {
    if (e.matches) isStandalone.value = true
  })

  // 註冊 PWA Service Worker（支援離線快取與版本更新）
  try {
    updateSWFn = registerSW({
      immediate: true,
      onOfflineReady() {
        onToast?.('WANTOO 已可離線開啟，加入主畫面即可像 App 使用。')
      },
      onNeedRefresh() {
        swNeedRefresh.value = true
      },
    })
  } catch {
    // 開發或非 HTTPS 環境不阻斷正常使用
  }
}

export function usePwa() {
  const canDirectInstall = computed(() => !!deferredPrompt.value && !isStandalone.value)
  const shouldShowBanner = computed(
    () => !isStandalone.value && !dismissedBanner.value && (canDirectInstall.value || isIOS.value || isAndroid.value)
  )

  async function triggerInstall(onFallbackGuide) {
    if (deferredPrompt.value) {
      const promptEvent = deferredPrompt.value
      promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') {
        deferredPrompt.value = null
        return true
      }
      return false
    }
    // iOS Safari 或尚未觸發 beforeinstallprompt 時，開啟圖文安裝教學彈窗
    onFallbackGuide?.()
    return false
  }

  function dismissBanner() {
    dismissedBanner.value = true
    try {
      sessionStorage.setItem(BANNER_DISMISS_KEY, '1')
    } catch {
      // ignore
    }
  }

  function applySwUpdate() {
    if (updateSWFn) {
      updateSWFn(true)
    }
  }

  return {
    isStandalone,
    isIOS,
    isAndroid,
    canDirectInstall,
    shouldShowBanner,
    swNeedRefresh,
    triggerInstall,
    dismissBanner,
    applySwUpdate,
  }
}
