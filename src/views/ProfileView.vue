<script setup>
import { computed, watch } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import { TASK_TYPES } from '../data/seed.js'
import { ageOf, isRecordEntry } from '../utils/helpers.js'
import MediaTag from '../components/MediaTag.vue'
import MediaGallery from '../components/MediaGallery.vue'

const store = useAppStore()

const info = computed(() => store.state.profile || { name: '林以安', bio: '' })
const entries = computed(() => store.profileEntries.value)

watch(
  () => store.visitorMode.value,
  (isVisitor) => {
    if (isVisitor && store.profileTab.value === 'private') {
      store.profileTab.value = 'portfolio'
    }
  }
)

const tabs = computed(() => {
  const base = [
    { key: 'portfolio', label: '旅程紀錄' },
    { key: 'records', label: '參與任務' },
  ]
  if (!store.visitorMode.value) {
    base.push({ key: 'private', label: '私人空間' })
  }
  return base
})

const shownItems = computed(() => {
  if (store.profileTab.value === 'portfolio') return entries.value.journeys
  if (store.profileTab.value === 'records') {
    return entries.value.tasks
      .filter((t) => t.participationPublic !== false)
      .map((t) => ({ ...t, key: 'task:' + t.id }))
  }
  return entries.value.privateEntries
})

const selectedItem = computed(
  () => shownItems.value.find((t) => t.key === store.profileFocusKey.value) || null
)

const isJourneyMode = computed(
  () =>
    store.profileTab.value === 'portfolio' || store.profileTab.value === 'private'
)

const selectedIndex = computed(() =>
  selectedItem.value
    ? shownItems.value.findIndex((t) => t.key === selectedItem.value.key)
    : -1
)

function openItem(key) {
  store.journeyListScroll.value = window.scrollY
  store.profileFocusKey.value = key
  window.scrollTo(0, 0)
}

function closeArticle() {
  store.profileFocusKey.value = null
  setTimeout(() => window.scrollTo(0, store.journeyListScroll.value), 0)
}

function openJourneyByKey(key) {
  store.profileFocusKey.value = key
  window.scrollTo(0, 0)
}

function imageCount(list) {
  return (list || []).filter((m) => m.type !== 'video').length
}

function editCurrentJourney() {
  const sel = selectedItem.value
  if (!sel) return
  if (sel.record) {
    store.openModal('editPersonalRecord', {
      taskId: sel.id,
      recordId: sel.record.id,
    })
  } else {
    store.openModal('editResult', { taskId: sel.id })
  }
}

