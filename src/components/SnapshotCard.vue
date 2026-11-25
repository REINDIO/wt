<script setup>
import { useAppStore } from '../stores/appStore.js'

defineProps({
  snapshot: {
    type: Object,
    required: true,
  },
})

const { openAccountModal } = useAppStore()
</script>

<template>
  <div class="my-3 rounded-xl bg-[#fafafa] p-3.5 border border-[#e3e3e3]">
    <button
      v-if="snapshot.avatar"
      type="button"
      class="mb-2 block h-11 w-11 overflow-hidden rounded-full border-0 p-0"
      aria-label="查看報名頭貼帳號"
      @click="openAccountModal('林以安')"
    >
      <img
        :src="snapshot.avatar"
        alt="報名頭貼"
        class="h-full w-full object-cover"
      />
    </button>
    <dl class="my-2 grid grid-cols-[85px_1fr] sm:grid-cols-[110px_1fr] gap-2 text-[13px]">
      <dt class="text-[#777777]">暱稱／帳號</dt>
      <dd class="m-0 break-words">{{ snapshot.nickname }} / @{{ snapshot.handle }}</dd>

      <dt class="text-[#777777]">報名時年齡</dt>
      <dd class="m-0">{{ snapshot.age }} 歲</dd>

      <dt class="text-[#777777]">活動地區</dt>
      <dd class="m-0 break-words">{{ snapshot.regions }}</dd>

      <template v-if="snapshot.sex">
        <dt class="text-[#777777]">生理性別</dt>
        <dd class="m-0">{{ snapshot.sex }}</dd>
      </template>

      <dt class="text-[#777777]">自介</dt>
      <dd class="m-0 whitespace-pre-wrap break-words">{{ snapshot.bio || '未填寫' }}</dd>
    </dl>
    <small class="block text-[11px] text-[#737373]">版本：{{ snapshot.sentAt }}</small>
  </div>
</template>
