<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import SnapshotCard from './SnapshotCard.vue'
import MediaEditor from './MediaEditor.vue'
import MediaGallery from './MediaGallery.vue'
import EditProfileModal from './modals/EditProfileModal.vue'
import PersonalQuestionsModal from './modals/PersonalQuestionsModal.vue'
import PwaInstallModal from './modals/PwaInstallModal.vue'

const store = useAppStore()
const dialogRef = ref(null)

// 各彈窗表單暫存欄位
const resetEmail = ref('')
const resetPwd = ref('')
const agreeSnapshot = ref(false)
const reviewNote = ref('')
const questionnaireAnswers = ref([])
const announcementText = ref('')
const announcementMedia = ref([])
const announcementBusy = ref(false)
const completionText = ref('')
const completionMedia = ref([])
const completionShared = ref(false)
const completionPublic = ref(false)
const completionBusy = ref(false)
const editRunText = ref('')
const editRunMedia = ref([])
const editRunPublic = ref(false)
const editRunBusy = ref(false)
const editResultText = ref('')
const editResultMedia = ref([])
const editResultPublic = ref(false)
const editResultBusy = ref(false)

const modalType = computed(() => store.modal.type)
const modalProps = computed(() => store.modal.props || {})

const activeTask = computed(() => {
  const id = modalProps.value.taskId
  return id ? store.state.tasks.find((t) => t.id === id) || null : null
})

const accountInfo = computed(() => {
  if (modalType.value !== 'account') return null
  const name = modalProps.value.name
  const friendObj = store.state.friends.find((f) => f.name === name) || null
  const map = store.accountsMap()
  return {
    name,
    handle: map[name] || name,
    friend: friendObj,
  }
})

const hiddenTasks = computed(() =>
  store.profileEntries.value.tasks.filter((t) => t.participationPublic === false)
)

watch(
  modalType,
  async (type) => {
    // 重設各表單初始狀態
    if (type === 'resetPassword') {
      resetEmail.value = ''
      resetPwd.value = ''
    } else if (type === 'confirmSnapshot') {
      agreeSnapshot.value = false
    } else if (type === 'reviewApplication') {
      reviewNote.value = ''
    } else if (type === 'questionnaire' && activeTask.value) {
      questionnaireAnswers.value = (activeTask.value.questions || []).map(() => '')
    } else if (type === 'publishAnnouncement') {
      announcementText.value = ''
      announcementMedia.value = []
      announcementBusy.value = false
    } else if (type === 'completePersonal' && activeTask.value) {
      completionText.value = ''
      completionMedia.value = []
      completionShared.value = activeTask.value.owner === '林以安'
      completionPublic.value = false
      completionBusy.value = false
    } else if (type === 'editPersonalRecord' && activeTask.value) {
      const r = activeTask.value.completions?.find(
        (x) => x.id === modalProps.value.recordId
      )
      editRunText.value = r?.text || ''
      editRunMedia.value = [...(r?.media || [])]
      editRunPublic.value = !!r?.public
      editRunBusy.value = false
    } else if (type === 'editResult' && activeTask.value) {
      editResultText.value = activeTask.value.reflection || ''
      editResultMedia.value = [...(activeTask.value.resultMedia || [])]
      editResultPublic.value = !!activeTask.value.public
      editResultBusy.value = false
    }

    await nextTick()
    const el = dialogRef.value
    if (!el) return
    if (type) {
      if (!el.open) el.showModal()
      el.scrollTop = 0
    } else if (el.open) {
      el.close()
    }
  },
  { immediate: true }
)

function onBackdropClick(e) {
  if (e.target === dialogRef.value) {
    store.closeModal()
  }
}

function onDialogCancel(e) {
  e.preventDefault()
  store.closeModal()
}

// 帳號選項操作
function openAccountProfile() {
  const name = accountInfo.value?.name
  if (!name) return
  const origin = store.page.value
  store.closeModal()
  if (name === '林以安') {
    store.visitorMode.value = false
    store.nav('profile')
  } else {
    store.openFriendProfile(name, origin)
  }
}

function onAccountFriendAction() {
  const info = accountInfo.value
  if (!info?.friend) return
  if (info.friend.state === 'friend') {
    store.closeModal()
    store.openFriendChat(info.name)
  } else {
    store.handleFriendAction(info.name, 'request')
  }
}

