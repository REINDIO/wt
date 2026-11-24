<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/appStore.js'

const props = defineProps({
  taskId: {
    type: Number,
    required: true,
  },
})

const store = useAppStore()
const task = computed(() => store.state.tasks.find((t) => t.id === props.taskId))

const questionText = ref('')
const replyingIndex = ref(null)
const replyText = ref('')
const addingFaq = ref(false)
const faqQ = ref('')
const faqA = ref('')

function submitQuestion() {
  if (!task.value) return
  store.askPersonalQuestion(task.value.id, questionText.value)
  questionText.value = ''
}

function openReply(idx) {
  replyingIndex.value = idx
  replyText.value = ''
}

function submitReply() {
  if (!task.value || replyingIndex.value === null) return
  store.replyPersonalQuestion(task.value.id, replyingIndex.value, replyText.value)
  replyingIndex.value = null
  replyText.value = ''
}

function submitFaq() {
  if (!task.value) return
  store.addPersonalFaq(task.value.id, faqQ.value, faqA.value)
  addingFaq.value = false
  faqQ.value = ''
  faqA.value = ''
  store.closeModal()
}
</script>

<template>
  <div v-if="task">
    <!-- 回覆提問子畫面 -->
    <template v-if="replyingIndex !== null">
      <h2 class="mb-3 text-[23px] font-bold">回覆提問</h2>
      <form class="space-y-3" @submit.prevent="submitReply">
        <textarea
          v-model="replyText"
          required
          maxlength="1000"
          class="min-h-[100px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
        />
        <div class="flex gap-2">
          <button
            type="button"
            class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm hover:bg-[#ededed]"
            @click="replyingIndex = null"
          >
            返回
          </button>
          <button
            type="submit"
            class="min-h-[44px] flex-1 rounded-xl border border-[#161616] bg-[#161616] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333333]"
          >
            儲存回覆
          </button>
        </div>
      </form>
    </template>

    <!-- 新增常見問答子畫面 -->
    <template v-else-if="addingFaq">
      <h2 class="mb-2 text-[23px] font-bold">新增常見問答</h2>
      <p class="mb-4 text-sm text-[#737373]">
        請重新整理為一般問題，不包含提問者身分或私人內容。
      </p>
      <form class="space-y-3" @submit.prevent="submitFaq">
        <div>
          <label class="mb-1 block text-[13px] font-medium">問題</label>
          <input
            v-model="faqQ"
            required
            maxlength="300"
            class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label class="mb-1 block text-[13px] font-medium">回答</label>
          <textarea
            v-model="faqA"
            required
            maxlength="1000"
            class="min-h-[100px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
          />
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm hover:bg-[#ededed]"
            @click="addingFaq = false"
          >
            返回
          </button>
          <button
            type="submit"
            class="min-h-[44px] flex-1 rounded-xl border border-[#161616] bg-[#161616] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333333]"
          >
            公開常見問答
          </button>
        </div>
      </form>
    </template>

    <!-- 詢問主畫面 -->
    <template v-else>
      <h2 class="mb-1 text-[23px] font-bold">詢問發布者</h2>
      <p class="mb-4 text-sm text-[#737373]">
        問題只對你與發布者顯示，不會出現在完成動態。
      </p>

      <form class="space-y-3" @submit.prevent="submitQuestion">
        <textarea
          v-model="questionText"
          required
          maxlength="1000"
          placeholder="你想詢問什麼？"
          class="min-h-[96px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          class="min-h-[44px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333333]"
        >
          送出問題
        </button>
      </form>

      <h3 class="mt-6 mb-2 text-lg font-bold">我的提問</h3>
      <div v-if="task.queries?.length">
        <div
          v-for="(q, idx) in task.queries"
          :key="q.time + idx"
          class="border-t border-[#e3e3e3] py-3"
        >
          <p class="mb-1 text-sm whitespace-pre-wrap">{{ q.text }}</p>
          <p class="mb-1 text-xs text-[#737373]">{{ q.reply || '等待回覆' }}</p>
          <button
            v-if="!q.reply"
            type="button"
            class="min-h-[36px] rounded-lg border-0 bg-transparent px-0 text-xs text-[#141414] underline hover:opacity-70"
            @click="openReply(idx)"
          >
            {{ task.owner === '林以安' ? '回覆' : '原型：模擬發布者回覆' }}
          </button>
        </div>
      </div>
      <small v-else class="text-xs text-[#737373]">尚無提問</small>

      <button
        v-if="task.owner === '林以安'"
        type="button"
        class="mt-4 block min-h-[44px] w-full rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm hover:bg-[#ededed]"
        @click="addingFaq = true"
      >
        整理常見問答
      </button>
    </template>
  </div>
</template>
