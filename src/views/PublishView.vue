<script setup>
import { reactive, ref, watch } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import MediaEditor from '../components/MediaEditor.vue'

const store = useAppStore()
const mediaBusy = ref(false)

const form = reactive({
  type: 'group',
  title: '',
  desc: '',
  media: [],
  locationMode: '',
  region: '',
  place: '',
  // 團體設定
  startAt: '',
  endAt: '',
  deadline: '',
  capacity: '',
  feeKind: 'free',
  feeAmount: '',
  feeNote: '',
  reviewMode: 'no',
  questions: [],
  genderRule: '',
  minAge: '',
  maxAge: '',
  // 個人設定
  condition: '',
  openFrom: '',
  openUntil: '',
  duration: '',
  sharePrompt: '',
  estimatedCost: '',
  // 共用附加資訊
  equipment: '',
  restrictions: '',
  tags: '',
})

watch(
  () => [form.type, form.reviewMode],
  ([type, reviewMode]) => {
    if (type === 'group' && reviewMode === 'yes' && !form.questions.length) {
      form.questions.push('')
    }
  }
)

function addQuestion() {
  if (form.questions.length >= 10) {
    store.showToast('最多 10 題。')
    return
  }
  form.questions.push('')
}

function removeQuestion(idx) {
  form.questions.splice(idx, 1)
}

