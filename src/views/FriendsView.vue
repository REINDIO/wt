<script setup>
import { computed, watch } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import InboxShell from '../components/InboxShell.vue'
import MediaGallery from '../components/MediaGallery.vue'

const store = useAppStore()

const tabs = [
  { key: 'messages', label: '訊息' },
  { key: 'activity', label: '動態' },
  { key: 'list', label: '好友名單' },
]

const accepted = computed(() => store.acceptedFriends.value)
const requests = computed(() => store.friendRequests.value)

watch(
  accepted,
  (list) => {
    if (
      store.activeFriend.value &&
      !list.some((f) => f.name === store.activeFriend.value)
    ) {
      store.activeFriend.value = null
    }
  },
  { immediate: true }
)

const dmItems = computed(() =>
  accepted.value.map((f) => ({
    key: 'dm-' + f.name,
    name: f.name,
    icon: f.name[0],
    media: null,
    unread: false,
    label: '好友',
  }))
)

const activityPosts = computed(() => {
  const names = new Set(accepted.value.map((f) => f.name))
  return store.state.tasks
    .flatMap((t) =>
      (t.feed || [])
        .filter((f) => names.has(f.name) && f.public === true)
        .map((f) => ({ ...f, title: t.title }))
    )
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
})

function switchTab(tabKey) {
  store.activeFriend.value = null
  store.editingFriends.value = false
  store.friendsTab.value = tabKey
}
</script>

