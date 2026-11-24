// 共用輔助函式：日期驗證、密碼雜湊與任務狀態判斷

export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ageOf(dob, now = new Date()) {
  const [y, m, d] = String(dob || '')
    .split('-')
    .map(Number)
  if (!y || !m || !d) return null
  return (
    now.getFullYear() -
    y -
    (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)
      ? 1
      : 0)
  )
}

export function validBirth(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value <= '1899-12-31' || value > today()) {
    return false
  }
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bytes = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  )
  return Array.from(new Uint8Array(bytes), (x) => x.toString(16).padStart(2, '0')).join('')
}

export function personalOpen(task, now = new Date()) {
  return (
    (!task.openFrom || now >= new Date(task.openFrom)) &&
    (!task.openUntil || now <= new Date(task.openUntil))
  )
}

export function isTaskFull(task) {
  return task.type !== 'personal' && !!task.capacity && task.people >= task.capacity
}

export function hasTaskActivity(task) {
  return task.joined || ['pending', 'declined'].includes(task.application?.status)
}

export function isRecordEntry(entry) {
  return !!entry?.record || Boolean(entry?.key?.startsWith('result:'))
}

export function formatShortTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function getMediaCreditSources(items) {
  return [...new Set((items || []).map((m) => m?.source).filter(Boolean))]
}
