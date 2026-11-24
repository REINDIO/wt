<script setup>
import { computed } from 'vue'
import { resolveMediaSrc } from '../utils/media.js'

const props = defineProps({
  media: {
    type: Object,
    default: null,
  },
  thumbnail: {
    type: Boolean,
    default: false,
  },
  emptyRecord: {
    type: Boolean,
    default: false,
  },
  mediaClass: {
    type: String,
    default: 'h-full w-full object-cover',
  },
})

const src = computed(() => resolveMediaSrc(props.media))
</script>

<template>
  <span
    v-if="emptyRecord && !media"
    class="absolute inset-0 grid h-full w-full place-items-center bg-[#f1f1f1] text-xs font-normal tracking-wider text-[#969696]"
    aria-label="文字紀錄，未附影像"
  >
    文字紀錄
  </span>
  <span
    v-else-if="!media"
    class="grid h-full w-full place-items-center p-4 text-center text-xs text-[#888888]"
  >
    尚未附上影像
  </span>
  <video
    v-else-if="media.type === 'video'"
    :src="src || undefined"
    :muted="thumbnail"
    :controls="!thumbnail"
    playsinline
    preload="metadata"
    :aria-label="media.name || '影片'"
    :class="mediaClass"
  />
  <img
    v-else
    :src="src || undefined"
    :alt="media.name || '照片'"
    loading="lazy"
    draggable="false"
    :class="mediaClass"
  />
</template>