const friendActionLabel = {
  none: '申請好友',
  pending: '等待對方同意',
  incoming: '接受好友申請',
  friend: '傳送訊息',
}

// 確認快照
function onSubmitSnapshot() {
  if (!agreeSnapshot.value) {
    store.showToast('請先確認本次提供的資料。')
    return
  }
  store.commitApplicationSnapshot(
    modalProps.value.taskId,
    modalProps.value.onConfirmed
  )
}

function onPendingUpdateSnapshot() {
  const id = modalProps.value.taskId
  store.openModal('confirmSnapshot', {
    taskId: id,
    onConfirmed: () => store.joinAfterDisclosure(id),
  })
}

// 問卷送出
function onSubmitQuestionnaire() {
  const task = activeTask.value
  if (!task) return
  const isPersonal = task.type === 'personal'
  const answers = (task.questions || []).map((q, i) => ({
    question: q,
    answer: String(questionnaireAnswers.value[i] || '').trim(),
  }))
  if (!isPersonal && answers.some((a) => !a.answer)) {
    store.showToast('請回答所有問題。')
    return
  }
  if (modalProps.value.preview) {
    store.closeModal()
    return
  }
  store.submitQuestionnaire(task.id, answers, false)
}

function onSubmitAnnouncement() {
  if (announcementBusy.value) {
    store.showToast('影像處理中。')
    return
  }
  store.publishAnnouncement(
    modalProps.value.taskId,
    announcementText.value,
    announcementMedia.value
  )
}

function onSubmitCompletion() {
  if (completionBusy.value) {
    store.showToast('影像處理中。')
    return
  }
  store.completePersonalTask(modalProps.value.taskId, {
    text: completionText.value,
    media: completionMedia.value,
    shared: completionShared.value,
    isPublic: completionPublic.value,
  })
}

function onSubmitEditRun() {
  if (editRunBusy.value) {
    store.showToast('影像處理中。')
    return
  }
  store.savePersonalRecord(modalProps.value.taskId, modalProps.value.recordId, {
    text: editRunText.value,
    media: editRunMedia.value,
    isPublic: editRunPublic.value,
  })
}

