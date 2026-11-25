<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import InboxShell from '../components/InboxShell.vue'

const store = useAppStore()

const items = computed(() =>
  store.sortedActivityTasks.value.map((t) => ({
    key: 'task-' + t.id,
    name: t.title,
    icon: t.icon || t.title[0] || '◈',
    media: t.media?.[0] || null,
    unread: !!t.activityUnread,
    label: !t.joined
      ? t.application?.status === 'pending'
        ? '待審核'
        : '未通過'
      : t.type === 'personal'
        ? '任務動態'
        : '團體群組',
  }))
)
</script>

<template>
  <div
    class="mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col overflow-hidden px-2 pt-[calc(6px+env(safe-area-inset-top))] pb-1.5 sm:px-3 sm:py-3 lg:px-6 lg:py-4"
  >
    <InboxShell
      :items="items"
      :selected-key="store.activeRoom.value"
      kind="group"
      @select="store.openTaskActivity($event)"
      @back="store.activeRoom.value = null"
      @open-task-detail="store.page.value = 'taskdetail'"
    />
  </div>
</template>
