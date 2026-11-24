<script setup>
import { useAppStore } from '../stores/appStore.js'

const store = useAppStore()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="store.toastMessage.value"
      role="status"
      aria-live="polite"
      class="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-50 max-w-[90%] -translate-x-1/2 rounded-xl bg-[#161616] px-5 py-3 text-[13px] text-white shadow-lg sm:bottom-7"
    >
      {{ store.toastMessage.value }}
    </div>
  </Transition>
</template>
