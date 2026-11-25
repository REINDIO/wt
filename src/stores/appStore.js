import { reactive, ref, computed } from 'vue'
import { BASE_ACCOUNTS, createSeedState, normalizeTasksState } from '../data/seed.js'
import {
  ageOf,
  hasTaskActivity,
  isTaskFull,
  passwordHash,
  personalOpen,
  validBirth,
} from '../utils/helpers.js'
import { restoreMedia } from '../utils/media.js'

const AUTH_KEY = 'wantoo-accounts-v1'
const SESSION_KEY = 'wantoo-session'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function loadInitialGlobalState() {
  const parsed = readJSON('wantoo-v1', null)
  if (parsed?.tasks && parsed?.friends && parsed?.messages) {
    return normalizeTasksState(parsed)
  }
  return createSeedState()
}

// 建立全域單例狀態（讓所有頁面與彈窗元件共享響應式狀態）
const authUsers = ref(readJSON(AUTH_KEY, []))
const currentUser = ref(
  authUsers.value.find((u) => u.id === sessionStorage.getItem(SESSION_KEY)) || null
)

const state = reactive(loadInitialGlobalState())

// UI 導覽與暫存狀態
const page = ref('explore')
const query = ref('')
const cardIndex = ref(0)
const expandedTaskId = ref(null)
const activeRoom = ref(null)
const activeFriend = ref(null)
const friendsTab = ref('messages')
const editingFriends = ref(false)
const viewingFriendName = ref(null)
const friendProfileTab = ref('journeys')
const friendProfileReturnPage = ref('friends')
const visitorMode = ref(false)
const profileTab = ref('portfolio')
const profileFocusKey = ref(null)
const journeyListScroll = ref(0)

// Toast 與 Modal 狀態
const toastMessage = ref('')
let toastTimer = null

const modal = reactive({
  type: null,
  props: {},
})

function showToast(msg) {
  toastMessage.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3200)
}

function openModal(type, props = {}) {
  modal.type = type
  modal.props = props
}

function closeModal() {
  modal.type = null
  modal.props = {}
}

function saveAuth() {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authUsers.value))
  } catch {
    showToast('無法儲存帳號資料。')
  }
}

function replaceState(nextState) {
  Object.keys(state).forEach((k) => delete state[k])
  Object.assign(state, nextState)
}

function saveState() {
  try {
    const storageKey = currentUser.value
      ? 'wantoo-state-' + currentUser.value.id
      : 'wantoo-v1'
    localStorage.setItem(storageKey, JSON.stringify(state))
    return true
  } catch {
    showToast('瀏覽器無法儲存，目前操作僅保留至頁面關閉。')
    return false
  }
}

function accountsMap() {
  return {
    ...BASE_ACCOUNTS,
    林以安: currentUser.value?.handle || 'yian',
  }
}

function displayName(name) {
  return name === '林以安' ? state.profile?.name || name : name
}

function taskActivityTime(t) {
  return Math.max(
    Number(t.activityAt) || 0,
    ...(state.messages['task-' + t.id] || []).map((m) => Date.parse(m.time) || 0),
    ...(t.feed || []).filter((f) => f.shared !== false).map((f) => Date.parse(f.time) || 0)
  )
}

function touchTaskActivity(t) {
  const sequence =
    Math.max(
      Number(state.activitySequence) || 0,
      ...state.tasks.map((x) => Number(x.activitySequence) || 0)
    ) + 1
  state.activitySequence = sequence
  t.activitySequence = sequence
  t.activityAt = Date.now()
}

function nav(targetPage) {
  if (targetPage === 'community') activeRoom.value = null
  if (targetPage !== page.value) {
    activeRoom.value = null
    activeFriend.value = null
    expandedTaskId.value = null
    profileFocusKey.value = null
    editingFriends.value = false
  }
  page.value = targetPage
  if (['explore', 'community', 'friends', 'profile'].includes(targetPage)) {
    try {
      history.replaceState(null, '', '#' + targetPage)
    } catch {
      // ignore
    }
  }
  window.scrollTo(0, 0)
}

