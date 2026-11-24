// WANTOO 預設示範資料與帳號常數（與原版 localStorage 結構完全相容）

export const TASK_TYPES = {
  group: '團體',
  personal: '個人',
}

export const BASE_ACCOUNTS = {
  陳小山: 'shan',
  吳沐: 'mu',
  周雨: 'rain',
  林以安: 'yian',
}

function photo(id, alt) {
  return {
    type: 'image',
    src: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1000`,
    source: `https://www.pexels.com/photo/${id}/`,
    name: alt,
  }
}

export const DEMO_PHOTOS = {
  badminton: photo(2202685, '室內羽球活動示意照'),
  gallery: photo(7763082, '藝廊展覽示意照'),
  study: photo(16420473, '圖書館共同學習示意照'),
  book: photo(5649423, '閱讀與準備教材示意照'),
  movie: photo(7991398, '電影院座位示意照'),
  walk: photo(6771677, '彩色街屋示意照'),
  mountain: photo(26318930, '山間健行示意照'),
  sea: photo(7267675, '海岸示意照'),
}

const ORIGINAL_COVERS = [
  DEMO_PHOTOS.mountain,
  DEMO_PHOTOS.walk,
  DEMO_PHOTOS.gallery,
  DEMO_PHOTOS.sea,
  DEMO_PHOTOS.book,
  DEMO_PHOTOS.study,
]

const EXTRA_DEMOS = [
  {
    demoKey: 'badminton',
    type: 'activity',
    title: '週六打羽球，找四位一起流汗的球友',
    desc: '週六下午 2 點到 4 點，輪流打雙打。不追求競技，能來回接球就可以。請自備球拍、室內運動鞋與水壺，場地與球費依實際支出均分。集合資訊會在任務群組確認。',
    place: '台北・運動中心（示例）',
    date: '2026-11-07',
    owner: '陳小山',
    people: 2,
    capacity: 6,
    reviewMode: 'review',
    questions: [],
    media: [DEMO_PHOTOS.badminton],
  },
  {
    demoKey: 'gallery',
    type: 'coop',
    title: '一起辦一場「日常切片」小型展覽',
    desc: '從策展、作品徵集到現場佈置，用四週完成一場週末展覽。希望找到攝影、平面設計、文字編輯與現場執行夥伴。每週一次線上會議，展前一起進場佈置；預算與分工先討論再確認。',
    place: '校園藝文空間（示例）',
    date: '2026-11-28',
    owner: '吳沐',
    people: 2,
    capacity: 6,
    reviewMode: 'yes',
    questions: [
      '你希望負責哪一部分？有哪些相關經驗或作品？',
      '接下來四週，每週大約可以投入多少時間？',
      '你是否能參與展前佈置及展覽當天的現場工作？',
    ],
    media: [DEMO_PHOTOS.gallery],
  },
  {
    demoKey: 'bookclub',
    type: 'activity',
    title: '週日下午讀書會：帶一本最近喜歡的書',
    desc: '不用讀同一本書，也不需要準備簡報。每人用十分鐘分享一段喜歡的文字，再一起討論。第一次參加也歡迎，尊重彼此，不批評閱讀品味。',
    place: '社區閱讀空間（示例）',
    date: '2026-11-08',
    owner: '周雨',
    people: 3,
    capacity: 8,
    reviewMode: 'yes',
    questions: ['你想分享哪一本書？', '有沒有想和大家討論的主題？'],
    media: [DEMO_PHOTOS.study],
  },
  {
    demoKey: 'competition',
    type: 'coop',
    title: '校內永續提案競賽，徵跨領域隊友',
    desc: '以減少校園一次性用品為題，完成使用者訪談、方案設計與提案簡報。這是原型示例競賽，不是真實招生。期待找到願意做研究、設計或簡報的夥伴，每週至少開一次討論會。',
    place: '線上',
    date: '2026-11-21',
    owner: '吳沐',
    people: 1,
    capacity: 4,
    reviewMode: 'yes',
    questions: [
      '你擅長研究、設計、企劃或簡報中的哪一項？',
      '你對校園永續有什麼觀察或提案？',
      '每週可投入多少時間？能否配合最後一週彩排？',
    ],
    media: [DEMO_PHOTOS.study, DEMO_PHOTOS.gallery],
  },
  {
    demoKey: 'reading',
    type: 'personal',
    title: '今晚讀 20 頁，把手機放遠一點',
    desc: '選一本還沒讀完的書，給自己半小時安靜閱讀。完成後在交流區留下一句你想記住的話，不比較進度。',
    place: '不限地點',
    date: '2026-11-01',
    owner: '周雨',
    people: 9,
    reviewMode: 'notes',
    questions: ['你今天打算讀哪一本書？', '你想留下什麼閱讀目標或備註？'],
    media: [DEMO_PHOTOS.book],
  },
  {
    demoKey: 'movie',
    type: 'personal',
    title: '今天看一部電影，留下三句感想',
    desc: '自己選片、自己安排時間。片尾結束後寫下：最喜歡的一幕、一句感想、一個還想繼續想的問題。請尊重著作權，不上傳電影片段；可以分享自己拍的電影票或手寫筆記。',
    place: '不限地點',
    date: '2026-11-02',
    owner: '陳小山',
    people: 7,
    reviewMode: 'notes',
    questions: ['想看哪一部電影？'],
    media: [DEMO_PHOTOS.movie],
  },
  {
    demoKey: 'colorwalk',
    type: 'personal',
    title: '今天玩 Color Walk：帶著一個顏色散步',
    desc: '選一個今天的顏色，散步 20 分鐘，找出五個同色物件。可以是招牌、花、窗框或地上的小細節。拍下自己的發現，整理成一份色彩紀錄；注意交通，也尊重路人的隱私。',
    place: '你所在的街區',
    date: '2026-11-03',
    owner: '周雨',
    people: 12,
    reviewMode: 'notes',
    questions: ['今天選了什麼顏色？'],
    media: [DEMO_PHOTOS.walk],
  },
]

