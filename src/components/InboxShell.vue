<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import { personalOpen, formatShortTime } from '../utils/helpers.js'
import MediaTag from './MediaTag.vue'
import MediaGallery from './MediaGallery.vue'
import MediaEditor from './MediaEditor.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  selectedKey: {
    type: String,
    default: null,
  },
  kind: {
    type: String,
    required: true, // 'group' | 'friend'
  },
})

const emit = defineEmits(['select', 'back', 'open-task-detail'])

const store = useAppStore()
const messagesRef = ref(null)
const messageInput = ref('')
const chatMedia = ref([])
const mediaBusy = ref(false)

const activeItem = computed(
  () => props.items.find((i) => i.key === props.selectedKey) || null
)

const activeTask = computed(() => {
  if (props.kind !== 'group' || !activeItem.value) return null
  return (
    store.state.tasks.find((t) => 'task-' + t.id === activeItem.value.key) || null
  )
})

const personalFeed = computed(() => {
  if (!activeTask.value || activeTask.value.type !== 'personal') return []
  return (activeTask.value.feed || []).filter((f) => f.shared !== false)
})

const chatMessages = computed(() => {
  if (!activeItem.value) return []
  return store.state.messages[activeItem.value.key] || []
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

watch(
  () => [props.selectedKey, chatMessages.value.length, personalFeed.value.length],
  () => {
    scrollToBottom()
  },
  { immediate: true }
)

watch(
  () => props.selectedKey,
  () => {
    messageInput.value = ''
    chatMedia.value = []
  }
)

function onSubmitMessage() {
  if (!activeItem.value) return
  if (mediaBusy.value) {
    store.showToast('影像處理中，請稍候。')
    return
  }
  const ok = store.sendMessage(activeItem.value.key, messageInput.value, chatMedia.value)
  if (ok) {
    messageInput.value = ''
    chatMedia.value = []
    scrollToBottom()
  }
}

function onPersonClick(e, name) {
  e.stopPropagation()
  store.openAccountModal(name)
}

function onPersonalSecondary() {
  if (!activeTask.value) return
  if (activeTask.value.owner === '林以安') {
    store.openModal('publishAnnouncement', { taskId: activeTask.value.id })
  } else {
    store.openModal('personalQuestions', { taskId: activeTask.value.id })
  }
}

function onPersonalComplete() {
  if (!activeTask.value) return
  if (!activeTask.value.joined || !personalOpen(activeTask.value)) {
    store.showToast('請於開放期間加入後完成。')
    return
  }
  store.openModal('completePersonal', { taskId: activeTask.value.id })
}
</script>

<template>
  <div
    class="flex min-h-0 flex-1 overflow-hidden sm:rounded-[14px] sm:border sm:border-[#e3e3e3] sm:bg-white"
  >
    <!-- 左側對話列表（手機在開啟對話時隱藏） -->
    <section
      :aria-label="kind === 'group' ? '任務交流' : '好友訊息'"
      class="w-full shrink-0 overflow-y-auto sm:w-[245px] sm:border-r sm:border-[#e3e3e3] sm:p-1.5 lg:w-[320px]"
      :class="activeItem ? 'hidden sm:block' : 'block'"
    >
      <template v-if="items.length">
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          :aria-label="'開啟' + item.name + '的對話'"
          class="relative flex h-[72px] w-full items-center gap-2.5 rounded-[9px] border-0 px-1.5 py-2.5 text-left transition-colors sm:px-2.5"
          :class="
            selectedKey === item.key
              ? 'bg-[#e8e8e8]'
              : 'bg-transparent hover:bg-[#f0f0f0]'
          "
          @click="emit('select', item.key)"
        >
          <!-- 固定圓形頭像／縮圖 -->
          <span
            v-if="item.key.startsWith('dm-')"
            role="button"
            tabindex="0"
            aria-label="查看帳號選項"
            class="relative grid h-11 w-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-[#eeeeee] text-base"
            @click="onPersonClick($event, item.name)"
            @keydown.enter.prevent="onPersonClick($event, item.name)"
            @keydown.space.prevent="onPersonClick($event, item.name)"
          >
            <MediaTag
              v-if="item.media"
              :media="item.media"
              thumbnail
              media-class="absolute inset-0 h-full w-full object-cover"
            />
            <template v-else>{{ item.icon }}</template>
          </span>
          <span
            v-else
            class="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eeeeee] text-base"
          >
            <MediaTag
              v-if="item.media"
              :media="item.media"
              thumbnail
              media-class="absolute inset-0 h-full w-full object-cover"
            />
            <template v-else>{{ item.icon }}</template>
          </span>

          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong class="truncate text-sm font-semibold text-[#141414] sm:text-[13px]">
              {{ item.name }}
            </strong>
            <span class="truncate text-xs text-[#737373]">
              {{ store.previewMessage(item.key) }}
            </span>
          </span>

          <small
            v-if="item.label"
            class="shrink-0 self-start pt-0.5 text-[10px] whitespace-nowrap text-[#737373] sm:hidden lg:block"
          >
            {{ item.label }}
          </small>
          <span
            v-if="item.unread"
            aria-label="未讀動態"
            class="h-2 w-2 shrink-0 rounded-full bg-[#111111]"
          />
        </button>
      </template>
      <div
        v-else
        class="rounded-[18px] border border-dashed border-[#e3e3e3] p-10 text-center text-sm text-[#737373]"
      >
        目前沒有對話
      </div>
    </section>

    <!-- 右側對話內容區 -->
    <section
      v-if="activeItem"
      class="flex min-h-0 min-w-0 flex-1 flex-col bg-[#fafafa] sm:bg-white"
    >
      <!-- 對話頂部 -->
      <div
        class="flex shrink-0 items-center gap-2.5 border-b border-[#e3e3e3] px-1 pt-1 pb-2 sm:px-3 sm:py-2.5"
      >
        <button
          type="button"
          aria-label="返回對話列表"
          class="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-0 bg-transparent p-0 text-base text-[#141414] hover:bg-[#ededed]"
          @click="emit('back')"
        >
          ←
        </button>

        <span
          v-if="kind === 'friend'"
          role="button"
          tabindex="0"
          aria-label="查看帳號選項"
          class="relative grid h-9 w-9 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-[#eeeeee] text-[15px]"
          @click="onPersonClick($event, activeItem.name)"
          @keydown.enter.prevent="onPersonClick($event, activeItem.name)"
          @keydown.space.prevent="onPersonClick($event, activeItem.name)"
        >
          <MediaTag
            v-if="activeItem.media"
            :media="activeItem.media"
            thumbnail
            media-class="absolute inset-0 h-full w-full object-cover"
          />
          <template v-else>{{ activeItem.icon }}</template>
        </span>
        <span
          v-else
          class="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#eeeeee] text-[15px]"
        >
          <MediaTag
            v-if="activeItem.media"
            :media="activeItem.media"
            thumbnail
            media-class="absolute inset-0 h-full w-full object-cover"
          />
          <template v-else>{{ activeItem.icon }}</template>
        </span>

        <div class="min-w-0 flex-1">
          <strong class="block truncate text-[13px] font-semibold text-[#141414]">
            {{ activeItem.name }}
          </strong>
          <small class="block text-[10px] text-[#737373]">{{ activeItem.label }}</small>
        </div>

        <button
          v-if="activeTask?.joined"
          type="button"
          class="shrink-0 whitespace-nowrap rounded-xl border-0 bg-transparent px-2.5 py-2 text-xs text-[#141414] hover:bg-[#ededed]"
          @click="emit('open-task-detail')"
        >
          任務詳情
        </button>
      </div>

      <!-- 訊息／動態列表 -->
      <div
        ref="messagesRef"
        class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1.5 py-3 sm:px-4 sm:py-4"
      >
        <!-- 未加入（待審核／未通過） -->
        <template v-if="activeTask && !activeTask.joined">
          <div
            class="max-w-[88%] self-start rounded-tr-[13px] rounded-br-[13px] rounded-bl-[13px] bg-[#f2f2f2] px-3 py-2 text-[13px] whitespace-pre-wrap break-words"
          >
            <small class="mb-0.5 block text-[10px] text-[#737373]">任務動態</small>
            {{
              activeTask.application?.status === 'pending'
                ? '申請已送出，等待發布者審核。通過後即可進入群組交流。'
                : '申請未通過，可從任務面板重新申請。'
            }}
          </div>
        </template>

        <!-- 個人任務動態牆 -->
        <template v-else-if="activeTask?.type === 'personal'">
          <template v-if="personalFeed.length">
            <div
              v-for="entry in personalFeed"
              :key="entry.id || entry.time"
              class="max-w-[88%] px-3 py-2 text-[13px] whitespace-pre-wrap break-words sm:max-w-[85%]"
              :class="
                entry.name === '林以安'
                  ? 'self-end rounded-tl-[13px] rounded-bl-[13px] rounded-br-[13px] bg-[#e8e8e8]'
                  : 'self-start rounded-tr-[13px] rounded-br-[13px] rounded-bl-[13px] bg-[#f2f2f2]'
              "
            >
              <small class="block text-[10px] text-[#737373]">
                {{ store.displayName(entry.name) }} ·
                {{ entry.kind === 'announcement' ? '公告' : '完成分享' }}
              </small>
              <p class="my-1 whitespace-pre-wrap break-words">{{ entry.text }}</p>
              <MediaGallery :items="entry.media || []" in-bubble />
              <time class="mt-1.5 block text-[10px] opacity-65">
                {{ formatShortTime(entry.time) }}
              </time>
            </div>
          </template>
          <p v-else class="text-sm text-[#737373]">尚無公告或完成分享</p>
        </template>

        <!-- 團體群組／好友私訊 -->
        <template v-else>
          <template v-if="chatMessages.length">
            <div
              v-for="(msg, idx) in chatMessages"
              :key="(msg.time || '') + idx"
              class="max-w-[88%] px-3 py-2 text-[13px] whitespace-pre-wrap break-words sm:max-w-[85%]"
              :class="
                msg.name === '林以安'
                  ? 'self-end rounded-tl-[13px] rounded-bl-[13px] rounded-br-[13px] bg-[#e8e8e8]'
                  : 'self-start rounded-tr-[13px] rounded-br-[13px] rounded-bl-[13px] bg-[#f2f2f2]'
              "
            >
              <small class="block text-[10px] text-[#737373]">
                {{ store.displayName(msg.name) }}
              </small>
              <span v-if="msg.text">{{ msg.text }}</span>
              <MediaGallery :items="msg.media || []" in-bubble />
            </div>
          </template>
          <p v-else class="text-sm text-[#737373]">尚無訊息</p>
        </template>
      </div>

      <!-- 底部動作區 -->
      <div
        v-if="activeTask && !activeTask.joined"
        class="shrink-0 border-t border-[#e3e3e3] p-3"
      >
        <button
          type="button"
          class="min-h-[44px] w-full rounded-xl border border-[#e3e3e3] bg-white px-4 py-2.5 text-sm text-[#141414] hover:bg-[#ededed]"
          @click="store.joinTask(activeTask.id)"
        >
          查看申請狀態
        </button>
      </div>

      <template v-else-if="activeTask?.type === 'personal'">
        <div class="shrink-0 border-t border-[#e3e3e3] px-3 py-1.5 text-xs text-[#737373]">
          已完成 {{ (activeTask.completions || []).length }} 次
          {{ personalOpen(activeTask) ? '' : ' · 目前非開放期間' }}
        </div>
        <div class="grid shrink-0 grid-cols-2 gap-2.5 px-3 pt-2 pb-3">
          <button
            type="button"
            class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-2 py-2.5 text-sm text-[#141414] hover:bg-[#ededed]"
            @click="onPersonalSecondary"
          >
            {{ activeTask.owner === '林以安' ? '發佈公告' : '詢問發布者' }}
          </button>
          <button
            type="button"
            :disabled="!personalOpen(activeTask)"
            class="min-h-[44px] rounded-xl border border-[#161616] bg-[#161616] px-2 py-2.5 text-sm text-white hover:bg-[#333333] disabled:opacity-50"
            @click="onPersonalComplete"
          >
            完成任務
          </button>
        </div>
      </template>

      <form
        v-else
        class="relative flex shrink-0 items-center gap-2 border-t border-[#e3e3e3] px-1 pt-2 pb-1 sm:px-3 sm:py-2.5"
        :class="chatMedia.length ? 'mt-[96px]' : ''"
        @submit.prevent="onSubmitMessage"
      >
        <div class="w-11 shrink-0">
          <MediaEditor
            v-model="chatMedia"
            :limit="3"
            compact
            @busy-change="mediaBusy = $event"
          />
        </div>
        <input
          v-model="messageInput"
          type="text"
          maxlength="1000"
          aria-label="訊息內容"
          placeholder="輸入訊息…"
          class="min-w-0 flex-1 rounded-full border border-[#e3e3e3] bg-[#fafafa] px-3.5 py-2.5 text-[16px] text-[#141414] sm:text-sm"
        />
        <button
          type="submit"
          aria-label="送出訊息"
          class="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#161616] bg-[#161616] p-0 text-xl text-white hover:bg-[#333333]"
        >
          ↑
        </button>
      </form>
    </section>

    <!-- 桌機未選取對話時的佔位畫面 -->
    <div
      v-else
      aria-hidden="true"
      class="hidden flex-1 place-items-center text-[32px] text-[#d1d1d1] sm:grid"
    >
      ☏
    </div>
  </div>
</template>