function syncFromHash() {
  const hash = window.location.hash.replace(/^#/, '')
  if (['explore', 'community', 'friends', 'profile'].includes(hash)) {
    page.value = hash
  }
}

function loadUser(user) {
  currentUser.value = user
  sessionStorage.setItem(SESSION_KEY, user.id)
  let loaded = readJSON('wantoo-state-' + user.id, null)
  if (!loaded && authUsers.value.length === 1) {
    loaded = readJSON('wantoo-v1', null)
  }
  if (!loaded?.tasks || !loaded?.friends || !loaded?.messages) {
    loaded = createSeedState()
  }
  normalizeTasksState(loaded)
  replaceState(loaded)
  visitorMode.value = false
  profileFocusKey.value = null
  activeRoom.value = null
  activeFriend.value = null
  restoreMedia(state, showToast)
  syncFromHash()
  if (!['explore', 'community', 'friends', 'profile'].includes(page.value)) {
    page.value = 'explore'
  }
}

function signOut() {
  saveState()
  sessionStorage.removeItem(SESSION_KEY)
  currentUser.value = null
  closeModal()
  page.value = 'explore'
}

// ===== 認證相關操作 =====
async function registerAccount({ handle, email, password }) {
  const cleanHandle = handle.trim().toLowerCase()
  const cleanEmail = email.trim().toLowerCase()
  if (!/^[a-z0-9_]{3,24}$/.test(cleanHandle)) {
    throw new Error('帳號格式不符。')
  }
  const existingHandles = Object.values(accountsMap())
  if (
    authUsers.value.some((u) => u.email === cleanEmail || u.handle === cleanHandle) ||
    existingHandles.includes(cleanHandle)
  ) {
    throw new Error('信箱或帳號已使用。')
  }
  const salt = crypto.randomUUID()
  const user = {
    id: crypto.randomUUID(),
    email: cleanEmail,
    handle: cleanHandle,
    salt,
    hash: await passwordHash(password, salt),
    verified: false,
  }
  authUsers.value.push(user)
  saveAuth()
  openModal('verify', { userId: user.id })
}

async function loginAccount({ email, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const user = authUsers.value.find((u) => u.email === cleanEmail)
  if (!user || (await passwordHash(password, user.salt)) !== user.hash) {
    throw new Error('信箱或密碼不正確。')
  }
  if (!user.verified) {
    openModal('verify', { userId: user.id })
  } else {
    loadUser(user)
  }
}

function completeVerification(userId) {
  const user = authUsers.value.find((u) => u.id === userId)
  if (!user) return
  user.verified = true
  saveAuth()
  closeModal()
  loadUser(user)
}

async function resetUserPassword({ email, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const user = authUsers.value.find((u) => u.email === cleanEmail)
  if (!user) {
    showToast('沒有這個本機測試帳號。')
    return false
  }
  user.salt = crypto.randomUUID()
  user.hash = await passwordHash(password, user.salt)
  saveAuth()
  closeModal()
  showToast('測試密碼已更新。')
  return true
}

// ===== 衍生計算屬性 =====
const isAuthenticated = computed(() => !!currentUser.value)
const isProfileComplete = computed(() => !!state.profile?.complete)
const isReady = computed(() => isAuthenticated.value && isProfileComplete.value)

const filteredTasks = computed(() => {
  const q = query.value.trim().toLocaleLowerCase().replace(/^[#@]/, '')
  const map = accountsMap()
  return state.tasks.filter(
    (t) =>
      (!t.joined || t.owner === '林以安') &&
      t.status !== '已完成' &&
      (!q ||
        [t.id, t.title, t.desc, t.owner, map[t.owner] || ''].some((v) =>
          String(v).toLocaleLowerCase().includes(q)
        ))
  )
})

const matchedAccounts = computed(() => {
  const q = query.value.trim().toLowerCase().replace(/^@/, '')
  if (!q) return []
  const map = accountsMap()
  return Object.keys(map).filter(
    (n) =>
      n.toLowerCase().includes(q) ||
      map[n].includes(q) ||
      (n === '林以安' && state.profile?.name?.toLowerCase().includes(q))
  )
})

const sortedActivityTasks = computed(() =>
  state.tasks
    .filter(hasTaskActivity)
    .sort(
      (a, b) =>
        (Number(b.activitySequence) || 0) - (Number(a.activitySequence) || 0) ||
        taskActivityTime(b) - taskActivityTime(a)
    )
)

const hasUnreadTaskActivity = computed(() =>
  state.tasks.some((t) => hasTaskActivity(t) && t.activityUnread)
)

const acceptedFriends = computed(() =>
  state.friends.filter((f) => f.state === 'friend')
)

const friendRequests = computed(() =>
  state.friends
    .filter((f) => ['incoming', 'pending'].includes(f.state))
    .sort((a, b) => (Date.parse(b.requestedAt) || 0) - (Date.parse(a.requestedAt) || 0))
)

const hasIncomingFriendRequest = computed(() =>
  state.friends.some((f) => f.state === 'incoming')
)

const profileEntries = computed(() => {
  const tasks = state.tasks.filter((t) => t.joined || t.participated)
  const journeys = []
  const privateEntries = []
  for (const t of tasks) {
    if (t.type === 'personal') {
      for (const r of t.completions || []) {
        const entry = {
          ...t,
          key: 'run:' + t.id + ':' + r.id,
          record: r,
          reflection: r.text || '完成了一次任務',
          resultMedia: r.media,
          public: r.public,
          date: (r.time || '').slice(0, 10),
        }
        ;(r.public ? journeys : privateEntries).push(entry)
      }
    } else if (t.reflection) {
      const entry = { ...t, key: 'result:' + t.id }
      ;(t.public ? journeys : privateEntries).push(entry)
    }
  }
  return { tasks, journeys, privateEntries }
})

// ===== 業務邏輯方法 =====
function snapshotFor(task) {
  const p = state.profile
  return {
    nickname: p.name,
    handle: currentUser.value?.handle || 'yian',
    avatar: p.avatar || '',
    age: ageOf(p.dob),
    regions: p.regions,
    bio: p.bio,
    sex: task.genderRule ? p.sex : undefined,
    sentAt: new Date().toISOString(),
  }
}

function previewMessage(key) {
  const task = state.tasks.find((t) => 'task-' + t.id === key)
  if (task && !task.joined && task.application) {
    return task.application.status === 'pending'
      ? '申請已送出，等待審核'
      : '申請未通過'
  }
  if (task?.type === 'personal') {
    const f = task.feed?.at(-1)
    return f ? `${f.name === '林以安' ? '你' : f.name}：${f.text}` : '尚無完成分享'
  }
  const m = (state.messages[key] || []).at(-1)
  return m
    ? `${m.name === '林以安' ? '你' : m.name}：${m.text || (m.media?.length ? '照片／影片' : '')}`
    : '尚無訊息'
}

function openTaskActivity(key) {
  const task = state.tasks.find((t) => 'task-' + t.id === key)
  if (task) {
    task.activityUnread = false
    saveState()
  }
  activeRoom.value = key
  if (page.value !== 'community') {
    page.value = 'community'
  }
}

function openAccountModal(name) {
  openModal('account', { name })
}

function openFriendProfile(name, returnTo = null) {
  if (name === '林以安') {
    visitorMode.value = false
    nav('profile')
    return
  }
  friendProfileReturnPage.value = returnTo || page.value
  viewingFriendName.value = name
  friendProfileTab.value = 'journeys'
  page.value = 'friendprofile'
  window.scrollTo(0, 0)
}

function openFriendChat(name) {
  friendsTab.value = 'messages'
  activeFriend.value = name
  page.value = 'friends'
}

function finishJoin(task) {
  if (isTaskFull(task)) {
    showToast('任務人數已滿，無法加入。')
    return
  }
  task.participated = true
  task.participationPublic = task.participationPublic !== false
  task.joined = true
  task.activityUnread = true
  touchTaskActivity(task)
  task.people++
  task.status = task.type === 'personal' ? '開放中' : '進行中'
  expandedTaskId.value = null
  saveState()
  showToast('已加入，可在任務交流區查看。')
}

function joinAfterDisclosure(taskId) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task || task.joined || task.status === '已完成') return
  if (isTaskFull(task)) {
    showToast('任務人數已滿。')
    return
  }
  if (task.type === 'personal') {
    if (!personalOpen(task)) {
      showToast('目前非任務開放期間。')
      return
    }
    delete task.application
    finishJoin(task)
    return
  }
  if (task.application?.status === 'pending') {
    openModal('pendingReview', { taskId })
    return
  }
  if (task.questions?.length) {
    openModal('questionnaire', { taskId, preview: false })
    return
  }
  if (task.reviewMode === 'review') {
    openModal('reviewApplication', { taskId })
    return
  }
  finishJoin(task)
}

function joinTask(taskId) {
  if (!isReady.value) return
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return
  if (task.owner === '林以安') {
    nav('community')
    openTaskActivity('task-' + task.id)
    return
  }
  if (task.joined) return
  if (task.type === 'personal' || task.application?.status === 'pending') {
    joinAfterDisclosure(taskId)
    return
  }
  if (task.deadline && new Date() > new Date(task.deadline)) {
    showToast('報名已截止。')
    return
  }
  const age = ageOf(state.profile.dob)
  if (
    (task.minAge && age < Number(task.minAge)) ||
    (task.maxAge && age > Number(task.maxAge))
  ) {
    showToast('目前不符合此任務的年齡條件。')
    return
  }
  if (task.genderRule && state.profile.sex !== task.genderRule) {
    showToast('目前不符合此任務的性別條件。')
    return
  }
  openModal('confirmSnapshot', {
    taskId,
    onConfirmed: () => joinAfterDisclosure(taskId),
  })
}

function commitApplicationSnapshot(taskId, onConfirmed) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return
  const snapshot = snapshotFor(task)
  task.snapshotHistory ??= []
  if (task.applicationSnapshot) {
    task.snapshotHistory.push(task.applicationSnapshot)
  }
  task.applicationSnapshot = structuredClone(snapshot)
  saveState()
  closeModal()
  onConfirmed?.()
}

function submitReviewApplication(taskId, note) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return
  task.application = {
    status: 'pending',
    answers: note ? [{ question: '申請留言', answer: note }] : [],
  }
  task.activityUnread = true
  touchTaskActivity(task)
  saveState()
  closeModal()
  showToast('已送出申請，等待發布者審核。')
}

function submitQuestionnaire(taskId, answers, skipped = false) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return
  const isPersonal = task.type === 'personal'
  if (isPersonal) {
    task.participationNotes = skipped ? [] : answers
    saveState()
    closeModal()
    finishJoin(task)
  } else {
    task.application = { status: 'pending', answers }
    task.activityUnread = true
    touchTaskActivity(task)
    saveState()
    closeModal()
    showToast('問卷已送出，等待發起人審核。')
  }
}

