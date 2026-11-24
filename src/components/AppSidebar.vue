<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/appStore.js'

const store = useAppStore()

const navItems = [
  { key: 'explore', icon: '◈', label: '探索任務' },
  { key: 'community', icon: '☷', label: '任務交流' },
  { key: 'friends', icon: '☏', label: '好友動態' },
  { key: 'profile', icon: '◎', label: '我的足跡' },
]

const selfName = computed(() => store.state.profile?.name || '林以安')
const selfAvatar = computed(() => store.state.profile?.avatar || '')

function isActive(key) {
  if (store.page.value === 'taskdetail') return key === 'community'
  if (store.page.value === 'friendprofile') return key === 'friends'
  if (store.page.value === 'publish') return key === 'explore'
  return store.page.value === key
}

function hasUnread(key) {
  if (key === 'community') return store.hasUnreadTaskActivity.value
  if (key === 'friends') return store.hasIncomingFriendRequest.value
  return false
}

function ariaLabel(item) {
  if (item.key === 'community' && store.hasUnreadTaskActivity.value) {
    return '任務交流，有未讀動態'
  }
  if (item.key === 'friends' && store.hasIncomingFriendRequest.value) {
    return '好友動態，有待處理好友申請'
  }
  return item.label
}
</script>

<template>
  <aside
    class="fixed inset-x-0 bottom-0 z-30 border-t border-[#e3e3e3] bg-[#fbfbfb] px-1.5 pt-1.5 pb-[calc(7px+env(safe-area-inset-bottom))] sm:inset-y-0 sm:right-auto sm:flex sm:w-[190px] sm:flex-col sm:border-t-0 sm:border-r sm:bg-[#f3f3f3] sm:px-[18px] sm:py-[30px] lg:w-[232px] lg:px-6 lg:py-[38px] select-none"
  >
    <a
      href="#explore"
      class="hidden text-[34px] font-black leading-none tracking-[-2px] text-[#141414] sm:block"
      @click.prevent="store.nav('explore')"
    >
      wantoo
      <span class="mt-3.5 block text-xs font-semibold tracking-[4px]">我也要 ↗</span>
    </a>

    <nav
      aria-label="主要導覽"
      class="flex justify-around gap-0 sm:mt-8 sm:grid sm:gap-2.5"
    >
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        :aria-label="ariaLabel(item)"
        class="relative flex min-h-[44px] min-w-[57px] flex-col items-center justify-center gap-0 rounded-[10px] border-0 px-2 py-1 text-lg transition-colors sm:min-w-0 sm:flex-row sm:justify-start sm:gap-3.5 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-left sm:text-[15px]"
        :class="
          isActive(item.key)
            ? 'bg-[#161616] text-white hover:bg-[#161616]'
            : 'bg-transparent text-[#141414] hover:bg-[#e8e8e8]'
        "
        @click="store.nav(item.key)"
      >
        <span aria-hidden="true">{{ item.icon }}</span>
        <span class="text-[10px] sm:text-[15px]">{{ item.label }}</span>
        <span
          v-if="hasUnread(item.key)"
          class="absolute top-1.5 right-2.5 h-2 w-2 rounded-full border sm:top-2.5 sm:right-3"
          :class="
            isActive(item.key)
              ? 'border-[#111111] bg-white'
              : 'border-white bg-[#111111]'
          "
        />
      </button>
    </nav>

    <div class="mt-auto hidden items-center gap-3 text-xs sm:flex">
      <button
        type="button"
        aria-label="查看我的帳號選項"
        class="grid h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-full border-0 bg-[#e6e6e6] p-0 text-sm font-medium text-[#141414] transition-opacity hover:opacity-85"
        @click="store.openAccountModal('林以安')"
      >
        <img
          v-if="selfAvatar"
          :src="selfAvatar"
          :alt="selfName"
          class="h-full w-full object-cover"
        />
        <span v-else>{{ selfName[0] }}</span>
      </button>
      <div class="truncate font-medium text-[#141414]">{{ selfName }}</div>
    </div>
  </aside>
</template>
