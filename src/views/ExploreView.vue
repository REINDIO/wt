<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import { TASK_TYPES } from '../data/seed.js'
import MediaTag from '../components/MediaTag.vue'
import MediaGallery from '../components/MediaGallery.vue'
import TaskFacts from '../components/TaskFacts.vue'

const store = useAppStore()

const cardRef = ref(null)
const artRef = ref(null)
const headingRef = ref(null)
const descRef = ref(null)
const searchInputRef = ref(null)

const isLongContent = ref(false)
const detailImageHeight = ref(240)
let pointerStart = null

const taskList = computed(() => store.filteredTasks.value)

const currentTask = computed(() => {
  const len = taskList.value.length
  if (!len) return null
  const idx = ((store.cardIndex.value % len) + len) % len
  return taskList.value[idx]
})

const isExpanded = computed(
  () => !!currentTask.value && store.expandedTaskId.value === currentTask.value.id
)

const accounts = computed(() => store.accountsMap())

const joinLabel = computed(() => {
  const t = currentTask.value
  if (!t) return ''
  if (t.owner === '林以安') return '查看任務動態'
  if (t.application?.status === 'pending') return '申請審核中'
  return '＋ 我也要'
})

function measureLongContent() {
  nextTick(() => {
    const t = currentTask.value
    if (!t || !descRef.value || !headingRef.value) {
      isLongContent.value = false
      return
    }
    const d = descRef.value
    const h = headingRef.value
    isLongContent.value =
      d.scrollHeight > d.clientHeight + 1 ||
      h.scrollHeight > h.clientHeight + 1 ||
      h.scrollWidth > h.clientWidth + 1 ||
      (t.media?.length || 0) > 1 ||
      !!t.startAt ||
      t.type === 'personal'
  })
}

watch(
  () => [currentTask.value?.id, isExpanded.value],
  () => {
    measureLongContent()
  },
  { immediate: true }
)

let resizeTimer = null
function onWindowResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (!isExpanded.value) measureLongContent()
  }, 100)
}

onMounted(() => {
  window.addEventListener('resize', onWindowResize)
  measureLongContent()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  clearTimeout(resizeTimer)
})

function resetHome() {
  store.query.value = ''
  store.expandedTaskId.value = null
  store.cardIndex.value = 0
}

function onSearchInput(e) {
  store.query.value = e.target.value
  store.cardIndex.value = 0
  store.expandedTaskId.value = null
}

function clearSearch() {
  store.query.value = ''
  store.cardIndex.value = 0
  store.expandedTaskId.value = null
  nextTick(() => searchInputRef.value?.focus())
}

function toggleExpand() {
  const t = currentTask.value
  if (!t) return
  const opening = store.expandedTaskId.value !== t.id
  if (opening && artRef.value) {
    detailImageHeight.value = artRef.value.getBoundingClientRect().height || 160
  }
  store.expandedTaskId.value = opening ? t.id : null
}

function switchCard(direction) {
  store.cardIndex.value += direction
  store.expandedTaskId.value = null
  window.scrollTo(0, 0)
}

function onCardKeydown(e) {
  if (e.target !== cardRef.value) return
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    switchCard(e.key === 'ArrowRight' ? 1 : -1)
    nextTick(() => cardRef.value?.focus({ preventScroll: true }))
  }
}

function onPointerDown(e) {
  if (e.target.closest('button,a,input,video')) return
  pointerStart = { x: e.clientX, y: e.clientY }
}

function onPointerCancel() {
  pointerStart = null
}