function simulateReviewResult(taskId, approve) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return
  if (approve) {
    if (isTaskFull(task)) {
      showToast('人數已滿，無法通過。')
      return
    }
    if (task.application) task.application.status = 'approved'
    activeRoom.value = null
    closeModal()
    finishJoin(task)
  } else {
    if (task.application) task.application.status = 'declined'
    task.activityUnread = true
    touchTaskActivity(task)
    activeRoom.value = null
    saveState()
    closeModal()
    showToast('模擬結果：申請未通過，可重新填答。')
  }
}

function publishTask(formPayload) {
  const isPersonal = formPayload.type === 'personal'
  const from = isPersonal ? formPayload.openFrom : formPayload.startAt
  const to = isPersonal ? formPayload.openUntil : formPayload.endAt

  if (!formPayload.title.trim() || !formPayload.desc.trim()) {
    showToast('請填寫名稱與內容。')
    return false
  }
  if (!from || !to || new Date(to) <= new Date(from)) {
    showToast('結束時間需晚於開始時間。')
    return false
  }
  if (isPersonal && !formPayload.condition?.trim()) {
    showToast('請填寫完成條件。')
    return false
  }
  if (!isPersonal && formPayload.deadline && new Date(formPayload.deadline) > new Date(formPayload.startAt)) {
    showToast('報名截止不能晚於開始時間。')
    return false
  }
  if (!isPersonal && formPayload.minAge && formPayload.maxAge && Number(formPayload.minAge) > Number(formPayload.maxAge)) {
    showToast('年齡上下限不正確。')
    return false
  }
  const capacity =
    !isPersonal && formPayload.capacity !== '' && formPayload.capacity !== null
      ? Number(formPayload.capacity)
      : null
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000)) {
    showToast('人數上限需為 1～10000。')
    return false
  }
  const questions =
    !isPersonal && formPayload.reviewMode === 'yes'
      ? formPayload.questions.map((q) => q.trim())
      : []
  if (!isPersonal && formPayload.reviewMode === 'yes' && (!questions.length || questions.some((q) => !q))) {
    showToast('請填寫至少一個問題。')
    return false
  }

  const nextId = Math.max(1000, ...state.tasks.map((t) => t.id)) + 1
  const newTask = {
    ...formPayload,
    id: nextId,
    title: formPayload.title.trim(),
    desc: formPayload.desc.trim(),
    date: from.slice(0, 10),
    capacity,
    media: [...(formPayload.media || [])],
    reviewMode: isPersonal ? 'no' : formPayload.reviewMode,
    questions,
    place:
      formPayload.locationMode === 'online'
        ? '線上'
        : formPayload.place?.trim() || '不限地點',
    owner: '林以安',
    people: 1,
    joined: true,
    participated: true,
    participationPublic: true,
    status: isPersonal ? '開放中' : '招募中',
    completions: [],
    feed: [],
    queries: [],
    faq: [],
    icon: '',
  }

  state.tasks.unshift(newTask)
  touchTaskActivity(newTask)
  saveState()
  nav('community')
  activeRoom.value = 'task-' + newTask.id
  showToast('任務已發布！')
  return true
}

