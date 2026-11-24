<script setup>
import { ref } from 'vue'
import { useAppStore } from '../stores/appStore.js'
import { usePwa } from '../composables/usePwa.js'

const store = useAppStore()
const pwa = usePwa()

const mode = ref('login')
const handle = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const submitting = ref(false)

function switchMode(next) {
  mode.value = next
  errorMsg.value = ''
}

async function onSubmit() {
  errorMsg.value = ''
  submitting.value = true
  try {
    if (mode.value === 'register') {
      await store.registerAccount({
        handle: handle.value,
        email: email.value,
        password: password.value,
      })
    } else {
      await store.loginAccount({
        email: email.value,
        password: password.value,
      })
    }
  } catch (err) {
    errorMsg.value = err?.message || '無法完成操作。'
  } finally {
    submitting.value = false
  }
}

function onInstallClick() {
  pwa.triggerInstall(() => store.openModal('pwaInstall'))
}
</script>

<template>
  <div
    class="min-h-[100dvh] px-3 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))] sm:px-4"
  >
    <main class="mx-auto w-full max-w-[460px] py-4 sm:py-6">
      <!-- 未登入：登入／註冊畫面 -->
      <section
        v-if="!store.isAuthenticated.value"
        class="rounded-[18px] border border-[#e3e3e3] bg-white p-5 sm:p-[26px]"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-[30px] font-extrabold tracking-tight text-[#141414]">
            wantoo ↗
          </span>
          <button
            v-if="!pwa.isStandalone.value"
            type="button"
            class="min-h-[34px] rounded-full border border-[#e3e3e3] bg-[#fafafa] px-3 py-1 text-xs text-[#141414] hover:bg-[#ededed]"
            @click="onInstallClick"
          >
            ＋ 加到主畫面
          </button>
        </div>

        <h1 class="mt-6 mb-3 text-[25px] font-bold leading-snug tracking-tight">
          {{ mode === 'register' ? '建立帳號' : '歡迎回來' }}
        </h1>
        <p class="mb-4 text-[13px] text-[#737373] sm:text-sm">
          本機互動原型；請用測試信箱與測試密碼。沒有真實信件寄送或線上帳號。
        </p>

        <div class="my-4 flex gap-2">
          <button
            type="button"
            class="min-h-[38px] rounded-full border px-4 py-1.5 text-[13px] transition-colors"
            :class="
              mode === 'login'
                ? 'border-[#161616] bg-[#161616] text-white'
                : 'border-[#e3e3e3] bg-white text-[#141414] hover:bg-[#ededed]'
            "
            @click="switchMode('login')"
          >
            登入
          </button>
          <button
            type="button"
            class="min-h-[38px] rounded-full border px-4 py-1.5 text-[13px] transition-colors"
            :class="
              mode === 'register'
                ? 'border-[#161616] bg-[#161616] text-white'
                : 'border-[#e3e3e3] bg-white text-[#141414] hover:bg-[#ededed]'
            "
            @click="switchMode('register')"
          >
            註冊
          </button>
        </div>

        <form class="space-y-3" @submit.prevent="onSubmit">
          <div v-if="mode === 'register'">
            <label for="auth-handle" class="mb-1.5 block text-[13px] font-medium">
              唯一帳號名稱
            </label>
            <input
              id="auth-handle"
              v-model="handle"
              name="handle"
              pattern="[a-zA-Z0-9_]{3,24}"
              required
              minlength="3"
              maxlength="24"
              placeholder="3–24 位英文、數字或底線"
              class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] text-[#141414] sm:text-sm"
            />
          </div>

          <div>
            <label for="auth-email" class="mb-1.5 block text-[13px] font-medium">
              電子郵件
            </label>
            <input
              id="auth-email"
              v-model="email"
              name="email"
              type="email"
              required
              autocomplete="email"
              class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] text-[#141414] sm:text-sm"
            />
          </div>

          <div>
            <label for="auth-password" class="mb-1.5 block text-[13px] font-medium">
              密碼
            </label>
            <input
              id="auth-password"
              v-model="password"
              name="password"
              type="password"
              required
              minlength="8"
              :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
              class="w-full rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] px-3 py-2.5 text-[16px] text-[#141414] sm:text-sm"
            />
          </div>

          <button
            type="submit"
            :disabled="submitting"
            class="mt-3 min-h-[46px] w-full rounded-xl border border-[#161616] bg-[#161616] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#333333] disabled:opacity-50"
          >
            {{ mode === 'register' ? '建立測試帳號' : '登入' }}
          </button>
        </form>

        <div class="mt-3 flex items-center justify-between">
          <button
            type="button"
            class="min-h-[40px] rounded-xl border-0 bg-transparent px-2 text-[13px] text-[#737373] hover:bg-[#ededed] hover:text-[#141414]"
            @click="store.openModal('resetPassword')"
          >
            忘記密碼
          </button>
          <button
            type="button"
            class="min-h-[40px] rounded-xl border-0 bg-transparent px-2 text-[13px] text-[#737373] hover:bg-[#ededed] hover:text-[#141414]"
            @click="store.openModal('rules')"
          >
            原型說明 ↗
          </button>
        </div>

        <p v-if="errorMsg" role="alert" class="mt-2 text-[13px] font-semibold text-[#333333]">
          {{ errorMsg }}
        </p>
      </section>

      <!-- 已登入但尚未完成個人檔案 -->
      <section
        v-else
        class="rounded-[18px] border border-[#e3e3e3] bg-white p-5 sm:p-[26px]"
      >
        <span class="text-[28px] font-extrabold tracking-tight text-[#141414]">
          wantoo ↗
        </span>
        <h1 class="mt-5 mb-3 text-[25px] font-bold leading-snug">建立你的個人檔案</h1>
        <p class="mb-6 text-sm leading-relaxed text-[#555555]">
          團體任務報名前，你可以確認將提供給發布者的基本資訊。出生年月日確認後無法修改，其他項目日後仍可編輯。
        </p>
        <div class="flex flex-wrap gap-2.5">
          <button
            type="button"
            class="min-h-[46px] flex-1 rounded-xl border border-[#161616] bg-[#161616] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#333333]"
            @click="store.openModal('editProfile')"
          >
            填寫個人檔案
          </button>
          <button
            type="button"
            class="min-h-[46px] rounded-xl border-0 bg-transparent px-4 py-2.5 text-sm text-[#737373] hover:bg-[#ededed] hover:text-[#141414]"
            @click="store.signOut()"
          >
            登出
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
