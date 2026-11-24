<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import { TASK_TYPES } from '../data/seed.js'
import MediaTag from '../components/MediaTag.vue'
import MediaGallery from '../components/MediaGallery.vue'
import TaskFacts from '../components/TaskFacts.vue'
import SnapshotCard from '../components/SnapshotCard.vue'

const store = useAppStore()

const task = computed(() =>
  store.state.tasks.find(
    (t) => 'task-' + t.id === store.activeRoom.value && t.joined
  )
)

function goBack() {
  store.page.value = 'community'
}

function updateSnapshot() {
  if (!task.value) return
  store.openModal('confirmSnapshot', {
    taskId: task.value.id,
    onConfirmed: () => {
      store.showToast('已主動更新報名資料版本。')
    },
  })
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1000px] px-3.5 py-3 sm:px-[5%] sm:py-5">
    <article v-if="task" class="mx-auto max-w-[620px]">
      <button
        type="button"
        class="mb-2 min-h-[40px] rounded-xl border-0 bg-transparent px-0 py-2 text-[13px] text-[#141414] hover:opacity-70"
        @click="goBack"
      >
        ← 返回對話
      </button>

      <div
        class="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-[#ececec]"
      >
        <MediaTag
          :media="task.media?.[0] || null"
          media-class="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <h1 class="mt-5 mb-3 text-[25px] font-bold leading-snug break-words">
        {{ task.title }}
      </h1>

      <div class="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-[#737373]">
        <span>{{ TASK_TYPES[task.type] || '任務' }} · #{{ task.id }}</span>
        <span>{{ task.place }}</span>
        <span>{{ task.date }}</span>
        <span>{{ task.people }}{{ task.capacity ? '/' + task.capacity : '' }} 人</span>
      </div>

      <p class="my-5 text-[15px] leading-relaxed whitespace-pre-wrap break-words text-[#141414]">
        {{ task.desc }}
      </p>

      <TaskFacts :task="task" />
      <MediaGallery
        :items="(task.media || []).slice(1)"
        :credit-items="task.media || []"
      />

      <p class="my-3 text-sm text-[#737373]">
        發布者：{{ store.displayName(task.owner) }}
      </p>

      <div v-if="task.questions?.length" class="my-5">
        <h3 class="mb-2 text-lg font-bold">
          {{ task.type === 'personal' ? '任務提示' : '篩選問卷' }}
        </h3>
        <ol class="list-decimal space-y-1.5 pl-5 text-sm text-[#333333]">
          <li v-for="(q, idx) in task.questions" :key="idx" class="break-words">
            {{ q }}
          </li>
        </ol>
      </div>

      <div v-if="task.participationNotes?.length" class="my-5">
        <h3 class="mb-2 text-lg font-bold">我的參與備註</h3>
        <div
          v-for="(note, idx) in task.participationNotes"
          :key="idx"
          class="mb-3 text-sm"
        >
          <strong class="block">{{ note.question }}</strong>
          <span class="whitespace-pre-wrap text-[#555555]">
            {{ note.answer || '未填寫' }}
          </span>
        </div>
      </div>

      <details
        v-if="task.applicationSnapshot"
        class="my-5 rounded-xl border border-[#e3e3e3] bg-white p-3.5"
      >
        <summary class="cursor-pointer text-sm font-medium">
          本次已提供的報名資料
        </summary>
        <SnapshotCard :snapshot="task.applicationSnapshot" />
        <button
          type="button"
          class="mt-2 min-h-[42px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
          @click="updateSnapshot"
        >
          主動更新這筆資料
        </button>
      </details>

      <div v-if="task.type === 'personal'" class="my-5 space-y-4">
        <button
          type="button"
          class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
          @click="store.openModal('personalQuestions', { taskId: task.id })"
        >
          詢問發布者
        </button>

        <div>
          <h3 class="mb-2 text-lg font-bold">常見問答</h3>
          <template v-if="task.faq?.length">
            <div v-for="(f, idx) in task.faq" :key="idx" class="mb-3 text-sm">
              <strong class="block">{{ f.q }}</strong>
              <p class="mt-0.5 whitespace-pre-wrap text-[#555555]">{{ f.a }}</p>
            </div>
          </template>
          <small v-else class="text-xs text-[#737373]">尚無常見問答</small>
        </div>
      </div>

      <div class="mt-7 border-t border-[#e3e3e3] pt-5">
        <button
          type="button"
          :disabled="task.owner === '林以安'"
          class="min-h-[44px] w-full rounded-xl border border-[#e3e3e3] bg-white px-4 py-2.5 text-sm text-[#141414] hover:bg-[#ededed] disabled:opacity-50"
          @click="store.openModal('confirmLeaveTask', { taskId: task.id })"
        >
          退出任務
        </button>
        <p v-if="task.owner === '林以安'" class="mt-2 text-xs text-[#737373]">
          發布者目前不能直接退出自己發布的任務。
        </p>
      </div>
    </article>

    <div v-else class="py-10 text-center text-sm text-[#737373]">
      找不到此任務，
      <button type="button" class="underline" @click="store.nav('community')">
        返回任務交流
      </button>
    </div>
  </div>
</template>