function sendMessage(roomKey, text, media = []) {
  const cleanText = text.trim()
  if (!cleanText && !media.length) return false
  state.messages[roomKey] ??= []
  state.messages[roomKey].push({
    name: '林以安',
    text: cleanText,
    media: [...media],
    time: new Date().toISOString(),
  })
  const task = state.tasks.find((t) => 'task-' + t.id === roomKey)
  if (task) touchTaskActivity(task)
  saveState()
  return true
}

function publishAnnouncement(taskId, text, media = []) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task || task.owner !== '林以安' || !task.joined) return false
  const cleanText = text.trim()
  if (!cleanText) {
    showToast('請填寫公告內容。')
    return false
  }
  task.feed ??= []
  task.feed.push({
    id: crypto.randomUUID(),
    kind: 'announcement',
    name: '林以安',
    text: cleanText,
    media: [...media],
    time: new Date().toISOString(),
    shared: true,
  })
  touchTaskActivity(task)
  saveState()
  closeModal()
  showToast('公告已發佈。')
  return true
}

function completePersonalTask(taskId, { text, media, shared, isPublic }) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task || !task.joined) return false
  if (!personalOpen(task)) {
    showToast('任務已截止，無法新增完成紀錄。')
    return false
  }
  const owner = task.owner === '林以安'
  const cleanText = text.trim()
  const finalShared = owner || !!shared
  const finalPublic = !!isPublic
  if ((finalShared || finalPublic) && !cleanText) {
    showToast('分享時請留下一句心得。')
    return false
  }
  const record = {
    id: crypto.randomUUID(),
    text: cleanText,
    media: [...(media || [])],
    shared: finalShared,
    public: finalPublic,
    time: new Date().toISOString(),
  }
  task.completions ??= []
  task.completions.push(record)
  if (finalShared) {
    task.feed ??= []
    task.feed.push({ ...record, name: '林以安' })
    touchTaskActivity(task)
  }
  delete task.execution
  task.participated = true
  saveState()
  closeModal()
  showToast('已完成這次任務！')
  return true
}

