<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import { TASK_TYPES } from '../data/seed.js'
import MediaTag from '../components/MediaTag.vue'

const store = useAppStore()

const name = computed(() => store.viewingFriendName.value || '')
const accounts = computed(() => store.accountsMap())

const person = computed(
  () =>
    store.state.friends.find((f) => f.name === name.value) || {
      name: name.value,
      state: 'none',
    }
)

const info = computed(() => person.value.publicProfile || {})

const records = computed(() =>
  store.state.tasks.flatMap((t) =>
    (t.feed || [])
      .filter(
        (r) => r.name === name.value && r.public === true && r.kind !== 'announcement'
      )
      .map((r) => ({ ...r, title: t.title, taskId: t.id }))
  )
)

const publicTasks = computed(() =>
  (person.value.publicParticipations || []).filter((t) => t.public === true)
)

function goBack() {
  if (store.friendProfileReturnPage.value === 'friends') {
    store.activeFriend.value = null
    store.friendsTab.value = 'list'
    store.page.value = 'friends'
  } else {
    store.page.value = store.friendProfileReturnPage.value || 'explore'
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[760px] px-3.5 py-3 sm:px-6 sm:py-[18px]">
    <section class="px-0.5 pb-4">
      <button
        type="button"
        class="mb-2 min-h-[38px] rounded-xl border-0 bg-transparent px-0 py-1.5 text-[13px] text-[#141414] hover:opacity-70"
        @click="goBack"
      >
        {{ store.friendProfileReturnPage.value === 'friends' ? '← 好友名單' : '← 返回' }}
      </button>

      <div class="mb-3.5 flex min-h-[36px] items-center justify-between sm:mb-[18px]">
        <strong class="text-[19px] tracking-[-0.5px]">
          @{{ accounts[name] || name }}
        </strong>
      </div>

      <div class="flex items-center gap-3.5 sm:gap-5">
        <button
          type="button"
          aria-label="查看帳號選項"
          class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-0 bg-[#e6e6e6] p-0 text-[23px] text-[#141414] sm:h-[84px] sm:w-[84px] sm:text-[28px]"
          @click="store.openAccountModal(name)"
        >
          <img
            v-if="info.avatar"
            :src="info.avatar"
            :alt="name + '的頭貼'"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ name[0] }}</span>
        </button>
        <div class="min-w-0 flex-1">
          <h1 class="mb-1 text-[17px] font-bold leading-snug break-words sm:text-[19px]">
            {{ store.displayName(name) }}
          </h1>
          <p class="m-0 text-xs leading-relaxed whitespace-pre-wrap break-words text-[#333333] sm:text-[13px]">
            {{ info.bio || '尚未填寫公開自介' }}
          </p>
        </div>
      </div>

      <div class="my-4 grid grid-cols-2 text-center sm:my-5">
        <div>
          <strong class="block text-lg font-semibold leading-tight sm:text-xl">
            {{ records.length }}
          </strong>
          <span class="text-[11px] text-[#737373]">紀錄</span>
        </div>
        <div>
          <strong class="block text-lg font-semibold leading-tight sm:text-xl">
            {{ publicTasks.length }}
          </strong>
          <span class="text-[11px] text-[#737373]">公開任務</span>
        </div>
      </div>

      <button
        v-if="person.state === 'friend'"
        type="button"
        class="min-h-[42px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
        @click="store.openFriendChat(name)"
      >
        傳訊息
      </button>
    </section>

    <div class="mb-2.5 flex border-y border-[#e3e3e3]">
      <button
        type="button"
        class="relative min-h-[46px] flex-1 rounded-none border-0 bg-transparent px-1 py-2 text-xs transition-colors"
        :class="
          store.friendProfileTab.value === 'journeys'
            ? 'font-semibold text-[#111111]'
            : 'text-[#737373]'
        "
        @click="store.friendProfileTab.value = 'journeys'"
      >
        旅程紀錄
        <span
          v-if="store.friendProfileTab.value === 'journeys'"
          class="absolute right-[18%] bottom-[-1px] left-[18%] h-0.5 bg-[#111111]"
        />
      </button>
      <button
        type="button"
        class="relative min-h-[46px] flex-1 rounded-none border-0 bg-transparent px-1 py-2 text-xs transition-colors"
        :class="
          store.friendProfileTab.value === 'tasks'
            ? 'font-semibold text-[#111111]'
            : 'text-[#737373]'
        "
        @click="store.friendProfileTab.value = 'tasks'"
      >
        參與任務
        <span
          v-if="store.friendProfileTab.value === 'tasks'"
          class="absolute right-[18%] bottom-[-1px] left-[18%] h-0.5 bg-[#111111]"
        />
      </button>
    </div>

    <!-- 好友旅程紀錄 -->
    <div v-if="store.friendProfileTab.value === 'journeys'" class="mx-auto max-w-[680px]">
      <template v-if="records.length">
        <button
          v-for="(r, idx) in records"
          :key="r.id || idx"
          type="button"
          class="flex w-full items-center gap-4 rounded-none border-0 border-b border-[#e3e3e3] bg-transparent py-[18px] text-left hover:opacity-80"
          @click="store.openModal('friendRecordDetail', { record: r })"
        >
          <span class="flex min-w-0 flex-1 flex-col gap-1.5">
            <strong class="line-clamp-2 text-base font-semibold leading-snug break-words">
              {{ r.title }}
            </strong>
            <span class="line-clamp-2 text-sm leading-relaxed whitespace-pre-line break-words text-[#737373]">
              {{ r.text }}
            </span>
            <small class="text-[11px] text-[#737373]">{{ (r.time || '').slice(0, 10) }}</small>
          </span>
          <span
            v-if="r.media?.length"
            class="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-lg bg-[#eeeeee]"
          >
            <MediaTag :media="r.media[0]" thumbnail media-class="h-full w-full object-cover" />
          </span>
        </button>
      </template>
      <p v-else class="py-10 text-center text-[13px] text-[#737373]">
        尚無公開旅程紀錄
      </p>
    </div>

    <!-- 好友公開參與任務 -->
    <div v-else class="grid grid-cols-3 gap-x-2 gap-y-4">
      <template v-if="publicTasks.length">
        <button
          v-for="(t, idx) in publicTasks"
          :key="idx"
          type="button"
          class="grid min-w-0 grid-rows-[auto_18px_15px] gap-1 border-0 bg-transparent p-0 text-left"
          @click="store.openModal('friendTaskDetail', { task: t })"
        >
          <span
            class="relative block aspect-square w-full overflow-hidden rounded-md bg-[#ececec]"
          >
            <MediaTag
              :media="t.media?.[0] || null"
              thumbnail
              media-class="absolute inset-0 h-full w-full object-cover"
            />
          </span>
          <strong class="block truncate text-[11px] font-semibold leading-[18px] sm:text-xs">
            {{ t.title }}
          </strong>
          <small class="block truncate text-[10px] leading-[15px] text-[#737373]">
            {{ TASK_TYPES[t.type] || '任務' }}
          </small>
        </button>
      </template>
      <p v-else class="col-span-full py-10 text-center text-[13px] text-[#737373]">
        尚無公開參與任務
      </p>
    </div>
  </div>
</template>
