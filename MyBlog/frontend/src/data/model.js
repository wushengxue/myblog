export const STORAGE_KEYS = {
  users: 'myblog.users',
  currentUser: 'myblog.currentUser',
  theme: 'myblog.theme',
  articles: 'myblog.articles',
  history: 'myblog.history',
  comments: 'myblog.comments',
  aiChats: 'myblog.aiChats',
  subscriptions: 'myblog.subscriptions',
  notifications: 'myblog.notifications',
  codes: 'myblog.codes',
  questions: 'myblog.questions',
  drafts: 'myblog.drafts',
  annotations: 'myblog.annotations',
  tags: 'myblog.tags',
  fontSize: 'myblog.fontSize',
}

export const MAX_AI_CONTEXT_LENGTH = 4000
export const contentTypes = [
  { id: 'article', name: '文章', label: '写文章' },
  { id: 'code', name: '代码', label: '写代码' },
  { id: 'question', name: '问题', label: '提问题' },
]
export const visibilityOptions = [
  { id: 'public', name: '公开', description: '所有人都可以浏览、搜索和推荐' },
  { id: 'private', name: '仅自己可见', description: '只有作者本人可以查看' },
  { id: 'subscribers', name: '仅订阅者可见', description: '作者本人和订阅者可以查看' },
]

export const initialUsers = [
  {
    id: 'user-demo',
    name: '林默',
    phone: '13800138000',
    idCard: '110101199001011234',
    email: 'demo@yejian.space',
    password: 'Demo123456',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
]

export const tags = [
  { id: 'slow-life', name: '慢生活', count: 2 },
  { id: 'thinking', name: '思考', count: 2 },
  { id: 'design', name: '设计', count: 1 },
  { id: 'technology', name: '技术', count: 1 },
  { id: 'reading', name: '阅读', count: 2 },
]

export const getStoredTags = () => readCollection(STORAGE_KEYS.tags, tags)
export const saveTags = (value) => saveCollection(STORAGE_KEYS.tags, value)

export const initialArticles = [
  {
    id: 'attention',
    title: '把注意力还给真正重要的事',
    summary: '我们总在被提醒、被打断、被新的消息带走。也许真正稀缺的不是时间，而是一次完整的注意。',
    author: { id: 'user-demo', name: '林默', bio: '写字，也观察生活的纹理。' },
    tagIds: ['slow-life', 'thinking'],
    publishedAt: '2026-09-04',
    readingTime: '8 分钟阅读',
    views: 1284,
    coverStyle: 'clay',
    image: 'https://img1.daumcdn.net/thumb/R800x0/?fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbMqdVo%2FbtsNh39OC1I%2Fo5YzjRLeZ52LYdetpV1h91%2Fimg.jpg&scode=mtistory2',
    imageAlt: '阳光下的安静阅读角落',
    sections: [
      { id: 'why-attention', title: '我们为什么越来越难以专注', body: ['注意力从来不是一个无限供给的资源。每一次切换窗口、查看消息、接受一个新的刺激，都会让我们暂时离开正在做的事。', '当生活被很多细小的提醒切成碎片，我们会误以为自己一直很忙，却很少真正抵达一件事的内部。'] },
      { id: 'make-space', title: '给重要的事留出空间', body: ['留出空间并不意味着把日程清空，而是提前决定什么不需要被回应。把手机放远一点，把一天中最清醒的时间留给长期的工作，也留给不带目的的阅读。'] },
      { id: 'small-practice', title: '从一个小练习开始', body: ['今天可以只做一件事：在开始前写下你希望完成的唯一结果。完成之后再打开其他窗口，再去处理那些同样重要、但不必现在发生的事情。'] },
    ],
  },
  {
    id: 'ordinary-days',
    title: '在普通日子里，练习发现',
    summary: '生活并不总是发生大事。我们可以从一杯茶的温度、一段路的光线里，重新认识正在经过的日子。',
    author: { id: 'user-demo', name: '林默', bio: '写字，也观察生活的纹理。' },
    tagIds: ['slow-life', 'reading'],
    publishedAt: '2026-09-02',
    readingTime: '6 分钟阅读',
    views: 896,
    coverStyle: 'sage',
    image: 'https://images.squarespace-cdn.com/content/v1/61f40d8a2e502807e56e2a04/1714413786384-KQPX8L0JOH0USVE930UO/6977278ae3019f165f7d6c3949c2e1d9.jpg',
    imageAlt: '极简工作室里的阅读场景',
    sections: [
      { id: 'ordinary-is-rich', title: '普通不是贫乏', body: ['我们常常把生活的价值寄托在少数高光时刻，却忘记大多数时间都由平常构成。平常不是等待发生什么，而是事情正在以更轻的声音发生。'] },
      { id: 'notice-details', title: '重新看见细节', body: ['当你愿意慢下来，窗台的灰尘、邻居的脚步和晚饭升起的热气，都会从背景里浮出来。观察不是为了给生活增加意义，而是承认意义原本就在这里。'] },
    ],
  },
  {
    id: 'designing-silence',
    title: '设计一间让人安静下来的房间',
    summary: '好的空间不会急着表达自己，它让人逐渐听见自己的声音。关于光线、留白和物件关系的记录。',
    author: { id: 'user-demo', name: '林默', bio: '写字，也观察生活的纹理。' },
    tagIds: ['design', 'thinking'],
    publishedAt: '2026-08-27',
    readingTime: '10 分钟阅读',
    views: 1532,
    coverStyle: 'blue',
    image: 'https://www.karlpichler.it/wp-content/uploads/2024/11/Penelope-CLEAF-800x600.jpg',
    imageAlt: '光线与留白构成的极简室内',
    sections: [
      { id: 'space-speaks', title: '空间会先于语言说话', body: ['进入一个房间的几秒钟，我们已经感受到它的节奏。是拥挤还是松弛，是明亮还是沉静，这些感受常常来自我们还没有意识到的细节。'] },
      { id: 'leave-blank', title: '留白不是空无一物', body: ['留白把选择权交还给使用者。它允许物件之间保留距离，也允许人在其中停留，而不需要立刻被某种风格说服。'] },
    ],
  },
  {
    id: 'slow-tools',
    title: '写给想把事情做好的人：少一点工具',
    summary: '工具应该让工作变得清晰，而不是让我们不断管理工具本身。整理一套轻量、可靠的个人工作方式。',
    author: { id: 'user-demo', name: '林默', bio: '写字，也观察生活的纹理。' },
    tagIds: ['technology', 'reading'],
    publishedAt: '2026-08-21',
    readingTime: '7 分钟阅读',
    views: 741,
    coverStyle: 'ochre',
    image: 'https://www.rstudio.co.jp/_next/image/?q=100&url=https%3A%2F%2Fwww.rstudio.co.jp%2Fassets%2Fuploads%2F2024%2F01%2F1773115135-bf0d302f6129f1dc951aedf75a88d022.jpg&w=3840',
    imageAlt: '自然光下的简洁工作空间',
    sections: [
      { id: 'tools-are-means', title: '工具只是手段', body: ['每一种新工具都会带来新的可能，也会带来新的维护成本。真正值得留下的工具，是那些让你更快回到工作本身的工具。'] },
      { id: 'build-a-system', title: '建立能被重复的系统', body: ['一个好的系统不需要每天重新发明。它应该足够简单，可以在疲惫的时候继续工作，也足够清楚，让你知道下一步要做什么。'] },
    ],
  },
]

export const initialComments = [
  { id: 'comment-1', articleId: 'attention', userName: '周末读者', content: '“把注意力还给真正重要的事”这句话很有力量，读完之后我关掉了两个不必要的提醒。', createdAt: '2026-09-05' },
  { id: 'comment-2', articleId: 'attention', userName: '陈一', content: '喜欢文章里关于给重要的事留空间的部分，准备从每天早上的一小时开始。', createdAt: '2026-09-05' },
  { id: 'comment-3', articleId: 'ordinary-days', userName: '小满', content: '普通的日子也值得被认真记录。', createdAt: '2026-09-03' },
]

export const initialCodes = [
  {
    id: 'code-reading-room',
    type: 'code',
    title: '一个轻量的阅读进度记录器',
    description: '用原生 JavaScript 记录阅读进度，适合放进个人工具箱。',
    language: 'JavaScript',
    code: `const progress = new Map()\n\nexport function markRead(articleId, percent) {\n  progress.set(articleId, Math.min(100, Math.max(0, percent)))\n  return progress.get(articleId)\n}`,
    author: { id: 'user-demo', name: '林默', bio: '写字，也观察生活的纹理。' },
    tagIds: ['technology', 'reading'],
    publishedAt: '2026-09-03',
    views: 318,
    visibility: 'public',
    status: 'published',
  },
]

export const initialQuestions = [
  {
    id: 'question-writing',
    type: 'question',
    title: '如何建立一个能长期坚持的写作习惯？',
    content: '我常常有很多想法，但很难持续把它们整理成完整内容。大家是如何让写作变成日常，而不是偶尔发生的事情？',
    author: { id: 'user-demo', name: '林默', bio: '写字，也观察生活的纹理。' },
    tagIds: ['thinking', 'reading'],
    publishedAt: '2026-09-01',
    views: 204,
    visibility: 'public',
    status: 'published',
  },
]

export const readCollection = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : fallback
  } catch {
    return fallback
  }
}