function askPersonalQuestion(taskId, questionText) {
  const task = state.tasks.find((t) => t.id === taskId)
  const clean = questionText.trim()
  if (!task || !clean) return
  task.queries ??= []
  task.queries.push({ text: clean, time: new Date().toISOString(), reply: '' })
  saveState()
}

function replyPersonalQuestion(taskId, qIndex, replyText) {
  const task = state.tasks.find((t) => t.id === taskId)
  const clean = replyText.trim()
  if (!task?.queries?.[qIndex] || !clean) return
  task.queries[qIndex].reply = clean
  saveState()
}

function addPersonalFaq(taskId, q, a) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task || !q.trim() || !a.trim()) return
  task.faq ??= []
  task.faq.push({ q: q.trim(), a: a.trim() })
  saveState()
  showToast('已公開常見問答。')
}

function leaveTask(taskId) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task || task.owner === '林以安') return
  task.joined = false
  task.participated = true
  task.people = Math.max(0, task.people - 1)
  delete task.application
  saveState()
  closeModal()
  nav('community')
  showToast('已退出任務。')
}

function saveProfile({ name, regions, sex, dob, confirmDob, bio, avatar }) {
  const existing = state.profile || {}
  const cleanName = name.trim()
  const cleanRegions = regions.trim()
  const finalDob = existing.dob || dob

  if (!cleanName || !cleanRegions || !sex) {
    showToast('請填寫暱稱、活動地區與生理性別。')
    return false
  }
  if (!existing.dob && (!validBirth(finalDob) || !confirmDob)) {
    showToast('請填寫有效出生日期並確認。')
    return false
  }

  const wasComplete = !!existing.complete
  state.profile = {
    ...existing,
    name: cleanName,
    regions: cleanRegions,
    sex,
    dob: finalDob,
    complete: true,
    bio: bio.trim(),
    avatar,
  }
  saveState()
  closeModal()
  if (!wasComplete) {
    visitorMode.value = false
    nav('explore')
  }
  showToast('個人檔案已儲存。')
  return true
}

