<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { MAX_AI_CONTEXT_LENGTH, STORAGE_KEYS, getStoredArticles, getStoredCodes, getStoredQuestions, getStoredTags, getStoredUsers, initialComments, readCollection, readCurrentUser, saveCollection } from './data/model'
import { parseEditorSections } from './utils/helpers'
import { validateAiQuestion, validateComment, validateTagName } from './utils/validators'
import { AboutView, AuthView, BlogView, ContentDetail, EmptyBlock, HomeView, ListingView, StudioView } from './views'
import { api, apiEnabled } from './api/client'

const route = ref(parseRoute())
const currentUser = ref(readCurrentUser())
const storedTheme = localStorage.getItem(STORAGE_KEYS.theme)
const storedFontSize = localStorage.getItem(STORAGE_KEYS.fontSize)
const theme = ref(storedTheme === 'dark' ? 'dark' : 'light')
const fontSize = ref(['small', 'medium', 'large', 'xlarge'].includes(storedFontSize) ? storedFontSize : 'medium')
const preferencesOpen = ref(false)
const draftTheme = ref(theme.value)
const draftFontSize = ref(fontSize.value)
const preferencesError = ref('')
const fontSizeOptions = [
  { value: 'small', label: '小号', preview: '紧凑阅读' },
  { value: 'medium', label: '标准', preview: '推荐设置' },
  { value: 'large', label: '大号', preview: '舒适阅读' },
  { value: 'xlarge', label: '特大号', preview: '放大阅读' },
]
const themeOptions = [
  { value: 'light', label: '浅色模式', preview: '浅色背景，深色文字' },
  { value: 'dark', label: '深色模式', preview: '深色背景，浅色文字' },
]
const articles = ref(getStoredArticles().map((item) => ({ type: 'article', visibility: 'public', status: 'published', ...item })))
const codes = ref(getStoredCodes())
const questions = ref(getStoredQuestions())
const tags = ref(getStoredTags())
const comments = ref(readCollection(STORAGE_KEYS.comments, initialComments).map((item) => ({ contentId: item.contentId || item.articleId, ...item })))
const subscriptions = ref(readCollection(STORAGE_KEYS.subscriptions, []))
const drafts = ref(readCollection(STORAGE_KEYS.drafts, []))
const annotations = ref(readCollection(STORAGE_KEYS.annotations, []))
const history = ref(readCollection(STORAGE_KEYS.history, []))
const aiChats = ref(readCollection(STORAGE_KEYS.aiChats, []))
const detailCache = ref({})
const detailLoading = ref(false)
const detailError = ref('')
const apiStatus = ref(apiEnabled ? 'loading' : 'local')
const apiError = ref('')
const toast = ref('')
const searchInput = ref('')
const aiApiUrl = import.meta.env.VITE_AI_API_URL?.trim()
let toastTimer
const allContent = computed(() => [...articles.value, ...codes.value, ...questions.value])
const visibleContent = computed(() => allContent.value.filter((item) => item.status === 'published' && canView(item)))
const selected = computed(() => {
  const list = route.value.name === 'article' ? articles.value : route.value.name === 'code' ? codes.value : questions.value
  return list.find((item) => item.id === (route.value.id || route.value.type)) || detailCache.value[contentKey(route.value.name, route.value.id || route.value.type)]
})
const isLoggedHero = computed(() => route.value.name === 'home' && !!currentUser.value)

onMounted(async () => {
  window.addEventListener('hashchange', handleHashChange)
  promoteScheduled()
  await loadFromApi()
  await loadCurrentUserData()
  await loadRouteData(route.value)
})
watch(theme, (value) => { document.documentElement.dataset.theme = value; localStorage.setItem(STORAGE_KEYS.theme, value) }, { immediate: true })
watch(fontSize, (value) => { document.documentElement.dataset.fontSize = value; localStorage.setItem(STORAGE_KEYS.fontSize, value) }, { immediate: true })
watch([draftTheme, draftFontSize], ([nextTheme, nextFontSize]) => {
  if (nextTheme) document.documentElement.dataset.theme = nextTheme
  if (nextFontSize) document.documentElement.dataset.fontSize = nextFontSize
})
;[[articles, STORAGE_KEYS.articles], [codes, STORAGE_KEYS.codes], [questions, STORAGE_KEYS.questions], [tags, STORAGE_KEYS.tags], [comments, STORAGE_KEYS.comments], [subscriptions, STORAGE_KEYS.subscriptions], [drafts, STORAGE_KEYS.drafts], [annotations, STORAGE_KEYS.annotations], [history, STORAGE_KEYS.history], [aiChats, STORAGE_KEYS.aiChats]].forEach(([state, key]) => watch(state, (value) => saveCollection(key, value), { deep: true }))