export const saveCollection = (key, value) => localStorage.setItem(key, JSON.stringify(value))
export const getStoredUsers = () => {
  const users = new Map(initialUsers.map((user) => [user.id, user]))
  readCollection(STORAGE_KEYS.users, []).forEach((user) => users.set(user.id, user))
  return [...users.values()]
}
export const getStoredArticles = () => {
  const stored = readCollection(STORAGE_KEYS.articles, [])
  if (!stored.length) return initialArticles
  return stored.map((article) => ({ ...initialArticles.find((seed) => seed.id === article.id), type: 'article', visibility: 'public', status: 'published', ...article }))
}
export const getStoredCodes = () => {
  const stored = readCollection(STORAGE_KEYS.codes, [])
  if (!stored.length) return initialCodes
  return stored.map((item) => ({ ...initialCodes.find((seed) => seed.id === item.id), ...item }))
}
export const getStoredQuestions = () => {
  const stored = readCollection(STORAGE_KEYS.questions, [])
  if (!stored.length) return initialQuestions
  return stored.map((item) => ({ ...initialQuestions.find((seed) => seed.id === item.id), ...item }))
}
export const readCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser)) || null
  } catch {
    return null
  }
}

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
export const isValidPhone = (value) => /^1[3-9]\d{9}$/.test(value)
export const isValidIdCard = (value) => /^(?:\d{15}|\d{17}[\dXx])$/.test(value)
export const getTagName = (tagId) => getStoredTags().find((tag) => tag.id === tagId)?.name || tagId
