<script setup>
import { ref, onBeforeUnmount, nextTick } from 'vue'
import { useAppStore } from '../stores/appStore.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'loading-change'])

const { showToast } = useAppStore()
const canvasRef = ref(null)
const fileInputRef = ref(null)

const cropping = ref(false)
const loading = ref(false)
const zoom = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

let bitmap = null
let loadVersion = 0
let dragPoint = null

function geometry() {
  const scale =
    Math.max(320 / bitmap.width, 320 / bitmap.height) * Number(zoom.value)
  return {
    width: bitmap.width * scale,
    height: bitmap.height * scale,
  }
}

function draw() {
  if (!bitmap || !canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  const { width, height } = geometry()
  const x = (320 - width) / 2 + (Number(offsetX.value) / 100) * ((width - 320) / 2)
  const y = (320 - height) / 2 + (Number(offsetY.value) / 100) * ((height - 320) / 2)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 320, 320)
  ctx.drawImage(bitmap, x, y, width, height)
}

function resetPosition() {
  zoom.value = 1
  offsetX.value = 0
  offsetY.value = 0
  draw()
}

function applyCrop() {
  if (!bitmap || !canvasRef.value) return
  draw()
  const dataUrl = canvasRef.value.toDataURL('image/jpeg', 0.9)
  emit('update:modelValue', dataUrl)
  cropping.value = false
}

function removeAvatar() {
  loadVersion++
  loading.value = false
  emit('loading-change', false)
  bitmap?.close()
  bitmap = null
  emit('update:modelValue', '')
  cropping.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  ) {
    showToast('請選擇 8 MB 內的 JPG、PNG 或 WebP。')
    return
  }
  const version = ++loadVersion
  loading.value = true
  emit('loading-change', true)
  try {
    const nextBitmap = await createImageBitmap(file)
    if (version !== loadVersion) {
      nextBitmap.close()
      return
    }
    bitmap?.close()
    bitmap = nextBitmap
    cropping.value = true
    await nextTick()
    resetPosition()
  } catch {
    showToast('無法讀取照片，請換一張。')
  } finally {
    if (version === loadVersion) {
      loading.value = false
      emit('loading-change', false)
    }
  }
}

function onPointerDown(e) {
  if (!bitmap || !canvasRef.value) return
  dragPoint = { x: e.clientX, y: e.clientY }
  canvasRef.value.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!dragPoint || !bitmap || !canvasRef.value) return
  const { width, height } = geometry()
  const ratio = 320 / canvasRef.value.getBoundingClientRect().width
  const clamp = (v) => Math.max(-100, Math.min(100, v))
  if (width > 320) {
    offsetX.value = clamp(
      Number(offsetX.value) + ((e.clientX - dragPoint.x) * ratio * 200) / (width - 320)
    )
  }
  if (height > 320) {
    offsetY.value = clamp(
      Number(offsetY.value) + ((e.clientY - dragPoint.y) * ratio * 200) / (height - 320)
    )
  }
  dragPoint = { x: e.clientX, y: e.clientY }
  draw()
}

function onPointerEnd() {
  dragPoint = null
}

function ensureApplied() {
  if (bitmap && cropping.value) {
    applyCrop()
  }
}

onBeforeUnmount(() => {
  bitmap?.close()
  bitmap = null
})

defineExpose({ ensureApplied, loading })
</script>

<template>
  <div>
    <label for="avatar-file" class="mt-3 mb-1.5 block text-[13px] font-medium">
      頭貼相片
    </label>
    <input
      id="avatar-file"
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm text-[#141414]"
      @change="onFileSelect"
    />

    <img
      v-if="modelValue"
      :src="modelValue"
      alt="頭貼預覽"
      class="my-3 block h-[84px] w-[84px] rounded-full object-cover border border-[#e3e3e3]"
    />

    <button
      type="button"
      class="mt-2 min-h-[40px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
      @click="removeAvatar"
    >
      移除頭貼
    </button>

    <section v-if="cropping" class="py-3">
      <p class="mb-2 text-xs text-[#737373]">
        拖曳照片對位，調整縮放。圓框就是頭貼顯示範圍。
      </p>
      <div
        class="relative mx-auto my-3 aspect-square w-[min(320px,100%)] overflow-hidden rounded-xl bg-[#222222]"
      >
        <canvas
          ref="canvasRef"
          width="320"
          height="320"
          aria-label="頭貼裁切預覽，可拖曳調整位置"
          class="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerEnd"
          @pointercancel="onPointerEnd"
        />
        <div
          class="pointer-events-none absolute inset-0 rounded-full border-2 border-white shadow-[0_0_0_80px_rgba(0,0,0,0.55)]"
        />
      </div>

      <label for="crop-zoom" class="mt-3 block text-xs text-[#737373]">縮放</label>
      <input
        id="crop-zoom"
        v-model.number="zoom"
        type="range"
        min="1"
        max="4"
        step="0.01"
        class="min-h-[34px] w-full accent-[#111111]"
        @input="draw"
      />

      <label for="crop-x" class="mt-2 block text-xs text-[#737373]">水平位置</label>
      <input
        id="crop-x"
        v-model.number="offsetX"
        type="range"
        min="-100"
        max="100"
        step="1"
        class="min-h-[34px] w-full accent-[#111111]"
        @input="draw"
      />

      <label for="crop-y" class="mt-2 block text-xs text-[#737373]">垂直位置</label>
      <input
        id="crop-y"
        v-model.number="offsetY"
        type="range"
        min="-100"
        max="100"
        step="1"
        class="min-h-[34px] w-full accent-[#111111]"
        @input="draw"
      />

      <div class="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
          @click="resetPosition"
        >
          重設位置
        </button>
        <button
          type="button"
          class="min-h-[44px] rounded-xl border border-[#161616] bg-[#161616] px-4 py-2 text-sm text-white hover:bg-[#333333]"
          @click="applyCrop"
        >
          套用裁切
        </button>
      </div>
    </section>
  </div>
</template>
