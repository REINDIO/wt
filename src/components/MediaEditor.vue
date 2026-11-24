<script setup>
import { ref } from 'vue'
import MediaTag from './MediaTag.vue'
import { prepareMedia } from '../utils/media.js'
import { useAppStore } from '../stores/appStore.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  limit: {
    type: Number,
    default: 6,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'busy-change'])

const { showToast, displayName } = useAppStore()
const busy = ref(false)
const fileInput = ref(null)
const menuRef = ref(null)

function setBusy(next) {
  busy.value = next
  emit('busy-change', next)
}

function triggerPicker() {
  if (!busy.value) {
    fileInput.value?.click()
  }
}

async function onFilesChange(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  if (props.modelValue.length + files.length > props.limit) {
    showToast(`最多 ${props.limit} 個影像。`)
    e.target.value = ''
    return
  }
  setBusy(true)
  const nextList = [...props.modelValue]
  for (const file of files) {
    try {
      const saved = await prepareMedia(file)
      nextList.push(saved)
    } catch (err) {
      showToast(err?.message || '影像儲存失敗，請檢查瀏覽器儲存空間。')
    }
  }
  emit('update:modelValue', nextList)
  e.target.value = ''
  if (menuRef.value) menuRef.value.open = false
  setBusy(false)
}

function removeItem(idx) {
  if (busy.value) return
  const nextList = [...props.modelValue]
  nextList.splice(idx, 1)
  emit('update:modelValue', nextList)
}

defineExpose({ busy })
</script>

<template>
  <div
    :class="
      compact
        ? 'relative m-0 border-0 p-0'
        : 'my-4 rounded-[10px] border border-dashed border-[#e3e3e3] p-2.5 sm:p-3'
    "
  >
    <details ref="menuRef" class="relative m-0 border-0 p-0">
      <summary
        class="media-add-summary grid h-11 w-11 list-none cursor-pointer place-items-center rounded-full border border-[#e3e3e3] bg-white text-[26px] leading-none text-[#111111] transition-colors hover:bg-[#ededed]"
        aria-label="新增照片或影片"
      >
        ＋
      </summary>
      <div
        :class="
          compact
            ? 'absolute bottom-[54px] left-0 z-20 flex w-[230px] flex-wrap items-center gap-2.5 rounded-xl border border-[#e3e3e3] bg-white p-3 shadow-lg'
            : 'flex flex-wrap items-center gap-2.5 py-2.5'
        "
      >
        <label
          tabindex="0"
          role="button"
          class="m-0 inline-flex min-h-[44px] cursor-pointer items-center rounded-xl border border-[#e3e3e3] bg-white px-4 py-2.5 text-sm text-[#141414] transition-colors hover:bg-[#ededed]"
          @keydown.enter.prevent="triggerPicker"
          @keydown.space.prevent="triggerPicker"
        >
          相簿
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            multiple
            :disabled="busy"
            class="hidden"
            aria-label="從相簿選擇照片或影片"
            @change="onFilesChange"
          />
        </label>
        <small class="text-[11px] text-[#737373]">
          照片 10 MB／影片 20 MB · 最多 {{ limit }} 個
        </small>
      </div>
    </details>

    <small
      v-if="busy"
      role="status"
      :class="
        compact
          ? 'absolute bottom-full left-3 rounded bg-white px-1.5 text-[11px] text-[#737373]'
          : 'mt-1.5 block text-[11px] text-[#737373]'
      "
    >
      影像處理中…
    </small>
    <small
      v-else-if="modelValue.length"
      :class="
        compact
          ? 'absolute bottom-full left-3 rounded bg-white px-1.5 text-[11px] text-[#737373]'
          : 'mt-1.5 block text-[11px] text-[#737373]'
      "
    >
      {{ modelValue.length }}/{{ limit }}
    </small>

    <div
      v-if="modelValue.length"
      :class="
        compact
          ? 'absolute bottom-[calc(100%+6px)] left-0 z-10 flex max-h-[120px] w-[min(360px,calc(100vw-40px))] gap-2 overflow-x-auto rounded-xl border border-[#e3e3e3] bg-white p-2 shadow-md'
          : 'mt-2 flex gap-2 overflow-x-auto'
      "
    >
      <div
        v-for="(item, idx) in modelValue"
        :key="item.id || item.src || idx"
        class="relative shrink-0 overflow-hidden rounded-lg bg-[#eeeeee]"
        :class="compact ? 'h-[54px] w-[66px]' : 'h-[75px] w-[85px]'"
      >
        <MediaTag :media="item" thumbnail media-class="h-full w-full object-cover" />
        <button
          type="button"
          :aria-label="'移除' + displayName(item.name || '影像')"
          class="absolute top-0.5 right-0.5 grid place-items-center rounded-full border border-[#e3e3e3] bg-white/90 p-0 leading-none text-[#141414] hover:bg-white"
          :class="compact ? 'h-6 w-6 text-sm' : 'h-7 w-7 text-base'"
          @click="removeItem(idx)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>