function onPointerUp(e) {
  if (
    pointerStart &&
    Math.abs(e.clientX - pointerStart.x) > 65 &&
    Math.abs(e.clientY - pointerStart.y) < 65
  ) {
    switchCard(e.clientX < pointerStart.x ? 1 : -1)
  }
  pointerStart = null
}
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-[620px] flex-col gap-2.5 px-3.5 pt-[calc(10px+env(safe-area-inset-top))] pb-2 sm:px-6 sm:pt-[18px] sm:pb-4"
    :class="isExpanded ? 'flex-none overflow-visible' : 'min-h-0 flex-1 overflow-hidden'"
  >
    <!-- 頂部原位搜尋工具列 -->
    <div class="flex w-full shrink-0 items-center gap-2 sm:gap-3">
      <a
        href="#explore"
        aria-label="WANTOO 首頁"
        class="flex min-h-[44px] min-w-[39px] items-center text-[30px] font-black leading-none tracking-[-3px] text-[#111111] sm:min-w-[44px] sm:text-[35px]"
        @click.prevent="resetHome"
      >
        w<span class="mt-[3px] self-start text-[19px] tracking-normal">↗</span>
      </a>

      <form
        role="search"
        class="flex h-[44px] min-w-0 flex-1 items-center gap-1 rounded-xl border border-[#e3e3e3] bg-white px-2 sm:h-[46px] sm:gap-2 sm:px-2.5"
        @submit.prevent="searchInputRef?.blur()"
      >
        <span aria-hidden="true" class="text-[22px] text-[#737373] sm:text-[25px]">⌕</span>
        <input
          ref="searchInputRef"
          :value="store.query.value"
          type="search"
          aria-label="搜尋編號、任務關鍵字或帳號名稱"
          placeholder="搜尋編號、任務、帳號"
          autocomplete="off"
          class="min-w-0 flex-1 border-0 bg-transparent py-2 text-[16px] text-[#141414] placeholder:text-xs focus:outline-none sm:text-[13px]"
          @input="onSearchInput"
        />
        <button
          v-show="store.query.value"
          type="button"
          aria-label="清除搜尋"
          class="grid h-10 w-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent p-0 text-[21px] text-[#737373] hover:bg-[#ededed]"
          @click="clearSearch"
        >
          ×
        </button>
      </form>

      <button
        type="button"
        aria-label="發布任務"
        title="發布任務"
        class="grid h-[44px] min-w-[40px] shrink-0 place-items-center rounded-xl border-0 bg-[#161616] p-0 text-[26px] leading-none text-white transition-colors hover:bg-[#333333] sm:min-w-[44px]"
        @click="store.nav('publish')"
      >
        ＋
      </button>
    </div>

    <!-- 帳號搜尋結果 -->
    <div
      v-if="store.matchedAccounts.value.length"
      class="flex max-h-[60px] shrink-0 gap-1.5 overflow-x-auto"
    >
      <button
        v-for="name in store.matchedAccounts.value"
        :key="name"
        type="button"
        class="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-[#e3e3e3] bg-white px-2.5 py-1 text-xs text-[#141414] hover:bg-[#ededed]"
        @click="store.openAccountModal(name)"
      >
        <span
          class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eeeeee] text-xs"
        >
          {{ name[0] }}
        </span>
        <span>
          {{ store.displayName(name) }}
          <small class="text-[10px] text-[#737373]">@{{ accounts[name] }}</small>
        </span>
      </button>
    </div>

    <!-- 單卡探索區 -->
    <div
      class="flex w-full flex-col"
      :class="isExpanded ? 'flex-none overflow-visible' : 'min-h-0 flex-1'"
    >
      <article
        v-if="currentTask"
        ref="cardRef"
        :key="currentTask.id"
        tabindex="0"
        aria-label="任務卡，可左右滑動或使用方向鍵切換"
        class="animate-card-in flex w-full flex-col overflow-hidden rounded-[18px] border border-[#e3e3e3] bg-white shadow-[0_12px_40px_rgba(64,64,64,0.04)] touch-pan-y"
        :class="isExpanded ? 'flex-none' : 'min-h-0 flex-1'"
        @keydown="onCardKeydown"
        @pointerdown="onPointerDown"
        @pointercancel="onPointerCancel"
        @pointerup="onPointerUp"
      >
        <!-- 封面影像區 -->
        <div
          ref="artRef"
          class="relative grid place-items-center overflow-hidden bg-[#efefef]"
          :class="isExpanded ? 'flex-none' : 'min-h-0 flex-1'"
          :style="
            isExpanded
              ? {
                  height: detailImageHeight + 'px',
                  minHeight: detailImageHeight + 'px',
                }
              : {}
          "
        >
          <span
            class="absolute top-3 left-4 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#161616] sm:top-[18px] sm:left-5"
          >
            {{ TASK_TYPES[currentTask.type] || '任務' }}
          </span>
          <span
            class="absolute top-3 right-4 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] tracking-wider text-[#161616] sm:top-[18px] sm:right-5"
          >
            #{{ currentTask.id }}
          </span>
          <MediaTag
            :media="currentTask.media?.[0] || null"
            media-class="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <!-- 卡片資訊主體 -->
        <div
          :class="
            isExpanded
              ? 'flex flex-none flex-col gap-2.5 overflow-visible p-3.5 sm:p-5'
              : 'grid h-[268px] shrink-0 grid-rows-[32px_106px_90px] gap-2.5 overflow-hidden p-3.5 sm:h-[276px] sm:p-4'
          "
        >
          <!-- 發布者列 -->
          <div class="h-8 min-w-0 overflow-hidden">
            <button
              type="button"
              class="flex min-h-[32px] max-w-full items-center gap-2 border-0 bg-transparent p-0 text-xs text-[#141414] hover:opacity-75"
              @click="store.openAccountModal(currentTask.owner)"
            >
              <span
                class="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-[#eeeeee] text-[11px]"
              >
                {{ currentTask.owner[0] }}
              </span>
              <span class="truncate">{{ store.displayName(currentTask.owner) }}</span>
            </button>
          </div>

          <!-- 閱讀區（標題、中繼資料、內容與展開後詳情） -->
          <div
            :class="
              isExpanded
                ? 'flex-none overflow-visible'
                : 'grid min-w-0 grid-rows-[30px_18px_42px] gap-2 overflow-hidden'
            "
          >
            <h2
              ref="headingRef"
              class="m-0 font-bold text-[#141414]"
              :class="
                isExpanded
                  ? 'text-[21px] leading-snug whitespace-normal break-words'
                  : 'h-[30px] truncate text-[19px] leading-[30px] sm:text-[21px]'
              "
            >
              {{ currentTask.title }}
            </h2>

            <div
              class="text-[#737373]"
              :class="
                isExpanded
                  ? 'my-1 flex flex-wrap gap-x-3 gap-y-1 text-xs'
                  : 'grid h-[18px] min-w-0 grid-cols-[minmax(0,1fr)_82px_60px] items-center gap-1.5 text-[11px] leading-[18px] sm:grid-cols-[minmax(0,1fr)_88px_68px] sm:gap-2'
              "
            >
              <span class="truncate">⌖ {{ currentTask.place }}</span>
              <span class="truncate">◷ {{ currentTask.date }}</span>
              <span class="truncate">
                ◉ {{ currentTask.people
                }}{{ currentTask.capacity ? '/' + currentTask.capacity : '' }} 人
              </span>
            </div>

            <p
              ref="descRef"
              class="m-0 text-[#444444]"
              :class="
                isExpanded
                  ? 'mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words'
                  : 'line-clamp-2 h-[42px] overflow-hidden text-[13px] leading-[21px]'
              "
            >
              {{ currentTask.desc }}
            </p>

            <!-- 展開後才顯示的任務規格與多圖畫廊 -->
            <template v-if="isExpanded">
              <TaskFacts :task="currentTask" />
              <MediaGallery
                :items="(currentTask.media || []).slice(1)"
                :credit-items="currentTask.media || []"
              />
            </template>
          </div>

          <!-- 卡片底部按鈕區 -->
          <div
            class="grid grid-rows-[38px_46px] gap-1.5"
            :class="isExpanded ? 'mt-3' : 'm-0'"
          >
            <div class="flex items-center justify-between">
              <!-- 小提示：多張卡片時可點左右切換（除了滑動與方向鍵，桌機滑鼠更順手） -->
              <div
                v-if="taskList.length > 1"
                class="flex items-center gap-1 text-[11px] text-[#737373]"
              >
                <button
                  type="button"
                  aria-label="上一個任務"
                  class="grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent p-0 text-sm text-[#737373] hover:bg-[#ededed] hover:text-[#141414]"
                  @click="switchCard(-1)"
                >
                  ←
                </button>
                <span>
                  {{ (((store.cardIndex.value % taskList.length) + taskList.length) % taskList.length) + 1 }}/{{ taskList.length }}
                </span>
                <button
                  type="button"
                  aria-label="下一個任務"
                  class="grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent p-0 text-sm text-[#737373] hover:bg-[#ededed] hover:text-[#141414]"
                  @click="switchCard(1)"
                >
                  →
                </button>
              </div>
              <span v-else />

              <button
                v-show="isExpanded || isLongContent"
                type="button"
                :aria-expanded="String(isExpanded)"
                class="h-[38px] rounded-xl border-0 bg-transparent px-1 text-[13px] text-[#141414] hover:bg-[#ededed]"
                @click="toggleExpand"
              >
                {{ isExpanded ? '收合詳情 ↑' : '查看詳情 ↓' }}
              </button>
            </div>

            <button
              type="button"
              class="h-[46px] w-full rounded-[10px] border border-[#161616] bg-[#161616] px-4 text-sm font-bold text-white transition-colors hover:bg-[#333333]"
              @click="store.joinTask(currentTask.id)"
            >
              {{ joinLabel }}
            </button>
          </div>
        </div>
      </article>

      <!-- 無符合任務的空狀態 -->
      <div
        v-else
        class="rounded-[18px] border border-dashed border-[#e3e3e3] bg-white p-10 text-center text-sm text-[#737373]"
      >
        <p class="mb-3">{{ store.query.value ? '沒有符合的任務' : '目前沒有新任務' }}</p>
        <button
          type="button"
          class="min-h-[40px] rounded-xl border-0 bg-transparent px-3 py-2 text-[13px] text-[#141414] hover:bg-[#ededed]"
          @click="store.nav('community')"
        >
          前往任務交流 →
        </button>
      </div>
    </div>
  </div>
</template>