function saveTaskResult(taskId, { reflection, media, isPublic }) {
  const task = state.tasks.find((t) => t.id === taskId)
  const clean = reflection.trim()
  if (!task || !clean) {
    showToast('請先寫下一點成果與心得。')
    return false
  }
  task.resultMedia = [...(media || [])]
  task.reflection = clean
  task.public = !!isPublic
  task.status = '已完成'
  saveState()
  closeModal()
  showToast('成果已儲存。')
  return true
}

function savePersonalRecord(taskId, recordId, { text, media, isPublic }) {
  const task = state.tasks.find((t) => t.id === taskId)
  const record = task?.completions?.find((r) => r.id === recordId)
  if (!task || !record) return false
  const clean = text.trim()
  if ((record.shared || isPublic) && !clean) {
    showToast('公開或已分享的紀錄需要心得。')
    return false
  }
  record.text = clean
  record.public = !!isPublic
  record.media = [...(media || [])]
  const feedEntry = task.feed?.find((f) => f.id === record.id)
  if (feedEntry) {
    feedEntry.text = clean
    feedEntry.media = record.media
  }
  saveState()
  closeModal()
  profileFocusKey.value = null
  showToast('紀錄已更新。')
  return true
}

function toggleTaskParticipationPublic(taskId, nextValue) {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) return
  task.participationPublic =
    typeof nextValue === 'boolean' ? nextValue : task.participationPublic === false
  saveState()
  if (!task.participationPublic) {
    showToast('已隱藏任務，任務數已更新。')
  }
}