function onEditSelectedTask() {
  const sel = selectedItem.value
  if (!sel) return
  const task = store.state.tasks.find((t) => t.id === sel.id)
  if (!task) return
  if (task.type === 'personal') {
    if (!task.joined) {
      store.showToast('已退出此任務，請重新加入後查看動態。')
      return
    }
    store.nav('community')
    store.activeRoom.value = 'task-' + task.id
  } else {
    store.openModal('editResult', { taskId: task.id })
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[760px] px-3.5 py-3 sm:px-6 sm:py-[18px]">
    <!-- 旅程文章閱讀視圖 -->
    <article
      v-if="selectedItem && isJourneyMode"
      class="mx-auto max-w-[680px] pb-5"
    >
      <button
        type="button"
        class="min-h-[40px] rounded-xl border-0 bg-transparent px-0 py-2 text-[13px] text-[#141414] hover:opacity-70"
        @click="closeArticle"
      >
        ← 返回{{ store.profileTab.value === 'private' ? '私人空間' : '旅程紀錄' }}
      </button>

      <h1 class="mt-6 mb-2.5 text-[26px] font-bold leading-snug break-words">
        {{ selectedItem.title }}
      </h1>
      <p class="mb-2 text-sm text-[#737373]">
        {{ selectedItem.date }} · {{ info.name }}
      </p>
      <p class="border-b border-[#e3e3e3] pb-[18px] text-xs text-[#737373]">
        相關任務：{{ selectedItem.title }} · #{{ selectedItem.id }}
      </p>

      <div class="my-6 text-base leading-[1.9] whitespace-pre-wrap break-words text-[#141414]">
        {{ selectedItem.reflection || '' }}
      </div>

      <MediaGallery :items="selectedItem.resultMedia || []" />

      <button
        v-if="!store.visitorMode.value"
        type="button"
        class="mt-3 min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
        @click="editCurrentJourney"
      >
        編輯紀錄
      </button>

      <nav
        aria-label="文章導覽"
        class="mt-7 grid grid-cols-3 gap-2 border-t border-[#e3e3e3] pt-5"
      >
        <button
          type="button"
          :disabled="selectedIndex <= 0"
          class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-1.5 py-2.5 text-sm text-[#141414] hover:bg-[#ededed] disabled:opacity-50"
          @click="selectedIndex > 0 && openJourneyByKey(shownItems[selectedIndex - 1].key)"
        >
          上一篇
        </button>
        <button
          type="button"
          class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-1.5 py-2.5 text-sm text-[#141414] hover:bg-[#ededed]"
          @click="
            store.openModal('journeyToc', {
              entries: shownItems,
              currentKey: selectedItem.key,
              isPrivate: store.profileTab.value === 'private',
              onSelect: openJourneyByKey,
            })
          "
        >
          目錄
        </button>
        <button
          type="button"
          :disabled="selectedIndex >= shownItems.length - 1"
          class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-1.5 py-2.5 text-sm text-[#141414] hover:bg-[#ededed] disabled:opacity-50"
          @click="
            selectedIndex < shownItems.length - 1 &&
              openJourneyByKey(shownItems[selectedIndex + 1].key)
          "
        >
          下一篇
        </button>
      </nav>
    </article>

    <!-- 個人主頁 -->
    <template v-else>
      <section class="px-0.5 pb-4">
        <div class="mb-3.5 flex min-h-[36px] items-center justify-between sm:mb-[18px]">
          <strong class="text-[19px] tracking-[-0.5px]">
            @{{ store.currentUser.value?.handle }}
          </strong>
          <span v-if="store.visitorMode.value" class="text-[11px] text-[#737373]">
            訪客預覽
          </span>
          <div v-else class="flex items-center gap-1.5">
            <button
              type="button"
              class="min-h-[34px] rounded-full border border-[#e3e3e3] bg-white px-3.5 py-1 text-xs text-[#141414] hover:bg-[#ededed]"
              @click="store.openModal('editProfile')"
            >
              編輯資料
            </button>
            <button
              type="button"
              class="min-h-[34px] rounded-xl border-0 bg-transparent px-2.5 py-1 text-xs text-[#737373] hover:bg-[#ededed] hover:text-[#141414]"
              @click="store.signOut()"
            >
              登出
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3.5 sm:gap-5">
          <button
            type="button"
            aria-label="查看帳號選項"
            class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-0 bg-[#e6e6e6] p-0 text-[23px] text-[#141414] sm:h-[84px] sm:w-[84px] sm:text-[28px]"
            @click="store.openAccountModal('林以安')"
          >
            <img
              v-if="info.avatar"
              :src="info.avatar"
              alt="頭貼"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ (info.name || '林')[0] }}</span>
          </button>

          <div class="min-w-0 flex-1">
            <h1 class="mb-1 text-[17px] font-bold leading-snug break-words sm:text-[19px]">
              {{ info.name }}
            </h1>
            <p class="m-0 text-xs leading-relaxed whitespace-pre-wrap break-words text-[#333333] sm:text-[13px]">
              {{ info.bio }}
            </p>
          </div>
        </div>

        <!-- 僅自己可見的報名基本資料 -->
        <div
          v-if="!store.visitorMode.value"
          class="mt-4 rounded-[10px] bg-[#f4f4f4] p-3"
        >
          <small class="block text-[11px] text-[#737373]">
            僅自己可見的報名基本資料
          </small>
          <p class="my-1 text-[13px] text-[#141414]">
            {{ ageOf(info.dob) }} 歲 · {{ info.sex }} · {{ info.regions }}
          </p>
          <small class="block text-[11px] text-[#737373]">
            出生日期已確認並鎖定；完整日期不會提供給發布者。
          </small>
        </div>

        <!-- 統計 -->
        <div class="my-4 grid grid-cols-2 text-center sm:my-5">
          <div>
            <strong class="block text-lg font-semibold leading-tight sm:text-xl">
              {{ entries.journeys.length }}
            </strong>
            <span class="text-[11px] text-[#737373]">紀錄</span>
          </div>
          <div>
            <strong class="block text-lg font-semibold leading-tight sm:text-xl">
              {{ entries.tasks.filter((t) => t.participationPublic !== false).length }}
            </strong>
            <span class="text-[11px] text-[#737373]">任務</span>
          </div>
        </div>

        <button
          type="button"
          class="block min-h-[36px] w-full rounded-lg border border-[#e3e3e3] bg-white px-3 py-1.5 text-xs text-[#141414] hover:bg-[#ededed]"
          @click="
            store.visitorMode.value = !store.visitorMode.value;
            store.profileFocusKey.value = null
          "
        >
          {{ store.visitorMode.value ? '返回本人視角' : '預覽公開個人頁' }}
        </button>
      </section>

      <!-- 三個頁籤 -->
      <div
        role="tablist"
        class="mb-2.5 flex border-y border-[#e3e3e3]"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="String(tab.key === store.profileTab.value)"
          class="relative min-h-[46px] flex-1 rounded-none border-0 bg-transparent px-1 py-2 text-xs transition-colors"
          :class="
            tab.key === store.profileTab.value
              ? 'font-semibold text-[#111111]'
              : 'text-[#737373]'
          "
          @click="
            store.profileTab.value = tab.key;
            store.profileFocusKey.value = null
          "
        >
          {{ tab.label }}
          <span
            v-if="tab.key === store.profileTab.value"
            class="absolute right-[18%] bottom-[-1px] left-[18%] h-0.5 bg-[#111111]"
          />
        </button>
      </div>

      <!-- 參與任務單筆詳情 -->
      <article
        v-if="selectedItem"
        class="mx-auto max-w-[540px]"
      >
        <button
          type="button"
          class="mb-2 min-h-[40px] rounded-xl border-0 bg-transparent px-0 py-2 text-[13px] text-[#141414] hover:opacity-70"
          @click="store.profileFocusKey.value = null"
        >
          ← 返回列表
        </button>

        <div
          class="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-[#ececec]"
        >
          <MediaTag
            :media="
              isRecordEntry(selectedItem)
                ? selectedItem.resultMedia?.[0] || null
                : selectedItem.media?.[0] || null
            "
            :empty-record="isRecordEntry(selectedItem)"
            media-class="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div class="py-4">
          <div class="text-xs text-[#737373]">
            {{ TASK_TYPES[selectedItem.type] || '任務' }} · {{ selectedItem.date }}
          </div>
          <h2 class="my-3 text-[21px] font-bold leading-snug break-words">
            {{ selectedItem.title }}
          </h2>
          <p class="text-sm leading-[1.8] whitespace-pre-wrap break-words text-[#141414]">
            {{
              selectedItem.record
                ? selectedItem.reflection
                : store.profileTab.value === 'records'
                  ? selectedItem.desc
                  : selectedItem.reflection || selectedItem.desc
            }}
          </p>

          <MediaGallery
            :items="
              (isRecordEntry(selectedItem)
                ? selectedItem.resultMedia || []
                : selectedItem.media || []
              ).slice(1)
            "
          />

          <div
            v-if="!store.visitorMode.value"
            class="mt-5 flex flex-wrap gap-2.5"
          >
            <button
              v-if="selectedItem.record"
              type="button"
              class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
              @click="
                store.openModal('editPersonalRecord', {
                  taskId: selectedItem.id,
                  recordId: selectedItem.record.id,
                })
              "
            >
              編輯這次紀錄
            </button>
            <template v-else>
              <button
                type="button"
                class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
                @click="
                  store.toggleTaskParticipationPublic(selectedItem.id);
                  store.profileFocusKey.value = null
                "
              >
                {{
                  selectedItem.participationPublic === false
                    ? '公開參與任務'
                    : '隱藏任務'
                }}
              </button>
              <button
                type="button"
                class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
                @click="onEditSelectedTask"
              >
                {{ selectedItem.type === 'personal' ? '前往任務動態' : '編輯成果' }}
              </button>
            </template>
          </div>
        </div>
      </article>

      <!-- 旅程紀錄 / 私人空間閱讀列表 -->
      <div v-else-if="isJourneyMode" class="mx-auto max-w-[680px]">
        <template v-if="shownItems.length">
          <button
            v-for="item in shownItems"
            :key="item.key"
            type="button"
            class="flex w-full items-center gap-4 rounded-none border-0 border-b border-[#e3e3e3] bg-transparent py-[18px] text-left hover:opacity-80"
            @click="openItem(item.key)"
          >
            <span class="flex min-w-0 flex-1 flex-col gap-1.5">
              <strong class="line-clamp-2 text-base font-semibold leading-snug break-words">
                {{ item.title }}
              </strong>
              <span class="line-clamp-2 text-sm leading-relaxed whitespace-pre-line break-words text-[#737373]">
                {{ item.reflection || '' }}
              </span>
              <small class="text-[11px] text-[#737373]">
                {{ item.date }} · {{ TASK_TYPES[item.type] || '任務' }} · #{{ item.id }}
              </small>
            </span>
            <span
              v-if="item.resultMedia?.length"
              class="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-lg bg-[#eeeeee]"
            >
              <MediaTag
                :media="item.resultMedia[0]"
                thumbnail
                media-class="h-full w-full object-cover"
              />
              <span
                v-if="imageCount(item.resultMedia) > 1"
                :aria-label="'共 ' + imageCount(item.resultMedia) + ' 張圖片'"
                class="pointer-events-none absolute right-1 bottom-1 rounded-md bg-black/70 px-1.5 text-[11px] font-semibold leading-5 text-white"
              >
                +{{ imageCount(item.resultMedia) }}
              </span>
            </span>
          </button>
        </template>
        <div v-else class="py-10 text-center text-[13px] text-[#737373]">
          尚無旅程紀錄
        </div>
      </div>

      <!-- 參與任務三欄九宮格 -->
      <template v-else>
        <div class="grid grid-cols-3 gap-x-2 gap-y-4">
          <template v-if="shownItems.length">
            <div
              v-for="item in shownItems"
              :key="item.key"
              class="min-w-0"
            >
              <button
                type="button"
                class="grid w-full min-w-0 grid-rows-[auto_18px_15px] gap-1 border-0 bg-transparent p-0 text-left"
                @click="openItem(item.key)"
              >
                <span
                  class="relative block aspect-square w-full overflow-hidden rounded-md bg-[#ececec] transition-colors hover:bg-[#e1e1e1]"
                >
                  <MediaTag
                    :media="
                      isRecordEntry(item)
                        ? item.resultMedia?.[0] || null
                        : item.media?.[0] || null
                    "
                    thumbnail
                    :empty-record="isRecordEntry(item)"
                    media-class="absolute inset-0 h-full w-full object-cover"
                  />
                </span>
                <strong class="block truncate text-[11px] font-semibold leading-[18px] sm:text-xs">
                  {{ item.title }}
                </strong>
                <small class="block truncate text-[10px] leading-[15px] text-[#737373]">
                  {{ item.record ? item.date : TASK_TYPES[item.type] || '任務' }}
                </small>
              </button>

              <button
                v-if="!store.visitorMode.value"
                type="button"
                class="block min-h-[36px] border-0 bg-transparent py-1.5 text-xs text-[#737373] hover:text-[#141414]"
                @click="store.toggleTaskParticipationPublic(item.id, false)"
              >
                隱藏任務
              </button>
            </div>
          </template>
          <div v-else class="col-span-full py-10 text-center text-[13px] text-[#737373]">
            此欄位尚無內容
          </div>
        </div>

        <button
          v-if="!store.visitorMode.value"
          type="button"
          class="mt-3 min-h-[40px] rounded-xl border-0 bg-transparent px-0 py-2 text-[13px] text-[#737373] hover:text-[#141414]"
          @click="store.openModal('manageHiddenTasks')"
        >
          管理已隱藏任務
        </button>
      </template>
    </template>
  </div>
</template>