export function createSeedState() {
  const baseTasks = [
    {
      id: 1001,
      type: 'activity',
      title: '把週末留給山，走一段抹茶綠',
      desc: '不用走得很快，一起走就好。從步道入口出發，在山頂喝一杯熱茶，交換最近生活裡的小發現。適合有基礎健行經驗的你。',
      place: '宜蘭・礁溪',
      date: '2026-11-07',
      owner: '陳小山',
      icon: '⛰',
      people: 5,
      joined: false,
      status: '招募中',
    },
    {
      id: 1002,
      type: 'coop',
      title: '一起做一本，城市散步小誌',
      desc: '尋找喜歡攝影、寫字與排版的夥伴。用四個週末，記錄那些你捨不得錯過的街角。一起討論分工，完成一本數位小誌。',
      place: '台北／線上',
      date: '2026-11-14',
      owner: '吳沐',
      icon: '▧',
      people: 3,
      joined: false,
      status: '招募中',
    },
    {
      id: 1003,
      type: 'personal',
      title: '用 21 天，重新找回畫畫的手感',
      desc: '每天畫一件身邊的小物，不追求完美，只練習看見。歡迎一起挑戰，在成果交流區分享你的進度。',
      place: '不限地點',
      date: '2026-11-01',
      owner: '周雨',
      icon: '✎',
      people: 12,
      joined: false,
      status: '招募中',
    },
    {
      id: 1004,
      type: 'activity',
      title: '日落前，還給海一片乾淨',
      desc: '帶上水壺與手套，一起整理沙灘，也留一點時間看夕陽。集合與天候調整在任務群組討論。',
      place: '新北・淺水灣',
      date: '2026-11-08',
      owner: '林以安',
      icon: '≈',
      people: 8,
      joined: true,
      status: '進行中',
    },
    {
      id: 1005,
      type: 'personal',
      title: '我的第一本手工書',
      desc: '從紙張、裝訂到封面，完成一件屬於自己的小作品。',
      place: '家裡的工作桌',
      date: '2026-10-03',
      owner: '林以安',
      icon: '▤',
      people: 1,
      joined: true,
      status: '已完成',
      reflection:
        '原來慢下來，才能感受到紙的紋理。學會了基礎線裝，也練習接受不完美的第一件作品。',
      public: true,
    },
    {
      id: 1006,
      type: 'coop',
      title: '為街角咖啡店設計一張海報',
      desc: '和朋友一起練習訪談、攝影與視覺設計。',
      place: '台北',
      date: '2026-09-20',
      owner: '吳沐',
      icon: '◒',
      people: 3,
      joined: true,
      status: '已完成',
      reflection: '第一次把訪談的故事轉成設計，發現傾聽比畫圖更重要。',
      public: false,
    },
  ]

  baseTasks.forEach((task, i) => {
    task.media = [structuredClone(ORIGINAL_COVERS[i])]
  })

  const extraTasks = EXTRA_DEMOS.map((demo, i) => ({
    ...structuredClone(demo),
    id: 1101 + i,
    icon: '',
    joined: false,
    status: '招募中',
  }))

  const state = {
    tasks: [...baseTasks, ...extraTasks],
    friends: [
      { name: '吳沐', state: 'friend' },
      { name: '周雨', state: 'incoming' },
      { name: '陳小山', state: 'none' },
    ],
    messages: {
      'task-1004': [
        { name: '陳小山', text: '期待一起看見更乾淨的海！我會帶多的手套。' },
      ],
      'dm-吳沐': [
        { name: '吳沐', text: '上次合作很開心，下次再一起做點什麼吧！' },
      ],
    },
    demoMediaVersion: 1,
  }

  return normalizeTasksState(state)
}

/**
 * 補齊範例任務與舊資料欄位轉換，確保升級資料不遺失
 */
export function normalizeTasksState(state) {
  if (!state.demoMediaVersion) {
    const seed = createSeedState()
    const used = new Set(state.tasks.map((t) => t.id))
    for (const demo of seed.tasks.filter((t) => t.demoKey)) {
      if (!state.tasks.some((x) => x.demoKey === demo.demoKey)) {
        const copy = structuredClone(demo)
        while (used.has(copy.id)) copy.id++
        used.add(copy.id)
        state.tasks.push(copy)
      }
    }
    state.tasks
      .filter((t) => t.id >= 1001 && t.id <= 1006 && !t.media)
      .forEach((t) => {
        t.media = [structuredClone(ORIGINAL_COVERS[t.id - 1001])]
      })
    state.demoMediaVersion = 1
  }

  state.tasks.forEach((t) => {
    if (t.type === 'activity' || t.type === 'coop') {
      t.type = 'group'
    }
    if (t.type === 'personal') {
      t.openFrom ??= '2026-01-01T00:00'
      t.openUntil ??= '2027-12-31T23:59'
      t.condition ??= '依任務內容完成一次行動'
      t.completions ??= []
      t.feed ??= []
      t.queries ??= []
      t.faq ??= []
      if (t.reflection && !t.legacyConverted) {
        t.completions.unshift({
          id: 'legacy-' + t.id,
          text: t.reflection,
          media: t.resultMedia || [],
          time: t.date + 'T12:00:00',
          public: !!t.public,
          shared: false,
        })
        t.legacyConverted = true
      }
      t.status = '開放中'
    }
  })

  return state
}