function parseRoute() {
  const raw = window.location.hash.replace(/^#\/?/, '') || 'home'
  const [path, queryString = ''] = raw.split('?')
  const parts = path.split('/')
  return { name: parts[0], type: parts[1] || '', id: parts[2] || '', query: Object.fromEntries(new URLSearchParams(queryString)) }
}
function go(path) { window.location.hash = `/${path}` }
function notify(value) { toast.value = value; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.value = '' }, 2600) }
function handleHashChange() {
  route.value = parseRoute()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  loadRouteData(route.value)
}
function contentKey(type, id) { return `${type}:${id}` }
function listFor(type) { return type === 'article' ? articles.value : type === 'code' ? codes.value : questions.value }
function localMatch(item) {
  return [...articles.value, ...codes.value, ...questions.value].find((entry) => entry.id === item?.id && entry.type === item?.type)
}
function normalizeContent(item) {
  if (!item) return item
  const local = localMatch(item) || {}
  const type = item.type || local.type
  const content = item.content || local.content || ''
  return {
    ...local,
    ...item,
    type,
    tagIds: Array.isArray(item.tagIds) ? item.tagIds : (local.tagIds || []),
    author: item.author || local.author || { id: '', name: '未知作者', bio: '' },
    image: item.image || local.image || '',
    sections: type === 'article' ? parseEditorSections(content) : undefined,
    readingTime: type === 'article' ? (local.readingTime || `${Math.max(1, Math.ceil(content.replace(/\s/g, '').length / 450))} 分钟阅读`) : undefined,
  }
}
function replaceContent(item) {
  const next = normalizeContent(item)
  const list = listFor(next.type)
  const index = list.findIndex((entry) => entry.id === next.id)
  if (index >= 0) list.splice(index, 1, next)
  else list.unshift(next)
  detailCache.value[contentKey(next.type, next.id)] = next
  return next
}
async function loadFromApi() {
  if (!apiEnabled) {
    apiStatus.value = 'local'
    return
  }
  apiStatus.value = 'loading'
  apiError.value = ''
  try {
    const [content, remoteTags] = await Promise.all([api.content.list(), api.tags.list()])
    articles.value = content.filter((item) => item.type === 'article').map(normalizeContent)
    codes.value = content.filter((item) => item.type === 'code').map(normalizeContent)
    questions.value = content.filter((item) => item.type === 'question').map(normalizeContent)
    tags.value = remoteTags
    apiStatus.value = 'ready'
  } catch (error) {
    apiStatus.value = 'error'
    apiError.value = error.message || '后端数据加载失败'
    notify(apiError.value)
  }
}
async function loadCurrentUserData() {
  if (!apiEnabled || !currentUser.value) return
  try {
    const [remoteSubscriptions, remoteHistory] = await Promise.all([api.subscriptions.list(), api.history.list()])
    subscriptions.value = remoteSubscriptions
    history.value = remoteHistory
  } catch (error) {
    notify(error.message || '用户数据加载失败')
  }
}
async function loadRouteData(nextRoute) {
  if (!['article', 'code', 'question'].includes(nextRoute.name)) {
    detailLoading.value = false
    detailError.value = ''
    return
  }
  const id = nextRoute.id || nextRoute.type
  if (!id) {
    detailLoading.value = false
    detailError.value = '内容地址不完整'
    return
  }
  const key = contentKey(nextRoute.name, id)
  const cachedItem = detailCache.value[key] || listFor(nextRoute.name).find((item) => item.id === id)
  detailLoading.value = apiEnabled
  detailError.value = ''

  if (!apiEnabled) {
    detailLoading.value = false
    return
  }

  try {
    const item = replaceContent(await api.content.detail(nextRoute.name, id))
    await loadComments(item.id)
    detailError.value = ''
  } catch (error) {
    detailError.value = error.message || '内容加载失败，请重试'
    if (!cachedItem) notify(detailError.value)
  } finally {
    detailLoading.value = false
  }
}
async function loadComments(contentId) {
  if (!apiEnabled) return
  try {
    const remoteComments = await api.comments.list(contentId)
    comments.value = [...comments.value.filter((entry) => entry.contentId !== contentId), ...remoteComments]
  } catch (error) {
    notify(error.message || '评论加载失败')
  }
}
function openPreferences() {
  draftTheme.value = theme.value
  draftFontSize.value = fontSize.value
  preferencesError.value = ''
  preferencesOpen.value = true
}
function closePreferences() {
  draftTheme.value = theme.value
  draftFontSize.value = fontSize.value
  preferencesError.value = ''
  preferencesOpen.value = false
  document.documentElement.dataset.theme = theme.value
  document.documentElement.dataset.fontSize = fontSize.value
}
function confirmPreferences() {
  if (!draftFontSize.value) {
    preferencesError.value = '请选择字体大小'
    return
  }
  if (!draftTheme.value) {
    preferencesError.value = '请选择浅色或深色模式'
    return
  }
  fontSize.value = draftFontSize.value
  theme.value = draftTheme.value
  preferencesError.value = ''
  preferencesOpen.value = false
  notify('阅读设置已更新')
}
function tagName(id) { return tags.value.find((tag) => tag.id === id)?.name || id }
function canView(item) {
  if (!item) return false
  if (item.status === 'draft' || (item.status === 'scheduled' && new Date(item.scheduledAt).getTime() > Date.now())) return currentUser.value?.id === item.author?.id
  if (item.visibility === 'private') return currentUser.value?.id === item.author?.id
  if (item.visibility === 'subscribers') return currentUser.value?.id === item.author?.id || subscriptions.value.some((entry) => entry.authorId === item.author?.id && entry.subscriberId === currentUser.value?.id)
  return true
}
function promoteScheduled() { [articles.value, codes.value, questions.value].forEach((list) => list.forEach((item) => { if (item.status === 'scheduled' && new Date(item.scheduledAt).getTime() <= Date.now()) item.status = 'published' })) }
async function authAction(mode, values) {
  if (!apiEnabled) return null
  const payload = mode === 'register'
    ? { name: values.name, phone: values.phone, idCard: values.idCard, email: values.email, password: values.password }
    : { account: values.account, password: values.password }
  const response = await (mode === 'register' ? api.auth.register(payload) : api.auth.login(payload))
  return response.user
}
async function authSuccess(user) {
  const safe = { id: user.id, name: user.name, email: user.email, phone: user.phone, bio: user.bio }
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(safe))
  currentUser.value = safe
  await loadCurrentUserData()
  go('home')
}
function logout() { localStorage.removeItem(STORAGE_KEYS.currentUser); currentUser.value = null; go('home') }
function openHistory() { if (!currentUser.value) return notify('请先登录后查看阅读历史'); go('history') }
function submitSearch() { if (searchInput.value.trim()) go(`search?q=${encodeURIComponent(searchInput.value.trim())}`) }
async function openContent(item) {
  if (!canView(item)) return notify(item.visibility === 'subscribers' ? '此内容仅对订阅者开放' : '此内容暂不可访问')
  const nextItem = normalizeContent(item)
  detailCache.value[contentKey(nextItem.type, nextItem.id)] = nextItem
  if (!apiEnabled) nextItem.views = (nextItem.views || 0) + 1

  const userId = currentUser.value?.id || 'guest'
  const historyItem = { id: `${userId}-${nextItem.type}-${nextItem.id}`, userId, contentType: nextItem.type, contentId: nextItem.id, viewedAt: new Date().toISOString() }
  history.value = [historyItem, ...history.value.filter((entry) => !(entry.userId === userId && entry.contentId === nextItem.id))].slice(0, 30)

  // 先切换路由，详情页再负责刷新后端数据，避免网络请求阻塞点击反馈。
  go(`${nextItem.type}/${nextItem.id}`)

  if (apiEnabled && currentUser.value) {
    try {
      const saved = await api.history.add(nextItem.type, nextItem.id)
      history.value = [saved, ...history.value.filter((entry) => entry.id !== historyItem.id && !(entry.userId === saved.userId && entry.contentId === saved.contentId))]
    } catch (error) {
      notify(error.message || '阅读历史保存失败')
    }
  }
}
async function createTag(name) {
  const error = validateTagName(name, tags.value)
  if (error) throw new Error(error)
  if (apiEnabled) {
    const tag = await api.tags.create(name.trim())
    tags.value.push(tag)
    return tag
  }
  const tag = { id: `${name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, name: name.trim(), count: 0 }
  tags.value.push(tag)
  return tag
}
async function saveContent(data, publish, id = '') {
  if (apiEnabled) {
    const payload = {
      type: data.type,
      title: data.title,
      summary: data.summary || '',
      content: data.type === 'question' ? data.description : data.content,
      description: data.description || '',
      code: data.code || '',
      language: data.language || '',
      image: data.image || '',
      tagIds: data.tagIds,
      visibility: data.visibility || 'public',
      status: publish ? (data.publishMode === 'scheduled' ? 'scheduled' : 'published') : 'draft',
      scheduledAt: data.scheduledAt || null,
    }
    const saved = replaceContent(await api.content.save(payload, id))
    drafts.value = drafts.value.filter((entry) => entry.id !== id && entry.id !== saved.id)
    return saved
  }
  const list = listFor(data.type); const now = new Date().toISOString()
  const item = { ...data, id: id || `${data.type}-${Date.now()}`, author: { id: currentUser.value.id, name: currentUser.value.name, bio: currentUser.value.bio || `${currentUser.value.name} 的页间记录。` }, views: data.views || 0, updatedAt: now, publishedAt: publish && data.publishMode !== 'scheduled' ? (data.publishedAt || now) : data.publishedAt, status: publish ? (data.publishMode === 'scheduled' ? 'scheduled' : 'published') : 'draft', sections: data.type === 'article' ? parseEditorSections(data.content) : undefined, readingTime: data.type === 'article' ? `${Math.max(1, Math.ceil(data.content.replace(/\s/g, '').length / 450))} 分钟阅读` : undefined }
  const index = list.findIndex((entry) => entry.id === item.id)
  if (index >= 0) list.splice(index, 1, item); else list.unshift(item)
  drafts.value = drafts.value.filter((entry) => entry.id !== id)
  return item
}
function saveDraft(draft) { const next = { ...draft, id: draft.id || `draft-${Date.now()}`, status: 'draft', updatedAt: new Date().toISOString() }; const index = drafts.value.findIndex((entry) => entry.id === next.id); if (index >= 0) drafts.value.splice(index, 1, next); else drafts.value.unshift(next); notify('草稿已保存') }
function removeDraft(id) { const index = drafts.value.findIndex((entry) => entry.id === id); if (index >= 0) drafts.value.splice(index, 1) }
async function deleteContent(item) {
  if (!currentUser.value || item.author?.id !== currentUser.value.id || !window.confirm('确认删除这项内容吗？删除后不可恢复。')) return
  try {
    if (apiEnabled) await api.content.remove(item.type, item.id)
    const list = listFor(item.type)
    const index = list.findIndex((entry) => entry.id === item.id)
    if (index >= 0) list.splice(index, 1)
    notify('内容已删除')
    go(`blog/${currentUser.value.id}`)
  } catch (error) {
    notify(error.message || '删除失败，请重试')
  }
}
async function subscribe(authorId) {
  if (!currentUser.value) return go('login')
  if (subscriptions.value.some((entry) => entry.authorId === authorId && entry.subscriberId === currentUser.value.id)) return notify('已订阅该作者')
  if (!window.confirm('确认订阅这位作者吗？')) return
  try {
    const saved = apiEnabled ? await api.subscriptions.create(authorId) : { id: `sub-${Date.now()}`, authorId, subscriberId: currentUser.value.id, createdAt: new Date().toISOString() }
    subscriptions.value.push(saved)
    notify('订阅成功')
  } catch (error) {
    notify(error.message || '订阅失败，请重试')
  }
}
async function addComment(item, content) {
  if (!currentUser.value) throw new Error('登录后才能发表评论')
  const error = validateComment(content)
  if (error) throw new Error(error)
  const saved = apiEnabled
    ? await api.comments.create(item.id, content.trim())
    : { id: `comment-${Date.now()}`, contentId: item.id, userId: currentUser.value.id, userName: currentUser.value.name, content: content.trim(), createdAt: new Date().toISOString() }
  comments.value.push(saved)
  return saved
}
function addAnnotation(data) { annotations.value.push({ ...data, id: `annotation-${Date.now()}`, userId: currentUser.value.id, createdAt: new Date().toISOString() }) }
function buildAiContext(item) {
  const sections = (item.sections || []).map((section) => [
    section.title,
    ...(section.body || []),
    ...(section.blocks || []).flatMap((block) => block.items || [block.text]),
  ].filter(Boolean).join('\n')).join('\n\n')
  return [`标题：${item.title}`, item.summary || item.description || '', item.content || item.code || '', sections]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, MAX_AI_CONTEXT_LENGTH)
}
async function askAi(item, selectedText, question) {
  const validationError = validateAiQuestion(question)
  if (validationError) throw new Error(validationError)

  const context = buildAiContext(item)
  const cleanQuestion = question.trim()
  let answer

  if (aiApiUrl) {
    const response = await fetch(aiApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: cleanQuestion,
        selectedText: selectedText.trim().slice(0, 500),
        context,
        article: { id: item.id, title: item.title, type: item.type },
      }),
    })
    if (!response.ok) throw new Error(`AI 服务请求失败（${response.status}）`)
    const data = await response.json()
    if (!data?.answer || typeof data.answer !== 'string') throw new Error('AI 服务未返回有效回答')
    answer = data.answer.trim()
  } else if (apiEnabled) {
    const response = await api.ai.answer({
      question: cleanQuestion,
      selectedText: selectedText.trim().slice(0, 500),
      context,
      article: { id: item.id, title: item.title, type: item.type },
    })
    answer = response.answer
  } else {
    await new Promise((resolve) => setTimeout(resolve, 700))
    answer = `${selectedText ? `你选中的“${selectedText.slice(0, 70)}”` : `结合《${item.title}》`}可以这样理解：先确认它在文章中的上下文，再把观点转成一个可执行的小动作。针对“${cleanQuestion}”，建议从文中最贴近你当前场景的一段开始验证。这是本地模拟回答。`
  }

  const record = {
    id: `ai-${Date.now()}`,
    articleId: item.id,
    contentType: item.type,
    userId: currentUser.value?.id || 'guest',
    question: cleanQuestion,
    selectedText: selectedText.trim().slice(0, 500),
    answer,
    contextLength: context.length,
    createdAt: new Date().toISOString(),
  }
  aiChats.value.unshift(record)
  return record
}
</script>

<template>
  <div class="app-shell" :class="{ 'logged-home-shell': isLoggedHero }">
    <header v-if="route.name !== 'blog'" class="site-header">
      <button class="brand" @click="go('home')"><span class="brand-mark">页</span><span>YEJIAN</span></button>
      <nav class="main-nav"><button @click="go('home')">首页</button><button @click="go('topics')">分类</button><button @click="openHistory">阅读历史</button><button v-if="currentUser" @click="go('create')">创作</button><button v-if="currentUser" @click="go(`blog/${currentUser.id}`)">我的博客</button></nav>
      <div class="header-actions"><form class="header-search" @submit.prevent="submitSearch"><span>⌕</span><input v-model="searchInput" placeholder="搜索内容"></form><button class="preference-trigger" type="button" title="打开阅读设置" @click="openPreferences"><span class="preference-trigger-icon">Aa</span><span class="preference-trigger-label">阅读设置</span></button><button v-if="!currentUser" class="header-login" @click="go('login')">登录</button><div v-else class="user-menu"><span class="user-avatar">{{ currentUser.name.slice(0,1) }}</span><span class="user-name">{{ currentUser.name }}</span><button class="text-button" @click="logout">退出</button></div></div>
    </header>
    <main class="page-container">
      <HomeView v-if="route.name === 'home'" :items="visibleContent" :current-user="currentUser" :tag-name="tagName" @go="go" @open="openContent" />
      <AuthView v-else-if="route.name === 'login' || route.name === 'register'" :mode="route.name" :auth-action="apiEnabled ? authAction : null" @success="authSuccess" @go="go" />
      <ContentDetail v-else-if="['article','code','question'].includes(route.name)" :item="selected" :loading="detailLoading" :error="detailError" :current-user="currentUser" :comments="comments" :annotations="annotations" :ai-chats="aiChats" :tag-name="tagName" :ask-ai-action="askAi" :comment-action="addComment" @go="go" @retry="loadRouteData(route)" @subscribe="subscribe" @delete="deleteContent" />
      <ListingView v-else-if="['topics','search','history'].includes(route.name)" :mode="route.name" :items="visibleContent" :tags="tags" :history="history" :current-user="currentUser" :query="route.query" :tag-name="tagName" @go="go" @open="openContent" />
      <StudioView v-else-if="['create','publish','write-code','ask','drafts','annotate','edit'].includes(route.name)" :route="route" :current-user="currentUser" :items="allContent" :drafts="drafts" :tags="tags" :articles="articles" :annotations="annotations" :tag-name="tagName" :save-content="saveContent" :create-tag-action="createTag" @go="go" @save-draft="saveDraft" @delete-draft="removeDraft" @annotation="addAnnotation" @update-annotation="(id, content) => { const item = annotations.find((entry) => entry.id === id); if (item) item.content = content }" @delete-annotation="(id) => { const index = annotations.findIndex((entry) => entry.id === id); if (index >= 0) annotations.splice(index, 1) }" />
      <BlogView v-else-if="route.name === 'blog'" :author-id="route.type || route.id" :items="visibleContent" :current-user="currentUser" :subscriptions="subscriptions" :tag-name="tagName" @go="go" @open="openContent" @subscribe="subscribe" @delete="deleteContent" />
      <AboutView v-else-if="route.name === 'about'" @go="go" />
      <section v-else class="content-page"><EmptyBlock title="页面不存在" description="这个地址没有对应内容。" action="回到首页" @action="go('home')" /></section>
    </main>
    <footer v-if="route.name !== 'blog'" class="site-footer"><span>页间 / 内容先于喧哗</span><span>© 2026</span></footer>
    <div v-if="preferencesOpen" class="preferences-backdrop" @click.self="closePreferences">
      <section class="preferences-panel" role="dialog" aria-modal="true" aria-labelledby="preferences-title">
        <div class="preferences-head">
          <div><p class="eyebrow">READING ENVIRONMENT</p><h2 id="preferences-title">阅读设置</h2></div>
          <button class="panel-close" type="button" aria-label="关闭阅读设置" @click="closePreferences">×</button>
        </div>
        <form @submit.prevent="confirmPreferences">
          <fieldset class="preference-group">
            <legend>字体大小</legend>
            <div class="preference-options font-options">
              <label v-for="option in fontSizeOptions" :key="option.value" class="preference-option" :class="{ selected: draftFontSize === option.value }">
                <input v-model="draftFontSize" type="radio" name="font-size" :value="option.value">
                <span class="preference-option-copy"><strong>{{ option.label }}</strong><small>{{ option.preview }}</small></span>
                <span class="preference-check">{{ draftFontSize === option.value ? '✓' : '' }}</span>
              </label>
            </div>
            <p v-if="preferencesError === '请选择字体大小'" class="field-error">{{ preferencesError }}</p>
          </fieldset>
          <fieldset class="preference-group">
            <legend>主题模式</legend>
            <div class="preference-options theme-options">
              <label v-for="option in themeOptions" :key="option.value" class="preference-option" :class="{ selected: draftTheme === option.value }">
                <input v-model="draftTheme" type="radio" name="theme" :value="option.value">
                <span class="preference-theme-swatch" :class="`swatch-${option.value}`"></span>
                <span class="preference-option-copy"><strong>{{ option.label }}</strong><small>{{ option.preview }}</small></span>
                <span class="preference-check">{{ draftTheme === option.value ? '✓' : '' }}</span>
              </label>
            </div>
            <p v-if="preferencesError === '请选择浅色或深色模式'" class="field-error">{{ preferencesError }}</p>
          </fieldset>
          <div class="preferences-preview"><span>当前预览</span><p>字号和主题会同步应用到文章、评论、AI 回答、代码说明与导航文字。</p></div>
          <div class="preferences-actions"><button class="secondary-button" type="button" @click="closePreferences">取消</button><button class="submit-button" type="submit">确认设置 <span>↗</span></button></div>
        </form>
      </section>
    </div>
    <div v-if="toast" class="global-toast">{{ toast }}</div>
  </div>
</template>