function handleFriendAction(name, action) {
  const person = state.friends.find((f) => f.name === name)
  if (!person) return
  if (action === 'request') {
    if (person.state === 'incoming') {
      person.state = 'friend'
    } else if (person.state === 'none') {
      person.requestedAt = new Date().toISOString()
      person.state = 'pending'
    }
  } else if (action === 'accept' && person.state === 'incoming') {
    person.state = 'friend'
  } else if (action === 'decline' && person.state === 'incoming') {
    person.state = 'none'
  } else if (action === 'cancel' && person.state === 'pending') {
    person.state = 'none'
  } else if (action === 'simulate' && person.state === 'pending') {
    person.state = 'friend'
  } else if (action === 'remove' && person.state === 'friend') {
    person.state = 'none'
    delete person.requestedAt
    if (activeFriend.value === name) activeFriend.value = null
    showToast('已刪除好友。')
  }
  saveState()
}

function resetDemoData() {
  const retainedProfile = state.profile ? structuredClone(state.profile) : undefined
  const fresh = createSeedState()
  if (retainedProfile) fresh.profile = retainedProfile
  replaceState(fresh)
  saveState()
  activeRoom.value = null
  activeFriend.value = null
  cardIndex.value = 0
  expandedTaskId.value = null
  query.value = ''
  profileFocusKey.value = null
  closeModal()
  showToast('已恢復示例資料。')
}

// 初始化：若已有有效 session 立刻載入使用者狀態，並監聽 hash 切換
if (currentUser.value) {
  loadUser(currentUser.value)
} else {
  restoreMedia(state, showToast)
  syncFromHash()
}

window.addEventListener('hashchange', () => {
  if (isReady.value) syncFromHash()
})

export function useAppStore() {
  return {
    state,
    authUsers,
    currentUser,
    isAuthenticated,
    isProfileComplete,
    isReady,
    page,
    query,
    cardIndex,
    expandedTaskId,
    activeRoom,
    activeFriend,
    friendsTab,
    editingFriends,
    viewingFriendName,
    friendProfileTab,
    friendProfileReturnPage,
    visitorMode,
    profileTab,
    profileFocusKey,
    journeyListScroll,
    toastMessage,
    modal,
    filteredTasks,
    matchedAccounts,
    sortedActivityTasks,
    hasUnreadTaskActivity,
    acceptedFriends,
    friendRequests,
    hasIncomingFriendRequest,
    profileEntries,
    accountsMap,
    displayName,
    previewMessage,
    snapshotFor,
    showToast,
    openModal,
    closeModal,
    nav,
    registerAccount,
    loginAccount,
    completeVerification,
    resetUserPassword,
    signOut,
    openTaskActivity,
    openAccountModal,
    openFriendProfile,
    openFriendChat,
    joinTask,
    joinAfterDisclosure,
    commitApplicationSnapshot,
    submitReviewApplication,
    submitQuestionnaire,
    simulateReviewResult,
    publishTask,
    sendMessage,
    publishAnnouncement,
    completePersonalTask,
    askPersonalQuestion,
    replyPersonalQuestion,
    addPersonalFaq,
    leaveTask,
    saveProfile,
    saveTaskResult,
    savePersonalRecord,
    toggleTaskParticipationPublic,
    handleFriendAction,
    resetDemoData,
  }
}
