<script setup>
import { computed } from 'vue'
import MediaTag from './MediaTag.vue'
import { getMediaCreditSources } from '../utils/helpers.js'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  creditItems: {
    type: Array,
    default: null,
  },
  inBubble: {
    type: Boolean,
    default: false,
  },
})

const creditSources = computed(() =>
  getMediaCreditSources(props.creditItems ?? [])
)
</script>

<template>
  <div
    v-if="items?.length"
    class="my-3 grid gap-3"
    :class="inBubble ? 'w-[min(260px,100%)] min-w-[90px] sm:min-w-[120px] whitespace-normal' : ''"
  >
    <figure v-for="(item, idx) in items" :key="item.id || item.src || idx" class="m-0 min-w-0">
      <MediaTag
        :media="item"
        :media-class="
          inBubble
            ? 'block w-full max-h-[260px] object-contain rounded-[9px] bg-[#eeeeee]'
            : 'block w-full max-h-[600px] object-contain rounded-[9px] bg-[#eeeeee]'
        "
      />
    </figure>
  </div>
  <p
    v-if="creditSources.length"
    class="my-2.5 text-[9px] sm:text-[10px] leading-relaxed text-[#777777]"
  >
    情境示意照，非真實活動現場 ·
    <template v-for="(url, i) in creditSources" :key="url">
      <span v-if="i > 0"> / </span>
      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="underline hover:text-[#141414]"
      >
        Pexels {{ i + 1 }}
      </a>
    </template>
  </p>
</template>