<template>
  <div
    class="mx-auto flex min-h-0 w-full max-w-[1100px] flex-1 flex-col gap-2.5 overflow-hidden px-2 pt-[calc(6px+env(safe-area-inset-top))] pb-1.5 sm:px-3 sm:py-3 lg:px-6 lg:py-4"
  >
    <!-- 頂部標題與三頁籤 -->
    <div class="relative shrink-0">
      <strong class="block px-1 py-1.5 pr-12 text-base font-bold text-[#141414]">
        好友動態
        <small class="ml-2 text-xs font-normal text-[#737373]">
          {{ accepted.length }} 位好友
        </small>
      </strong>

      <button
        v-if="store.friendsTab.value === 'list'"
        type="button"
        :aria-label="store.editingFriends.value ? '完成編輯' : '編輯好友名單'"
        :title="store.editingFriends.value ? '完成編輯' : '編輯好友名單'"
        :aria-pressed="String(store.editingFriends.value)"
        class="absolute top-0 right-0 grid h-9 min-w-[44px] place-items-center rounded-xl border-0 bg-transparent px-2 text-xs text-[#141414] hover:bg-[#ededed]"
        @click="store.editingFriends.value = !store.editingFriends.value"
      >
        <span v-if="store.editingFriends.value" class="font-medium">完成</span>
        <svg
          v-else
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="h-5 w-5 fill-none stroke-current"
          stroke-width="1.7"
          stroke-linejoin="round"
        >
          <path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z" />
        </svg>
      </button>

      <div class="grid grid-cols-3 border-b border-[#e3e3e3]">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="min-h-[42px] rounded-none border-0 border-b-2 bg-transparent px-1 py-2 text-[13px] transition-colors"
          :class="
            store.friendsTab.value === tab.key
              ? 'border-[#111111] font-bold text-[#141414]'
              : 'border-transparent text-[#737373] hover:text-[#141414]'
          "
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span
            v-if="tab.key === 'list' && store.hasIncomingFriendRequest.value"
            aria-label="有待處理申請"
            class="ml-1.5 inline-block h-[7px] w-[7px] rounded-full bg-current align-middle"
          />
        </button>
      </div>
    </div>

    <!-- 訊息分頁 -->
    <InboxShell
      v-if="store.friendsTab.value === 'messages'"
      :items="dmItems"
      :selected-key="store.activeFriend.value ? 'dm-' + store.activeFriend.value : null"
      kind="friend"
      @select="store.activeFriend.value = $event.slice(3)"
      @back="store.activeFriend.value = null"
    />

    <!-- 動態分頁 -->
    <section
      v-else-if="store.friendsTab.value === 'activity'"
      class="min-h-0 flex-1 overflow-y-auto px-1"
    >
      <template v-if="activityPosts.length">
        <article
          v-for="(post, idx) in activityPosts"
          :key="post.id || idx"
          class="border-b border-[#e3e3e3] px-1 py-4"
        >
          <strong class="text-sm font-semibold text-[#141414]">
            {{ store.displayName(post.name) }}
          </strong>
          <small class="mt-0.5 block text-xs text-[#737373]">
            {{ post.title }} · {{ (post.time || '').slice(0, 10) }}
          </small>
          <p class="my-2.5 text-sm leading-relaxed whitespace-pre-wrap text-[#141414]">
            {{ post.text }}
          </p>
          <MediaGallery :items="post.media || []" />
        </article>
      </template>
      <p
        v-else
        class="mt-4 rounded-[18px] border border-dashed border-[#e3e3e3] p-10 text-center text-sm text-[#737373]"
      >
        目前沒有好友公開的完成分享
      </p>
    </section>

    <!-- 好友名單分頁（頂部顯示待處理申請） -->
    <section v-else class="min-h-0 flex-1 overflow-y-auto px-1">
      <!-- 申請列表 -->
      <div
        v-for="req in requests"
        :key="'req-' + req.name"
        class="flex min-h-[64px] flex-nowrap items-center gap-2 border-b border-[#e3e3e3] py-2"
      >
        <button
          type="button"
          :aria-label="'查看' + req.name + '的帳號選項'"
          class="grid h-10 w-10 shrink-0 place-items-center rounded-full border-0 bg-[#eeeeee] p-0 text-base text-[#141414] hover:opacity-80"
          @click="store.openAccountModal(req.name)"
        >
          {{ req.name[0] }}
        </button>

        <div class="min-w-0 flex-1">
          <strong class="block truncate text-sm font-semibold text-[#141414]">
            {{ store.displayName(req.name) }}
          </strong>
          <small class="block truncate text-[11px] text-[#737373]">
            <template v-if="req.state === 'incoming'">
              想與你成為好友
              <span
                aria-label="待處理"
                class="ml-1 inline-block h-[7px] w-[7px] rounded-full bg-current align-middle"
              />
            </template>
            <template v-else>已送出申請，等待對方同意</template>
          </small>
        </div>

        <div
          v-if="req.state === 'incoming'"
          class="flex shrink-0 items-center justify-end gap-0"
        >
          <button
            type="button"
            aria-label="同意"
            title="同意"
            class="grid h-11 w-11 place-items-center rounded-full border-0 bg-transparent p-2.5 text-[#141414] hover:bg-[#eeeeee]"
            @click="store.handleFriendAction(req.name, 'accept')"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              class="h-[21px] w-[21px] fill-none stroke-current"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="婉拒"
            title="婉拒"
            class="grid h-11 w-11 place-items-center rounded-full border-0 bg-transparent p-2.5 text-[#141414] hover:bg-[#eeeeee]"
            @click="store.handleFriendAction(req.name, 'decline')"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              class="h-[21px] w-[21px] fill-none stroke-current"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="查看個人頁"
            title="查看個人頁"
            class="grid h-11 w-11 place-items-center rounded-full border-0 bg-transparent p-2.5 text-[#141414] hover:bg-[#eeeeee]"
            @click="store.openFriendProfile(req.name, 'friends')"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              class="h-[21px] w-[21px] fill-none stroke-current"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
            </svg>
          </button>
        </div>

        <div v-else class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="min-h-[38px] rounded-xl border border-[#e3e3e3] bg-white px-2.5 py-1.5 text-xs text-[#141414] hover:bg-[#ededed]"
            @click="store.handleFriendAction(req.name, 'cancel')"
          >
            取消
          </button>
          <button
            type="button"
            class="min-h-[38px] rounded-xl border-0 bg-transparent px-2 py-1.5 text-xs text-[#737373] hover:bg-[#ededed] hover:text-[#141414]"
            @click="store.handleFriendAction(req.name, 'simulate')"
          >
            原型：模擬對方同意
          </button>
        </div>
      </div>

      <!-- 已成為好友名單 -->
      <template v-if="accepted.length">
        <div
          v-for="f in accepted"
          :key="'friend-' + f.name"
          class="flex min-h-[64px] flex-nowrap items-center gap-2 border-b border-[#e3e3e3] py-2"
        >
          <button
            type="button"
            :aria-label="'查看' + f.name + '的帳號選項'"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border-0 bg-[#eeeeee] p-0 text-base text-[#141414] hover:opacity-80"
            @click="store.openAccountModal(f.name)"
          >
            {{ f.name[0] }}
          </button>

          <div class="min-w-0 flex-1">
            <strong class="block truncate text-sm font-semibold text-[#141414]">
              {{ store.displayName(f.name) }}
            </strong>
          </div>

          <div class="flex shrink-0 items-center justify-end gap-0">
            <button
              v-if="store.editingFriends.value"
              type="button"
              :aria-label="'刪除' + f.name + '好友'"
              title="刪除好友"
              class="grid h-11 w-11 place-items-center rounded-full border-0 bg-transparent p-2.5 text-[#141414] hover:bg-[#eeeeee]"
              @click="store.openModal('confirmRemoveFriend', { name: f.name })"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                class="h-[21px] w-[21px] fill-none stroke-current"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"
                />
              </svg>
            </button>
            <template v-else>
              <button
                type="button"
                aria-label="傳訊息"
                title="傳訊息"
                class="grid h-11 w-11 place-items-center rounded-full border-0 bg-transparent p-2.5 text-[#141414] hover:bg-[#eeeeee]"
                @click="store.openFriendChat(f.name)"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  class="h-[21px] w-[21px] fill-none stroke-current"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 11a8 8 0 0 1-8 8H4l-2 3V11a9 9 0 0 1 18 0Z" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="查看個人頁"
                title="查看個人頁"
                class="grid h-11 w-11 place-items-center rounded-full border-0 bg-transparent p-2.5 text-[#141414] hover:bg-[#eeeeee]"
                @click="store.openFriendProfile(f.name, 'friends')"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  class="h-[21px] w-[21px] fill-none stroke-current"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                </svg>
              </button>
            </template>
          </div>
        </div>
      </template>

      <p
        v-else
        class="mt-4 rounded-[18px] border border-dashed border-[#e3e3e3] p-10 text-center text-sm text-[#737373]"
      >
        尚無好友，雙方同意後會顯示在這裡。
      </p>
    </section>
  </div>
</template>