function onSubmit() {
  if (mediaBusy.value) {
    store.showToast('影像處理中。')
    return
  }
  store.publishTask({ ...form, media: [...form.media], questions: [...form.questions] })
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1000px] px-3.5 py-3 sm:px-[5%] sm:py-5">
    <form
      class="max-w-[720px] rounded-[14px] border border-[#e3e3e3] bg-white p-3.5 sm:p-[18px]"
      @submit.prevent="onSubmit"
    >
      <div class="mb-2 flex items-center justify-between">
        <button
          type="button"
          class="min-h-[38px] rounded-xl border-0 bg-transparent px-0 py-1 text-[13px] text-[#737373] hover:text-[#141414]"
          @click="store.nav('explore')"
        >
          ← 返回探索
        </button>
        <span class="text-xs text-[#737373]">發布新任務</span>
      </div>

      <label class="mt-3 block text-[13px] font-semibold">
        任務類型
        <select
          v-model="form.type"
          class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
        >
          <option value="group">團體任務</option>
          <option value="personal">個人任務</option>
        </select>
      </label>

      <label class="mt-3 block text-[13px] font-semibold">
        任務名稱
        <input
          v-model="form.title"
          required
          maxlength="60"
          class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
        />
      </label>

      <label class="mt-3 block text-[13px] font-semibold">
        任務內容
        <textarea
          v-model="form.desc"
          required
          maxlength="4000"
          class="mt-1.5 block min-h-[100px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
        />
      </label>

      <MediaEditor v-model="form.media" :limit="6" @busy-change="mediaBusy = $event" />

      <label class="mt-3 block text-[13px] font-semibold">
        地點
        <select
          v-model="form.locationMode"
          class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
        >
          <option value="">不限／未設定</option>
          <option value="physical">實體</option>
          <option value="online">線上</option>
        </select>
      </label>

      <div v-if="form.locationMode === 'physical'" class="space-y-3">
        <label class="mt-3 block text-[13px] font-semibold">
          活動地區
          <input
            v-model="form.region"
            maxlength="60"
            placeholder="例如：台北市大安區"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>
        <label class="mt-3 block text-[13px] font-semibold">
          詳細地點
          <input
            v-model="form.place"
            maxlength="120"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>
      </div>

      <!-- 團體任務專屬設定 -->
      <section v-if="form.type === 'group'">
        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="block text-[13px] font-semibold">
            開始時間
            <input
              v-model="form.startAt"
              type="datetime-local"
              required
              class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
            />
          </label>
          <label class="block text-[13px] font-semibold">
            結束時間
            <input
              v-model="form.endAt"
              type="datetime-local"
              required
              class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
            />
          </label>
        </div>

        <label class="mt-3 block text-[13px] font-semibold">
          報名截止（選填）
          <input
            v-model="form.deadline"
            type="datetime-local"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>

        <label class="mt-3 block text-[13px] font-semibold">
          人數上限（含發布者，選填）
          <input
            v-model="form.capacity"
            type="number"
            min="1"
            max="10000"
            step="1"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>

        <label class="mt-3 block text-[13px] font-semibold">
          費用
          <select
            v-model="form.feeKind"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          >
            <option value="free">免費</option>
            <option value="split">依實際費用均攤</option>
            <option value="fixed">固定金額</option>
          </select>
        </label>

        <label v-if="form.feeKind === 'fixed'" class="mt-3 block text-[13px] font-semibold">
          每人金額（新台幣）
          <input
            v-model="form.feeAmount"
            type="number"
            min="0"
            step="1"
            required
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>

        <label class="mt-3 block text-[13px] font-semibold">
          費用用途與付款說明
          <textarea
            v-model="form.feeNote"
            maxlength="500"
            class="mt-1.5 block min-h-[84px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>

        <label class="mt-3 block text-[13px] font-semibold">
          加入方式
          <select
            v-model="form.reviewMode"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          >
            <option value="no">直接加入</option>
            <option value="review">發布者審核，可留言</option>
            <option value="yes">填寫問卷後審核</option>
          </select>
        </label>

        <!-- 篩選問卷編輯器 -->
        <section
          v-if="form.reviewMode === 'yes'"
          class="mt-3.5 border-t border-[#e3e3e3] pt-2"
        >
          <div v-for="(_, idx) in form.questions" :key="idx" class="mt-3">
            <label :for="'q-' + idx" class="mb-1 block text-xs font-medium text-[#737373]">
              問題 {{ idx + 1 }}
            </label>
            <div class="flex items-center gap-2">
              <input
                :id="'q-' + idx"
                v-model="form.questions[idx]"
                required
                maxlength="200"
                class="min-w-0 flex-1 rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] text-[#141414] sm:text-sm"
              />
              <button
                type="button"
                aria-label="刪除此題"
                class="min-h-[44px] rounded-xl border border-[#e3e3e3] bg-white px-3.5 py-1.5 text-xl text-[#141414] hover:bg-[#ededed]"
                @click="removeQuestion(idx)"
              >
                ×
              </button>
            </div>
          </div>

          <button
            type="button"
            class="mt-3 min-h-[42px] rounded-xl border border-[#e3e3e3] bg-white px-4 py-2 text-sm text-[#141414] hover:bg-[#ededed]"
            @click="addQuestion"
          >
            ＋ 新增問題
          </button>
        </section>

        <label class="mt-3 block text-[13px] font-semibold">
          性別條件（選填）
          <select
            v-model="form.genderRule"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          >
            <option value="">不限，不提供性別資料</option>
            <option value="女性">女性</option>
            <option value="男性">男性</option>
          </select>
        </label>

        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="block text-[13px] font-semibold">
            最低年齡（選填）
            <input
              v-model="form.minAge"
              type="number"
              min="0"
              max="120"
              class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
            />
          </label>
          <label class="block text-[13px] font-semibold">
            最高年齡（選填）
            <input
              v-model="form.maxAge"
              type="number"
              min="0"
              max="120"
              class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
            />
          </label>
        </div>
      </section>

      <!-- 個人任務專屬設定 -->
      <section v-else>
        <label class="mt-3 block text-[13px] font-semibold">
          完成條件
          <input
            v-model="form.condition"
            maxlength="300"
            required
            placeholder="怎樣算完成這次任務？"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>

        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="block text-[13px] font-semibold">
            開放時間
            <input
              v-model="form.openFrom"
              type="datetime-local"
              required
              class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
            />
          </label>
          <label class="block text-[13px] font-semibold">
            截止時間
            <input
              v-model="form.openUntil"
              type="datetime-local"
              required
              class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
            />
          </label>
        </div>

        <label class="mt-3 block text-[13px] font-semibold">
          建議花費時間
          <input
            v-model="form.duration"
            maxlength="60"
            placeholder="例如：20 分鐘"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>

        <label class="mt-3 block text-[13px] font-semibold">
          完成分享引導
          <textarea
            v-model="form.sharePrompt"
            maxlength="600"
            placeholder="例如：今天觀察到什麼？"
            class="mt-1.5 block min-h-[84px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>

        <label class="mt-3 block text-[13px] font-semibold">
          預估自行花費（選填）
          <input
            v-model="form.estimatedCost"
            maxlength="120"
            class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
          />
        </label>

        <small class="mt-2 block text-xs text-[#737373]">
          期間內可不限次數完成。發布者每次完成須分享；一般參與者可只記錄完成。
        </small>
      </section>

      <label class="mt-3 block text-[13px] font-semibold">
        準備／攜帶物品
        <textarea
          v-model="form.equipment"
          maxlength="500"
          class="mt-1.5 block min-h-[84px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
        />
      </label>

      <label class="mt-3 block text-[13px] font-semibold">
        注意事項、其他資格或限制
        <textarea
          v-model="form.restrictions"
          maxlength="1000"
          class="mt-1.5 block min-h-[84px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
        />
      </label>

      <label class="mt-3 block text-[13px] font-semibold">
        標籤（逗號分隔）
        <input
          v-model="form.tags"
          maxlength="100"
          class="mt-1.5 block w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] font-normal text-[#141414] sm:text-sm"
        />
      </label>

      <button
        type="submit"
        class="mt-6 min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#333333] sm:w-auto"
      >
        發布任務
      </button>
    </form>
  </div>
</template>