function onSubmitEditResult() {
  if (editResultBusy.value) {
    store.showToast('影像處理中，請稍候。')
    return
  }
  store.saveTaskResult(modalProps.value.taskId, {
    reflection: editResultText.value,
    media: editResultMedia.value,
    isPublic: editResultPublic.value,
  })
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="m-auto max-h-[88dvh] w-[min(600px,calc(100%-24px))] overflow-y-auto rounded-[22px] border-0 bg-white p-6 text-[#141414] shadow-[0_20px_80px_rgba(0,0,0,0.22)] sm:p-8"
    @click="onBackdropClick"
    @cancel="onDialogCancel"
  >
    <div class="relative">
      <button
        type="button"
        aria-label="關閉視窗"
        class="float-right -mt-3 -mr-3 grid h-10 w-10 place-items-center rounded-xl border-0 bg-transparent p-0 text-[25px] leading-none text-[#141414] hover:bg-[#ededed]"
        @click="store.closeModal()"
      >
        ×
      </button>

      <div class="clear-both">
        <!-- 1. 模擬信箱驗證 -->
        <div v-if="modalType === 'verify'">
          <h2 class="mb-3 text-[23px] font-bold">模擬信箱驗證</h2>
          <p class="mb-5 text-sm text-[#444444]">
            尚未寄出真實信件。此按鈕僅供測試驗證後的流程。
          </p>
          <button
            type="button"
            class="min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            @click="store.completeVerification(modalProps.userId)"
          >
            模擬驗證成功
          </button>
        </div>

        <!-- 2. 模擬重設密碼 -->
        <div v-else-if="modalType === 'resetPassword'">
          <h2 class="mb-1 text-[23px] font-bold">模擬重設密碼</h2>
          <p class="mb-4 text-sm text-[#737373]">
            無真實驗證信，本功能只供本機測試，不代表身分驗證。
          </p>
          <form
            class="space-y-3"
            @submit.prevent="
              store.resetUserPassword({ email: resetEmail, password: resetPwd })
            "
          >
            <div>
              <label class="mb-1 block text-[13px] font-medium">測試信箱</label>
              <input
                v-model="resetEmail"
                type="email"
                required
                class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label class="mb-1 block text-[13px] font-medium">新測試密碼</label>
              <input
                v-model="resetPwd"
                type="password"
                minlength="8"
                required
                class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              class="mt-2 min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            >
              模擬驗證並重設
            </button>
          </form>
        </div>

        <!-- 3. 帳號互動視窗 -->
        <div v-else-if="modalType === 'account' && accountInfo">
          <div class="mb-5 flex items-center gap-3">
            <span
              class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eeeeee] text-base font-medium"
            >
              {{ accountInfo.name[0] }}
            </span>
            <div>
              <h3 class="m-0 text-lg font-bold">
                {{ store.displayName(accountInfo.name) }}
              </h3>
              <small class="text-xs text-[#737373]">@{{ accountInfo.handle }}</small>
            </div>
          </div>

          <div class="flex flex-wrap gap-2.5">
            <button
              type="button"
              class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
              @click="openAccountProfile"
            >
              查看個人頁
            </button>
            <button
              v-if="accountInfo.friend"
              type="button"
              :disabled="accountInfo.friend.state === 'pending'"
              class="min-h-[44px] rounded-xl border border-[#161616] bg-[#161616] px-4 py-2 text-sm font-medium text-white hover:bg-[#333333] disabled:opacity-50"
              @click="onAccountFriendAction"
            >
              {{ friendActionLabel[accountInfo.friend.state] }}
            </button>
          </div>
        </div>

        <!-- 4. 確認本次提供的報名資料 -->
        <div v-else-if="modalType === 'confirmSnapshot' && activeTask">
          <h2 class="mb-1 text-[23px] font-bold">
            {{ activeTask.application ? '更新報名資料' : '確認本次提供的資料' }}
          </h2>
          <p class="mb-3 text-sm text-[#737373]">
            僅提供給「{{ store.displayName(activeTask.owner) }}」，不向其他參與者公開；不提供信箱與完整生日。
          </p>
          <SnapshotCard :snapshot="store.snapshotFor(activeTask)" />
          <label class="my-4 flex items-center gap-2.5 text-sm">
            <input
              v-model="agreeSnapshot"
              type="checkbox"
              class="h-[18px] w-[18px] shrink-0 accent-[#161616]"
            />
            <span>確認提供上述資料給此任務發布者</span>
          </label>
          <button
            type="button"
            class="min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            @click="onSubmitSnapshot"
          >
            確認並繼續
          </button>
        </div>

        <!-- 5. 申請審核中（含原型模擬審核） -->
        <div v-else-if="modalType === 'pendingReview' && activeTask">
          <h2 class="mb-1 text-[23px] font-bold">申請審核中</h2>
          <p class="mb-1 font-medium">{{ activeTask.title }}</p>
          <p class="mb-4 text-sm text-[#737373]">已送出申請，尚未加入任務。</p>

          <details
            v-if="activeTask.applicationSnapshot"
            class="mb-4 rounded-xl border border-[#e3e3e3] p-3"
          >
            <summary class="cursor-pointer text-sm font-medium">
              本次報名資料
            </summary>
            <SnapshotCard :snapshot="activeTask.applicationSnapshot" />
            <button
              type="button"
              class="mt-2 min-h-[40px] rounded-xl border border-[#e3e3e3] bg-white px-3.5 py-1.5 text-xs hover:bg-[#ededed]"
              @click="onPendingUpdateSnapshot"
            >
              主動更新資料
            </button>
          </details>

          <div
            v-for="(ans, i) in activeTask.application?.answers || []"
            :key="i"
            class="mb-3 text-sm"
          >
            <strong class="block">{{ ans.question }}</strong>
            <span class="whitespace-pre-wrap text-[#444444]">{{ ans.answer }}</span>
          </div>

          <details class="mt-4 rounded-xl border border-[#e3e3e3] bg-[#fafafa] p-3">
            <summary class="cursor-pointer text-sm font-medium">
              原型測試：模擬發起人審核
            </summary>
            <div class="mt-3 flex gap-2.5">
              <button
                type="button"
                class="min-h-[42px] flex-1 rounded-xl border border-[#161616] bg-[#161616] px-3 py-2 text-sm text-white hover:bg-[#333333]"
                @click="store.simulateReviewResult(activeTask.id, true)"
              >
                模擬通過
              </button>
              <button
                type="button"
                class="min-h-[42px] flex-1 rounded-xl border border-[#e3e3e3] bg-white px-3 py-2 text-sm hover:bg-[#ededed]"
                @click="store.simulateReviewResult(activeTask.id, false)"
              >
                模擬未通過
              </button>
            </div>
            <small class="mt-2 block text-[11px] text-[#737373]">
              僅為本機示範，並非真實發起人的決定。
            </small>
          </details>
        </div>

        <!-- 6. 發布者審核留言 -->
        <div v-else-if="modalType === 'reviewApplication' && activeTask">
          <h2 class="mb-1 text-[23px] font-bold">此任務需由發布者審核</h2>
          <p class="mb-4 text-sm text-[#444444]">{{ activeTask.title }}</p>
          <form
            class="space-y-3"
            @submit.prevent="
              store.submitReviewApplication(activeTask.id, reviewNote.trim())
            "
          >
            <div>
              <label for="app-note" class="mb-1 block text-[13px] font-medium">
                留言給發布者（選填）
              </label>
              <textarea
                id="app-note"
                v-model="reviewNote"
                maxlength="1000"
                placeholder="簡單介紹自己或參與的想法"
                class="min-h-[100px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
              />
            </div>
            <div class="flex flex-wrap gap-2.5 pt-2">
              <button
                type="submit"
                class="min-h-[44px] flex-1 rounded-xl border border-[#161616] bg-[#161616] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333333]"
              >
                送出申請
              </button>
              <button
                type="button"
                class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm hover:bg-[#ededed]"
                @click="store.submitReviewApplication(activeTask.id, '')"
              >
                跳過留言並申請
              </button>
            </div>
          </form>
        </div>

        <!-- 7. 問卷申請／參與提問 -->
        <div v-else-if="modalType === 'questionnaire' && activeTask">
          <h2 class="mb-1 text-[23px] font-bold">
            {{
              modalProps.preview
                ? '提問預覽'
                : activeTask.type === 'personal'
                  ? '參與提問（選填）'
                  : '申請加入任務'
            }}
          </h2>
          <p class="mb-4 text-sm text-[#737373]">{{ activeTask.title }}</p>
          <form class="space-y-3" @submit.prevent="onSubmitQuestionnaire">
            <div v-for="(q, idx) in activeTask.questions || []" :key="idx">
              <label :for="'ans-' + idx" class="mb-1 block text-[13px] font-medium">
                {{ idx + 1 }}. {{ q }}
              </label>
              <textarea
                :id="'ans-' + idx"
                v-model="questionnaireAnswers[idx]"
                :required="activeTask.type !== 'personal'"
                maxlength="1000"
                placeholder="請填寫回答"
                class="min-h-[84px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
              />
            </div>
            <p class="text-xs text-[#737373]">
              {{
                modalProps.preview
                  ? '預覽模式，不會送出。'
                  : activeTask.type === 'personal'
                    ? '不需審核，可回答或跳過後直接加入。'
                    : '填答送出後，等待發起人審核。'
              }}
            </p>
            <div class="flex flex-wrap gap-2.5">
              <button
                type="submit"
                class="min-h-[46px] flex-1 rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
              >
                {{
                  modalProps.preview
                    ? '完成預覽'
                    : activeTask.type === 'personal'
                      ? '加入任務'
                      : '送出申請'
                }}
              </button>
              <button
                v-if="activeTask.type === 'personal' && !modalProps.preview"
                type="button"
                class="min-h-[46px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2.5 text-sm hover:bg-[#ededed]"
                @click="store.submitQuestionnaire(activeTask.id, [], true)"
              >
                跳過並加入
              </button>
            </div>
          </form>
        </div>

        <!-- 8. 編輯個人檔案 -->
        <EditProfileModal v-else-if="modalType === 'editProfile'" />

        <!-- 9. 發佈個人任務公告 -->
        <div v-else-if="modalType === 'publishAnnouncement'">
          <h2 class="mb-3 text-[23px] font-bold">發佈公告</h2>
          <form class="space-y-3" @submit.prevent="onSubmitAnnouncement">
            <div>
              <label class="mb-1 block text-[13px] font-medium">公告內容</label>
              <textarea
                v-model="announcementText"
                required
                maxlength="2000"
                class="min-h-[110px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
              />
            </div>
            <MediaEditor
              v-model="announcementMedia"
              :limit="6"
              @busy-change="announcementBusy = $event"
            />
            <button
              type="submit"
              class="min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            >
              發佈公告
            </button>
          </form>
        </div>

        <!-- 10. 完成個人任務 -->
        <div v-else-if="modalType === 'completePersonal' && activeTask">
          <h2 class="mb-1 text-[23px] font-bold">完成這次任務</h2>
          <p class="mb-1 text-sm">{{ activeTask.condition || activeTask.desc }}</p>
          <p v-if="activeTask.sharePrompt" class="mb-3 text-sm text-[#737373]">
            {{ activeTask.sharePrompt }}
          </p>

          <form class="space-y-3" @submit.prevent="onSubmitCompletion">
            <div>
              <label class="mb-1 block text-[13px] font-medium">
                成果／心得{{
                  activeTask.owner === '林以安' ? '（發布者須分享）' : '（選填）'
                }}
              </label>
              <textarea
                v-model="completionText"
                maxlength="2000"
                :required="activeTask.owner === '林以安'"
                class="min-h-[100px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
              />
            </div>

            <MediaEditor
              v-model="completionMedia"
              :limit="6"
              @busy-change="completionBusy = $event"
            />

            <label class="flex items-center gap-2.5 text-sm">
              <input
                v-model="completionShared"
                type="checkbox"
                :disabled="activeTask.owner === '林以安'"
                class="h-[18px] w-[18px] accent-[#161616]"
              />
              <span>分享完成到任務動態</span>
            </label>

            <label class="flex items-center gap-2.5 text-sm">
              <input
                v-model="completionPublic"
                type="checkbox"
                class="h-[18px] w-[18px] accent-[#161616]"
              />
              <span>公開為個人頁旅程紀錄</span>
            </label>

            <small class="block text-xs text-[#737373]">
              未公開紀錄保存在私人空間。任務動態與旅程紀錄分別設定。
            </small>

            <button
              type="submit"
              class="min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            >
              {{ activeTask.owner === '林以安' ? '完成並分享' : '確認完成' }}
            </button>
          </form>
        </div>

        <!-- 11. 個人任務詢問發布者 -->
        <PersonalQuestionsModal
          v-else-if="modalType === 'personalQuestions'"
          :task-id="modalProps.taskId"
        />

        <!-- 12. 編輯個人任務單次紀錄 -->
        <div v-else-if="modalType === 'editPersonalRecord'">
          <h2 class="mb-3 text-[23px] font-bold">編輯這次紀錄</h2>
          <form class="space-y-3" @submit.prevent="onSubmitEditRun">
            <textarea
              v-model="editRunText"
              maxlength="2000"
              class="min-h-[110px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
            />
            <MediaEditor
              v-model="editRunMedia"
              :limit="6"
              @busy-change="editRunBusy = $event"
            />
            <label class="flex items-center gap-2.5 text-sm">
              <input
                v-model="editRunPublic"
                type="checkbox"
                class="h-[18px] w-[18px] accent-[#161616]"
              />
              <span>公開到旅程紀錄</span>
            </label>
            <button
              type="submit"
              class="min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            >
              儲存
            </button>
          </form>
        </div>

        <!-- 13. 編輯團體任務成果 -->
        <div v-else-if="modalType === 'editResult' && activeTask">
          <h2 class="mb-1 text-[23px] font-bold">編輯成果</h2>
          <p class="mb-4 text-sm text-[#737373]">{{ activeTask.title }}</p>
          <form class="space-y-3" @submit.prevent="onSubmitEditResult">
            <div>
              <label for="reflection" class="mb-1 block text-[13px] font-medium">
                成果與心得
              </label>
              <textarea
                id="reflection"
                v-model="editResultText"
                required
                maxlength="2000"
                placeholder="完成了什麼？學到了什麼？"
                class="min-h-[110px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-sm"
              />
            </div>
            <MediaEditor
              v-model="editResultMedia"
              :limit="6"
              @busy-change="editResultBusy = $event"
            />
            <label class="flex items-center gap-2.5 text-sm">
              <input
                v-model="editResultPublic"
                type="checkbox"
                class="h-[18px] w-[18px] accent-[#161616]"
              />
              <span>公開到作品集，讓訪客看見</span>
            </label>
            <p class="text-xs text-[#737373]">
              不公開的心得保存在私人空間；參與任務的公開設定可另外調整。
            </p>
            <button
              type="submit"
              class="min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            >
              儲存成果，標記完成
            </button>
          </form>
        </div>

        <!-- 14. 管理已隱藏任務 -->
        <div v-else-if="modalType === 'manageHiddenTasks'">
          <h2 class="mb-1 text-[23px] font-bold">已隱藏任務</h2>
          <p class="mb-4 text-sm text-[#737373]">
            隱藏任務不列入個人頁任務數，不影響任務參與或旅程紀錄。
          </p>
          <div v-if="hiddenTasks.length" class="flex flex-col gap-2">
            <button
              v-for="t in hiddenTasks"
              :key="t.id"
              type="button"
              class="flex flex-col gap-1 rounded-xl border border-[#e3e3e3] bg-white px-4 py-3 text-left hover:bg-[#ededed]"
              @click="store.toggleTaskParticipationPublic(t.id, true)"
            >
              <strong class="text-sm font-semibold">{{ t.title }}</strong>
              <small class="text-xs text-[#737373]">恢復顯示</small>
            </button>
          </div>
          <p v-else class="text-sm text-[#737373]">目前沒有隱藏任務</p>
        </div>

        <!-- 15. 旅程目錄 -->
        <div v-else-if="modalType === 'journeyToc'">
          <h2 class="mb-3 text-[23px] font-bold">
            {{ modalProps.isPrivate ? '私人紀錄目錄' : '旅程目錄' }}
          </h2>
          <div class="flex flex-col gap-2">
            <button
              v-for="entry in modalProps.entries || []"
              :key="entry.key"
              type="button"
              class="flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors"
              :class="
                entry.key === modalProps.currentKey
                  ? 'border-[#111111] bg-[#f0f0f0]'
                  : 'border-[#e3e3e3] bg-white hover:bg-[#ededed]'
              "
              @click="
                modalProps.onSelect?.(entry.key);
                store.closeModal()
              "
            >
              <strong class="text-sm font-semibold">{{ entry.title }}</strong>
              <small class="text-xs text-[#737373]">
                {{ entry.date }}{{ entry.key === modalProps.currentKey ? ' · 閱讀中' : '' }}
              </small>
            </button>
          </div>
        </div>

        <!-- 16. 確認退出任務 -->
        <div v-else-if="modalType === 'confirmLeaveTask'">
          <h2 class="mb-2 text-[23px] font-bold">退出這個任務？</h2>
          <p class="mb-5 text-sm text-[#444444]">
            退出後無法繼續使用任務交流，既有紀錄會保留在個人頁。
          </p>
          <button
            type="button"
            class="min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            @click="store.leaveTask(modalProps.taskId)"
          >
            確認退出
          </button>
        </div>

        <!-- 17. 確認刪除好友 -->
        <div v-else-if="modalType === 'confirmRemoveFriend'">
          <h2 class="mb-2 text-[23px] font-bold">刪除好友？</h2>
          <p class="mb-5 text-sm text-[#444444]">
            確定要將「{{ store.displayName(modalProps.name) }}」移出好友名單嗎？刪除後無法繼續傳訊息，需要重新申請並經對方同意。
          </p>
          <div class="flex gap-2.5">
            <button
              type="button"
              class="min-h-[44px] flex-1 rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm hover:bg-[#ededed]"
              @click="store.closeModal()"
            >
              取消
            </button>
            <button
              type="button"
              class="min-h-[44px] flex-1 rounded-xl border border-[#161616] bg-[#161616] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333333]"
              @click="
                store.handleFriendAction(modalProps.name, 'remove');
                store.closeModal()
              "
            >
              確認刪除
            </button>
          </div>
        </div>

        <!-- 18. 好友旅程紀錄詳情 -->
        <div v-else-if="modalType === 'friendRecordDetail' && modalProps.record">
          <h2 class="mb-3 text-[22px] font-bold">{{ modalProps.record.title }}</h2>
          <p class="text-sm leading-relaxed whitespace-pre-wrap break-words text-[#333333]">
            {{ modalProps.record.text }}
          </p>
          <MediaGallery :items="modalProps.record.media || []" />
        </div>

        <!-- 19. 好友任務詳情 -->
        <div v-else-if="modalType === 'friendTaskDetail' && modalProps.task">
          <h2 class="mb-3 text-[22px] font-bold">{{ modalProps.task.title }}</h2>
          <p class="text-sm leading-relaxed whitespace-pre-wrap break-words text-[#333333]">
            {{ modalProps.task.desc || '' }}
          </p>
          <MediaGallery :items="modalProps.task.media || []" />
        </div>

        <!-- 20. 原型說明 -->
        <div v-else-if="modalType === 'rules'">
          <div class="mb-2 text-[11px] tracking-[3px] text-[#737373]">
            WANTOO / V1.0 PROTOTYPE
          </div>
          <h2 class="mb-4 text-[23px] font-bold">這個原型，如何運作？</h2>

          <h3 class="mb-2 text-base font-bold">已確認的方向</h3>
          <ul class="mb-4 list-disc space-y-2 pl-5 text-sm text-[#333333]">
            <li>
              單卡探索、原位搜尋與卡內展開詳情；「我也要」統一顯示在卡片底部，長內容可展開與收合。加入後移至任務交流區。
            </li>
            <li>
              團體、個人兩種任務；團體使用群組，個人僅顯示完成分享動態並提供獨立提問。
            </li>
            <li>
              好友申請經雙方同意才成立；好友動態整合私訊、公開動態與名單；好友申請集中於名單頂部，待同意申請不會出現在私訊列表。
            </li>
            <li>
              本人可查看旅程紀錄、參與任務與私人空間；訪客可看公開旅程紀錄與參與任務，不能進入私人空間。作品來自完成任務後整理的成果與心得。
            </li>
          </ul>

          <h3 class="mb-2 text-base font-bold">本原型的暫定規則</h3>
          <ul class="mb-4 list-disc space-y-2 pl-5 text-sm text-[#333333]">
            <li>滑動只切換卡片，不代表加入或拒絕。</li>
            <li>
              加入方式分為直接加入、不提問但需審核、填寫問卷後審核。團體任務的問卷暫定文字題必填、最多 10 題，由發起人審核；個人任務直接加入，完成後自願分享；本機原型提供明確標示的模擬審核。發布者自動加入。團體任務可設定人數上限，暫定包含發布者；待審核不占名額，通過時再檢查容量。退出保留歷史紀錄；發布者退出、取消與候補尚未定案。
            </li>
            <li>
              完成與公開由本人操作，只改變自己的紀錄。多人任務的共同結案、期限與權限尚未定案。
            </li>
            <li>
              個人挑戰各自執行，共用成果交流區。個人任務不需審核；加入即代表參與意願，不需另外開始；期間內可不限次數記錄完成，發布者每次完成須分享。截止後暫不接受新增完成紀錄。照片／影片僅保存在本機；任務動態小點為本機未讀狀態；推播、檢舉與封鎖未納入本次原型。
            </li>
          </ul>

          <h3 class="mb-2 text-base font-bold">示範資料與限制</h3>
          <p class="mb-5 text-xs leading-relaxed text-[#737373]">
            所有人物、訊息與任務都是示例。文字與影像僅存在此瀏覽器（localStorage／IndexedDB），註冊、登入、信箱驗證及忘記密碼均為本機模擬；無伺服器、跨裝置同步或真實隱私權限；訪客切換僅展示畫面規則。本版本已升級為 Vue 3 + Tailwind CSS 並支援 Android／iOS 桌面捷徑（PWA）。
          </p>

          <div class="flex flex-wrap gap-2.5">
            <button
              type="button"
              class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#444444] hover:bg-[#ededed]"
              @click="store.openModal('confirmReset')"
            >
              重設所有示例資料
            </button>
            <button
              type="button"
              class="min-h-[44px] rounded-xl border border-[#161616] bg-[#161616] px-4 py-2 text-sm text-white hover:bg-[#333333]"
              @click="store.openModal('pwaInstall')"
            >
              加入手機捷徑教學
            </button>
          </div>
        </div>

        <!-- 21. 確認重設示例資料 -->
        <div v-else-if="modalType === 'confirmReset'">
          <h2 class="mb-2 text-[23px] font-bold">重設示例資料？</h2>
          <p class="mb-5 text-sm text-[#444444]">
            將移除本機新增的任務、訊息與心得，恢復初始示例。
          </p>
          <button
            type="button"
            class="min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            @click="store.resetDemoData()"
          >
            確認重設
          </button>
        </div>

        <!-- 22. Android / iOS 加入手機捷徑教學與安裝 -->
        <PwaInstallModal v-else-if="modalType === 'pwaInstall'" />
      </div>
    </div>
  </dialog>
</template>
