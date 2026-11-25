<script setup>
import { reactive, ref } from 'vue'
import { useAppStore } from '../../stores/appStore.js'
import { ageOf, today } from '../../utils/helpers.js'
import AvatarCropper from '../AvatarCropper.vue'

const store = useAppStore()
const info = store.state.profile || {
  name: '林以安',
  bio: '喜歡散步、紙張，以及和有趣的人一起做事。',
}

const cropperRef = ref(null)
const cropLoading = ref(false)

const form = reactive({
  avatar: info.avatar || '',
  regions: info.regions || '',
  sex: info.sex || '',
  dob: info.dob || '',
  confirmDob: false,
  name: info.name || '林以安',
  bio: info.bio || '',
})

const hasLockedDob = !!info.dob
const sexOptions = ['女性', '男性', '其他', '不願透露']

function onSubmit() {
  if (cropLoading.value) {
    store.showToast('照片處理中，請稍候。')
    return
  }
  cropperRef.value?.ensureApplied()
  store.saveProfile({
    name: form.name,
    regions: form.regions,
    sex: form.sex,
    dob: form.dob,
    confirmDob: form.confirmDob,
    bio: form.bio,
    avatar: form.avatar,
  })
}
</script>

<template>
  <div>
    <h2 class="mb-3 text-[23px] font-bold leading-snug">編輯資料</h2>
    <form class="space-y-3" @submit.prevent="onSubmit">
      <AvatarCropper
        ref="cropperRef"
        v-model="form.avatar"
        @loading-change="cropLoading = $event"
      />

      <div>
        <label for="profile-regions" class="mb-1 block text-[13px] font-medium">
          活動地區（縣市／行政區，可用逗號分隔）
        </label>
        <input
          id="profile-regions"
          v-model="form.regions"
          required
          maxlength="120"
          placeholder="例如：台北市、新北市板橋區"
          class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] text-[#141414] sm:text-sm"
        />
      </div>

      <div>
        <label for="profile-sex" class="mb-1 block text-[13px] font-medium">
          生理性別
        </label>
        <select
          id="profile-sex"
          v-model="form.sex"
          required
          class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] text-[#141414] sm:text-sm"
        >
          <option value="">請選擇</option>
          <option v-for="v in sexOptions" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>

      <div v-if="hasLockedDob">
        <label class="mb-1 block text-[13px] font-medium">年齡</label>
        <p class="m-0 text-sm text-[#333333]">
          {{ ageOf(info.dob) }} 歲 · 出生日期已鎖定，不可修改
        </p>
      </div>

      <template v-else>
        <div>
          <label for="profile-dob" class="mb-1 block text-[13px] font-medium">
            出生年月日
          </label>
          <input
            id="profile-dob"
            v-model="form.dob"
            type="date"
            min="1900-01-01"
            :max="today()"
            required
            class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] text-[#141414] sm:text-sm"
          />
          <p class="mt-1.5 text-[13px] font-semibold text-[#333333]">
            出生年月日只能填寫一次，確認後無法修改。其他人不會看到完整日期。
          </p>
        </div>

        <label class="flex items-center gap-2.5 text-[13px]">
          <input
            v-model="form.confirmDob"
            type="checkbox"
            required
            class="h-[18px] w-[18px] shrink-0 accent-[#161616]"
          />
          <span>我已確認出生年月日正確，了解送出後無法修改</span>
        </label>
      </template>

      <div>
        <label for="display-name" class="mb-1 block text-[13px] font-medium">
          顯示名稱
        </label>
        <input
          id="display-name"
          v-model="form.name"
          required
          maxlength="24"
          class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] text-[#141414] sm:text-sm"
        />
      </div>

      <div>
        <label for="profile-bio" class="mb-1 block text-[13px] font-medium">
          簡介
        </label>
        <textarea
          id="profile-bio"
          v-model="form.bio"
          maxlength="150"
          class="min-h-[90px] w-full resize-y rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] text-[#141414] sm:text-sm"
        />
      </div>

      <button
        type="submit"
        class="mt-3 min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
      >
        儲存
      </button>
    </form>
  </div>
</template>
