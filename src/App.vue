<script setup>
import { computed, onMounted } from 'vue'
import { useAppStore } from './stores/appStore.js'
import { initPwa } from './composables/usePwa.js'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'
import AppModalHost from './components/AppModalHost.vue'
import AppToast from './components/AppToast.vue'
import PwaInstallBanner from './components/PwaInstallBanner.vue'
import AuthView from './views/AuthView.vue'
import ExploreView from './views/ExploreView.vue'
import PublishView from './views/PublishView.vue'
import CommunityView from './views/CommunityView.vue'
import TaskDetailView from './views/TaskDetailView.vue'
import FriendsView from './views/FriendsView.vue'
import FriendProfileView from './views/FriendProfileView.vue'
import ProfileView from './views/ProfileView.vue'

const store = useAppStore()

onMounted(() => {
  initPwa((msg) => store.showToast(msg))
})

const isExploring = computed(() => store.page.value === 'explore')
const isDetailOpen = computed(
  () => isExploring.value && store.expandedTaskId.value !== null
)
const isMessaging = computed(
  () => store.page.value === 'community' || store.page.value === 'friends'
)
// 鎖定單視窗高度的狀態（未展開的探索任務頁、任務交流頁、好友動態頁）
const isViewportLocked = computed(
  () => (isExploring.value && !isDetailOpen.value) || isMessaging.value
)
// 隱藏頂部 Header 的頁面（探索頁全裝置隱藏；對話頁於手機隱藏以騰出空間）
const showHeader = computed(() => !isExploring.value)
const showFooter = computed(() => !isExploring.value && !isMessaging.value)
</script>

<template>
  <!-- 未登入或尚未建立個人檔案 -->
  <AuthView v-if="!store.isReady.value" />

  <!-- 主工作區 -->
  <div
    v-else
    class="min-h-[100dvh] bg-[#fafafa] text-[#141414]"
    :class="isViewportLocked ? 'h-[100dvh] overflow-hidden' : ''"
  >
    <AppSidebar />

    <div
      class="sm:ml-[190px] lg:ml-[232px]"
      :class="
        isViewportLocked
          ? 'flex h-[100dvh] flex-col overflow-hidden pb-[calc(66px+env(safe-area-inset-bottom))] sm:pb-0'
          : 'min-h-[100dvh] pb-[calc(80px+env(safe-area-inset-bottom))] sm:pb-0'
      "
    >
      <AppHeader
        v-if="showHeader"
        :class="isMessaging ? 'hidden sm:flex' : 'flex'"
      />

      <main
        :class="
          isViewportLocked
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
            : isExploring && isDetailOpen
              ? 'flex flex-col overflow-visible'
              : 'min-h-[78vh]'
        "
      >
        <ExploreView v-if="store.page.value === 'explore'" />
        <PublishView v-else-if="store.page.value === 'publish'" />
        <CommunityView v-else-if="store.page.value === 'community'" />
        <TaskDetailView v-else-if="store.page.value === 'taskdetail'" />
        <FriendsView v-else-if="store.page.value === 'friends'" />
        <FriendProfileView v-else-if="store.page.value === 'friendprofile'" />
        <ProfileView v-else-if="store.page.value === 'profile'" />
      </main>

      <footer
        v-if="showFooter"
        class="px-5 py-5 text-[10px] text-[#737373] sm:px-[5%] sm:py-6 sm:text-[11px]"
      >
        V1.0 互動原型 · 資料僅儲存在此瀏覽器 · 無真實後端
      </footer>
    </div>
  </div>

  <!-- PWA 手機加入主畫面懸浮提示 -->
  <PwaInstallBanner />

  <!-- 全域彈窗與 Toast -->
  <AppModalHost />
  <AppToast />
</template>
