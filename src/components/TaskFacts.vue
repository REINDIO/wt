<script setup>
defineProps({
  task: {
    type: Object,
    required: true,
  },
})

function feeLabel(t) {
  const base =
    t.feeKind === 'fixed'
      ? `NT$ ${t.feeAmount ?? 0}`
      : t.feeKind === 'split'
        ? '實際費用均攤'
        : '免費'
  return t.feeNote ? `${base} ${t.feeNote}` : base
}

function reviewLabel(t) {
  if (t.reviewMode === 'yes') return '問卷審核'
  if (t.reviewMode === 'review') return '發布者審核'
  return '直接加入'
}
</script>

<template>
  <dl
    class="my-4 grid grid-cols-[85px_1fr] sm:grid-cols-[110px_1fr] gap-x-2 gap-y-2 text-[13px]"
  >
    <template v-if="task.type === 'personal'">
      <dt class="text-[#777777]">開放期間</dt>
      <dd class="m-0 whitespace-pre-wrap break-words">
        {{ task.openFrom || '未設定' }} ～ {{ task.openUntil || '未設定' }}
      </dd>

      <dt class="text-[#777777]">完成條件</dt>
      <dd class="m-0 whitespace-pre-wrap break-words">
        {{ task.condition || '依內容完成一次' }}
      </dd>

      <template v-if="task.duration">
        <dt class="text-[#777777]">建議時間</dt>
        <dd class="m-0 whitespace-pre-wrap break-words">{{ task.duration }}</dd>
      </template>

      <template v-if="task.estimatedCost">
        <dt class="text-[#777777]">預估自行花費</dt>
        <dd class="m-0 whitespace-pre-wrap break-words">{{ task.estimatedCost }}</dd>
      </template>
    </template>

    <template v-else>
      <dt class="text-[#777777]">時間</dt>
      <dd class="m-0 whitespace-pre-wrap break-words">
        {{ task.startAt || task.date }}{{ task.endAt ? ' ～ ' + task.endAt : '' }}
      </dd>

      <dt class="text-[#777777]">費用</dt>
      <dd class="m-0 whitespace-pre-wrap break-words">{{ feeLabel(task) }}</dd>

      <dt class="text-[#777777]">加入方式</dt>
      <dd class="m-0 whitespace-pre-wrap break-words">{{ reviewLabel(task) }}</dd>

      <template v-if="task.genderRule">
        <dt class="text-[#777777]">性別條件</dt>
        <dd class="m-0 whitespace-pre-wrap break-words">{{ task.genderRule }}</dd>
      </template>

      <template v-if="task.minAge || task.maxAge">
        <dt class="text-[#777777]">年齡條件</dt>
        <dd class="m-0 whitespace-pre-wrap break-words">
          {{ task.minAge || 0 }}～{{ task.maxAge || '不限' }} 歲
        </dd>
      </template>
    </template>

    <template v-if="task.region">
      <dt class="text-[#777777]">地區</dt>
      <dd class="m-0 whitespace-pre-wrap break-words">{{ task.region }}</dd>
    </template>

    <template v-if="task.equipment">
      <dt class="text-[#777777]">攜帶／準備</dt>
      <dd class="m-0 whitespace-pre-wrap break-words">{{ task.equipment }}</dd>
    </template>

    <template v-if="task.restrictions">
      <dt class="text-[#777777]">注意事項／限制</dt>
      <dd class="m-0 whitespace-pre-wrap break-words">{{ task.restrictions }}</dd>
    </template>
  </dl>
</template>
