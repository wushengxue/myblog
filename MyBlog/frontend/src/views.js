import { computed, onMounted, reactive, ref, watch } from 'vue'
import { contentTypes, getStoredUsers, STORAGE_KEYS, saveCollection, visibilityOptions } from './data/model'
import { formatDate, formatDateTime, formatRelativeDate } from './utils/helpers'
import { validateContentDraft } from './utils/validators'

export const EmptyBlock = {
  props: ['title', 'description', 'action'], emits: ['action'],
  template: `<div class="empty-state"><span class="empty-mark">—</span><h2>{{title}}</h2><p>{{description}}</p><button v-if="action" class="primary-button" @click="$emit('action')">{{action}} <span>↗</span></button></div>`,
}

const ContentCard = {
  props: ['item', 'tagName'], emits: ['open'],
  template: `<article class="article-card"><button class="card-cover-button" @click="$emit('open',item)"><div class="article-cover" :style="item.image ? {backgroundImage:'linear-gradient(135deg,rgba(24,22,19,.08),rgba(24,22,19,.48)),url('+item.image+')'} : {}"><span class="cover-number">{{item.type === 'article' ? 'NOTE' : item.type === 'code' ? 'CODE' : 'ASK'}}</span><span class="cover-caption">{{item.type === 'code' ? item.language : item.type.toUpperCase()}}</span></div></button><div class="card-content"><div class="tag-row"><span v-for="tag in item.tagIds" :key="tag" class="tag">{{tagName(tag)}}</span></div><button class="card-title" @click="$emit('open',item)">{{item.title}}</button><p>{{item.summary || item.description || item.content}}</p><div class="card-meta"><span>{{item.author.name}}</span><span>{{new Date(item.publishedAt || item.updatedAt).toLocaleDateString('zh-CN')}} · {{item.views || 0}} 阅读</span></div></div></article>`,
}

const HomeFeature = {
  props: ['item', 'tagName'], emits: ['open'],
  template: `<button v-if="item" class="home-feature feature-button" @click="$emit('open',item)"><div class="feature-label"><span>本周精选</span><span>01</span><span>↗</span></div><div class="article-cover" :style="item.image ? {backgroundImage:'linear-gradient(135deg,rgba(24,22,19,.08),rgba(24,22,19,.48)),url('+item.image+')'} : {}"><span class="cover-number">{{item.type === 'article' ? 'NOTE' : item.type === 'code' ? 'CODE' : 'ASK'}}</span><span class="cover-caption">{{item.type === 'code' ? item.language : tagName(item.tagIds[0])}}</span></div><div class="feature-meta"><p>精选内容</p><h2>{{item.title}}</h2><span>{{item.readingTime || item.language || '问题讨论'}} · {{item.views || 0}} 次阅读</span></div></button>`,
}

export const HomeView = {
  components: { ContentCard, HomeFeature }, props: ['items', 'currentUser', 'tagName'], emits: ['go', 'open'],
  setup() {
    const readingStart = ref(null)
    const heroReady = ref(false)
    onMounted(() => {
      requestAnimationFrame(() => { heroReady.value = true })
    })
    function scrollToReading() {
      readingStart.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    return { readingStart, heroReady, scrollToReading }
  },
  template: `<div class="home-page-root" :class="{'home-page-signed-in':currentUser}"><section v-if="currentUser" class="logged-home-hero" :class="{'hero-ready':heroReady}" style="--home-background:url('/blog-illustration.svg')"><div class="logged-home-motion"></div><div class="logged-home-wash"></div><div class="logged-home-grain"></div><p class="logged-home-corner logged-home-corner-left">YEJIAN / PERSONAL READING SPACE</p><p class="logged-home-corner logged-home-corner-right">{{String(items.length).padStart(2,'0')}} NOTES · 2026</p><div class="logged-home-center"><p class="logged-home-greeting">WELCOME BACK, {{currentUser.name}}</p><h1>在页间<br>慢下来</h1><p>让正在阅读的文字，带你回到更安静的地方。</p><button class="logged-home-enter" @click="scrollToReading">进入今日阅读 <span>↓</span></button></div><button class="logged-home-write" @click="$emit('go','create')">开始创作 <span>↗</span></button><button class="logged-home-scroll" @click="scrollToReading">向下阅读 <i></i></button></section><section ref="readingStart" class="content-page home-content"><div class="home-intro content-hero"><div><p class="eyebrow">A QUIET PLACE FOR IDEAS</p><h1>在页间，<br><em>慢一点</em>阅读。</h1><p class="intro-copy">记录思考，分享经验，和认真写字的人一起建立有温度的内容空间。</p><div class="home-actions"><button class="primary-button" @click="$emit('go','topics')">开始阅读 <span>↗</span></button><button v-if="!currentUser" class="link-button" @click="$emit('go','register')">加入页间</button></div></div><HomeFeature :item="items[0]" :tag-name="tagName" @open="$emit('open',$event)"/></div><section class="section-block"><div class="section-heading"><div><p class="eyebrow">EDITOR'S PICK</p><h2>精选文章</h2></div><button class="heading-action" @click="$emit('go','topics')">查看全部 <span>↗</span></button></div><div class="article-grid"><ContentCard v-for="item in items.slice(0,6)" :key="item.type+item.id" :item="item" :tag-name="tagName" @open="$emit('open',$event)"/></div></section></section></div>`,
}

export const AuthView = {
  props: ['mode', 'authAction'], emits: ['success', 'go'],
  setup(props, { emit }) {
    const values = reactive({ name: '', phone: '', idCard: '', email: '', password: '', confirmPassword: '', account: '' }); const errors = ref({}); const message = ref(''); const loading = ref(false)
    const register = computed(() => props.mode === 'register')
    async function submit() {
      const next = {}
      if (register.value) {
        if (values.name.trim().length < 2) next.name = '姓名至少需要 2 个字符'
        if (!/^1[3-9]\d{9}$/.test(values.phone)) next.phone = '请输入有效的 11 位手机号'
        if (!/^(?:\d{15}|\d{17}[\dXx])$/.test(values.idCard)) next.idCard = '请输入有效的身份证号'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = '请输入有效邮箱'
        if (values.password.length < 8) next.password = '密码至少需要 8 个字符'
        if (values.password !== values.confirmPassword) next.confirmPassword = '两次输入的密码不一致'
      } else { if (!values.account.trim()) next.account = '请输入手机号或邮箱'; if (!values.password) next.password = '请输入密码' }
      errors.value = next; if (Object.keys(next).length) return
      loading.value = true
      try {
        if (props.authAction) {
          emit('success', await props.authAction(register.value ? 'register' : 'login', { ...values }))
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 450))
        const users = getStoredUsers()
        if (register.value) {
          if (users.some((item) => item.phone === values.phone || item.email === values.email)) throw new Error('手机号或邮箱已注册')
          const user = { id: `user-${Date.now()}`, name: values.name.trim(), phone: values.phone, idCard: values.idCard.toUpperCase(), email: values.email.toLowerCase(), password: values.password, createdAt: new Date().toISOString() }
          saveCollection(STORAGE_KEYS.users, [...users, user])
          emit('success', user)
        } else {
          const user = users.find((item) => (item.phone === values.account || item.email === values.account.toLowerCase()) && item.password === values.password)
          if (!user) throw new Error('账号或密码错误，请检查后重试')
          emit('success', user)
        }
      } catch (error) {
        message.value = error.message || '请求失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }
    return { values, errors, message, loading, register, submit }
  },
  template: `<section class="auth-page"><div class="auth-aside"><span class="aside-number">{{register?'01':'02'}}</span><p>{{register?'WRITE YOURSELF INTO THE WORLD.':'WELCOME BACK TO YOUR READING ROOM.'}}</p></div><div class="auth-panel"><p class="eyebrow">{{register?'CREATE ACCOUNT':'SIGN IN'}}</p><h1>{{register?'创建你的页间账户':'欢迎回到页间'}}</h1><p class="auth-subtitle">{{register?'注册后即可评论、创作和订阅。':'登录后继续阅读你的内容。'}}</p><form @submit.prevent="submit"><template v-if="register"><label class="field"><span class="field-label">姓名 *</span><input v-model="values.name"><span class="field-error">{{errors.name}}</span></label><div class="form-grid"><label class="field"><span class="field-label">手机号 *</span><input v-model="values.phone"><span class="field-error">{{errors.phone}}</span></label><label class="field"><span class="field-label">身份证号 *</span><input v-model="values.idCard"><span class="field-error">{{errors.idCard}}</span></label></div><label class="field"><span class="field-label">邮箱 *</span><input v-model="values.email"><span class="field-error">{{errors.email}}</span></label><div class="form-grid"><label class="field"><span class="field-label">密码 *</span><input v-model="values.password" type="password"><span class="field-error">{{errors.password}}</span></label><label class="field"><span class="field-label">确认密码 *</span><input v-model="values.confirmPassword" type="password"><span class="field-error">{{errors.confirmPassword}}</span></label></div></template><template v-else><label class="field"><span class="field-label">账号 *</span><input v-model="values.account" placeholder="手机号或邮箱"><span class="field-error">{{errors.account}}</span></label><label class="field"><span class="field-label">密码 *</span><input v-model="values.password" type="password"><span class="field-error">{{errors.password}}</span></label></template><p v-if="message" class="form-message error-message">{{message}}</p><button class="submit-button" :disabled="loading">{{loading?'处理中…':register?'完成注册':'登录账户'}} <span>↗</span></button></form><p class="auth-switch">{{register?'已经有账户？':'还没有账户？'}} <button @click="$emit('go',register?'login':'register')">{{register?'立即登录':'创建账户'}}</button></p></div></section>`,
}

export const ListingView = {
  components: { ContentCard, EmptyBlock }, props: ['mode', 'items', 'tags', 'history', 'currentUser', 'query', 'tagName'], emits: ['go', 'open'],
  computed: {
    result() {
      if (this.mode === 'history') return this.history.filter((entry) => entry.userId === (this.currentUser?.id || 'guest')).map((entry) => this.items.find((item) => item.id === entry.contentId)).filter(Boolean)
      if (this.mode === 'search') { const q = (this.query.q || '').toLowerCase(); return this.items.filter((item) => [item.title, item.summary, item.description, item.content, item.author.name, ...item.tagIds.map(this.tagName)].join(' ').toLowerCase().includes(q)) }
      return this.query.tag ? this.items.filter((item) => item.tagIds.includes(this.query.tag)) : this.items
    },
    heading() { return this.mode === 'history' ? '最近读过' : this.mode === 'search' ? `关于“${this.query.q || ''}”` : '按主题阅读' },
  },
  template: `<section class="content-page listing-page"><div class="page-intro"><p class="eyebrow">{{mode==='search'?'SEARCH RESULTS':mode==='history'?'READING HISTORY':'EXPLORE CONTENT'}}</p><h1>{{heading}}</h1><p>{{mode==='history'?'这里保存最近打开过的文章、代码和问题。':mode==='search'?'在标题、正文、标签和作者中检索相关文章、代码和问题。':'从一个主题开始，找到与你正在思考的事情有关的内容。'}}</p></div><div v-if="mode==='topics'" class="topic-filter"><button :class="{active:!query.tag}" @click="$emit('go','topics')">全部 <small>{{items.length}}</small></button><button v-for="tag in tags" :key="tag.id" :class="{active:query.tag===tag.id}" @click="$emit('go','topics?tag='+tag.id)">{{tag.name}}</button></div><div v-if="result.length" class="article-grid listing-grid"><ContentCard v-for="item in result" :key="item.type+item.id" :item="item" :tag-name="tagName" @open="$emit('open',$event)"/></div><EmptyBlock v-else title="还没有相关内容" description="换一个关键词或主题试试。" action="浏览全部" @action="$emit('go','topics')"/></section>`,
}

export const ContentDetail = {
  components: { EmptyBlock },
  props: ['item', 'loading', 'error', 'currentUser', 'comments', 'annotations', 'aiChats', 'tagName', 'askAiAction', 'commentAction'], emits: ['go', 'retry', 'subscribe', 'delete'],
  setup(props, { emit }) {
    const comment = ref(''); const commentError = ref(''); const commentStatus = ref('idle'); const selectedText = ref(''); const question = ref(''); const aiStatus = ref('idle'); const aiError = ref(''); const aiPanelOpen = ref(false)
    const selectionAction = ref({ visible: false, top: 0, left: 0 })
    const own = computed(() => props.currentUser?.id === props.item?.author?.id)
    const relatedComments = computed(() => props.comments.filter((entry) => entry.contentId === props.item?.id))
    const relatedChats = computed(() => props.aiChats.filter((entry) => entry.articleId === props.item?.id && entry.userId === (props.currentUser?.id || 'guest')).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)))
    async function sendComment() {
      commentError.value = ''
      commentStatus.value = 'loading'
      try {
        await props.commentAction(props.item, comment.value)
        comment.value = ''
        commentStatus.value = 'success'
      } catch (err) {
        commentError.value = err.message || '评论提交失败，请重试'
        commentStatus.value = 'error'
      }
      if (commentStatus.value === 'success') window.setTimeout(() => { commentStatus.value = 'idle' }, 1200)
    }
    async function ask() {
      aiStatus.value = 'loading'
      aiError.value = ''
      try {
        await props.askAiAction(props.item, selectedText.value, question.value)
        question.value = ''
      } catch (err) {
        aiError.value = err.message || 'AI 请求失败，请重试'
      } finally {
        aiStatus.value = 'idle'
      }
    }
    function captureSelection() {
      const selection = globalThis.getSelection?.()
      const value = selection?.toString().trim() || ''
      if (!value) {
        selectionAction.value = { visible: false, top: 0, left: 0 }
        return
      }
      selectedText.value = value.slice(0, 500)
      const range = selection.rangeCount ? selection.getRangeAt(0) : null
      const rect = range?.getBoundingClientRect()
      if (!rect) return
      selectionAction.value = {
        visible: true,
        top: Math.min(globalThis.innerHeight - 48, Math.max(12, rect.bottom + 8)),
        left: Math.min(globalThis.innerWidth - 116, Math.max(12, rect.left + rect.width / 2 - 52)),
      }
    }
    function openAiPanel() { aiPanelOpen.value = true; aiError.value = ''; selectionAction.value = { visible: false, top: 0, left: 0 } }
    function closeAiPanel() { aiPanelOpen.value = false; selectionAction.value = { visible: false, top: 0, left: 0 } }
    function scrollToSection(id) {
      const section = document.getElementById(id)
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    watch(() => props.item?.id, () => { selectedText.value = ''; question.value = ''; aiError.value = ''; aiPanelOpen.value = false; selectionAction.value = { visible: false, top: 0, left: 0 } })
    return { comment, commentError, commentStatus, selectedText, question, aiStatus, aiError, aiPanelOpen, selectionAction, own, relatedComments, relatedChats, sendComment, ask, captureSelection, openAiPanel, closeAiPanel, scrollToSection, formatDate, formatDateTime }
  },
  template: `
    <section v-if="item" class="article-page">
      <div v-if="loading" class="detail-loading-notice" aria-live="polite">正在加载最新内容...</div>
      <div v-if="error" class="detail-error-notice" role="alert">
        <span>{{ error }}</span>
        <button type="button" @click="$emit('retry')">重新加载 <span>↻</span></button>
      </div>
      <div class="article-top">
        <button class="back-link" @click="$emit('go', 'topics')">← 返回内容列表</button>
        <div class="article-kicker">
          <span>{{ formatDate(item.publishedAt || item.updatedAt) }}</span>
          <span>{{ item.readingTime || item.language || '问题' }}</span>
          <span>{{ item.views || 0 }} 次阅读</span>
        </div>
      </div>
      <div class="article-layout">
        <aside class="article-aside">
          <button class="author-note author-link" @click="$emit('go', 'blog/' + item.author.id)">
            <span class="user-avatar">{{ item.author.name.slice(0, 1) }}</span>
            <span><strong>{{ item.author.name }}</strong><small>{{ item.author.bio }}</small></span>
          </button>
          <div v-if="item.type === 'article'" class="toc">
            <p class="toc-label">目录</p>
            <button v-for="(section, index) in item.sections" :key="section.id" type="button" @click="scrollToSection(section.id)">
              <span>0{{ index + 1 }}</span>{{ section.title }}
            </button>
          </div>
          <div class="article-tags">
            <button v-for="tag in item.tagIds" :key="tag" @click="$emit('go', 'topics?tag=' + tag)">#{{ tagName(tag) }}</button>
          </div>
          <button class="ai-launcher" @click="openAiPanel">
            <span>✦</span><span>AI 辅助阅读</span><small>选择正文后可带入问题</small>
          </button>
          <button class="heading-action" @click="$emit('subscribe', item.author.id)">订阅作者 <span>+</span></button>
          <button v-if="own" class="heading-action" @click="$emit('go', 'edit/' + item.type + '/' + item.id)">编辑内容 <span>↗</span></button>
          <button v-if="own" class="heading-action danger-link" @click="$emit('delete', item)">删除内容</button>
        </aside>
        <div class="article-main">
          <div class="article-heading">
            <p class="eyebrow">{{ item.type === 'article' ? 'FEATURED ESSAY' : item.type === 'code' ? 'CODE NOTE' : 'QUESTION' }}</p>
            <h1>{{ item.title }}</h1>
            <p class="article-summary">{{ item.summary || item.description || item.content }}</p>
          </div>
          <div v-if="item.type === 'article' && item.image" class="article-cover cover-large" :style="{ backgroundImage: 'linear-gradient(135deg,rgba(24,22,19,.08),rgba(24,22,19,.48)),url(' + item.image + ')' }"></div>
          <div v-if="item.type === 'article'" class="article-body" @mouseup="captureSelection" @touchend="captureSelection">
            <section v-for="section in item.sections" :id="section.id" :key="section.id" class="article-section">
              <h2>{{ section.title }}</h2>
              <template v-for="(block, index) in section.blocks || []" :key="index">
                <p v-if="block.type === 'paragraph'">{{ block.text }}</p>
                <blockquote v-else-if="block.type === 'quote'">{{ block.text }}</blockquote>
                <ul v-else-if="block.type === 'list'"><li v-for="line in block.items" :key="line">{{ line }}</li></ul>
                <pre v-else class="article-code"><code>{{ block.text }}</code></pre>
              </template>
              <p v-for="paragraph in section.body || []" :key="paragraph">{{ paragraph }}</p>
            </section>
          </div>
          <pre v-else-if="item.type === 'code'" class="code-detail" @mouseup="captureSelection" @touchend="captureSelection"><code>{{ item.code }}</code></pre>
          <div v-else class="question-detail" @mouseup="captureSelection" @touchend="captureSelection">
            <p>{{ item.content }}</p>
            <pre v-if="item.relatedCode"><code>{{ item.relatedCode }}</code></pre>
          </div>
          <section class="comments-section">
            <div class="section-heading compact">
              <div><p class="eyebrow">RESPONSES</p><h2>回应 <small>{{ relatedComments.length }}</small></h2></div>
            </div>
            <form class="comment-form" @submit.prevent="sendComment">
              <textarea v-model="comment" placeholder="分享你的想法..." rows="4" :disabled="commentStatus === 'loading'"></textarea>
              <p v-if="commentError" class="field-error">{{ commentError }}</p>
              <div>
                <span>{{ commentStatus === 'success' ? '评论已发布' : commentStatus === 'loading' ? '正在发布...' : '至少 5 个字符' }}</span>
                <button class="ai-submit" :disabled="commentStatus === 'loading'">{{ commentStatus === 'loading' ? '发布中...' : '发布评论' }} <b>↗</b></button>
              </div>
            </form>
            <div v-for="entry in relatedComments" :key="entry.id" class="comment-row">
              <div class="comment-avatar">{{ entry.userName.slice(0, 1) }}</div>
              <div>
                <div class="comment-meta"><strong>{{ entry.userName }}</strong><span>{{ formatDate(entry.createdAt) }}</span></div>
                <p>{{ entry.content }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <button v-if="selectionAction.visible" class="selection-ai-button" :style="{ top: selectionAction.top + 'px', left: selectionAction.left + 'px' }" @mousedown.prevent @click="openAiPanel">询问 AI</button>
      <div v-if="aiPanelOpen" class="ai-panel-backdrop" @click.self="closeAiPanel">
        <aside class="ai-panel" role="dialog" aria-modal="true" aria-label="AI 辅助阅读">
          <div class="ai-panel-head">
            <div><p class="eyebrow">AI READING</p><h2>和这篇文章聊聊</h2></div>
            <button class="panel-close" aria-label="关闭 AI 面板" @click="closeAiPanel">×</button>
          </div>
          <p class="ai-context-title">当前上下文：{{ item.title }}</p>
          <div v-if="selectedText" class="selected-quote"><span>已选文字</span><p>{{ selectedText }}</p></div>
          <p v-else class="ai-hint">尚未选择正文。你可以直接提问，或先选择一段文字后再打开此面板。</p>
          <div v-if="relatedChats.length" class="ai-chat-list">
            <article v-for="chat in relatedChats" :key="chat.id" class="ai-chat">
              <div v-if="chat.selectedText" class="selected-quote ai-chat-quote"><span>关联文字</span><p>{{ chat.selectedText }}</p></div>
              <div class="ai-question"><span>你</span><div><p>{{ chat.question }}</p><small>{{ formatDateTime(chat.createdAt) }}</small></div></div>
              <div class="ai-answer"><span>AI</span><p>{{ chat.answer }}</p></div>
            </article>
          </div>
          <form class="ai-form" @submit.prevent="ask">
            <textarea v-model="question" rows="4" placeholder="输入一个具体问题，例如：这段话对我的工作有什么启发？"></textarea>
            <p v-if="aiError" class="ai-error">{{ aiError }}</p>
            <button class="ai-submit" :disabled="aiStatus === 'loading'">{{ aiStatus === 'loading' ? 'AI 正在思考...' : aiError ? '重新提交' : '询问 AI' }} <span>↗</span></button>
          </form>
        </aside>
      </div>
    </section>
    <section v-else-if="loading" class="content-page"><EmptyBlock title="正在加载内容" description="正在整理正文和评论，请稍候。" /></section>
    <section v-else-if="error" class="content-page"><EmptyBlock title="内容加载失败" :description="error" action="重新加载" @action="$emit('retry')" /></section>
    <section v-else class="content-page"><EmptyBlock title="内容不存在" description="这个链接可能已失效。" action="回到首页" @action="$emit('go', 'home')" /></section>
  `,
}

export const StudioView = {
  components: { EmptyBlock },
  props: ['route', 'currentUser', 'items', 'drafts', 'tags', 'articles', 'annotations', 'tagName', 'saveContent', 'createTagAction'],
  emits: ['go', 'create-tag', 'save', 'save-draft', 'delete-draft', 'annotation', 'update-annotation', 'delete-annotation'],
  setup(props, { emit }) {
    const editorKind = computed(() => props.route.name === 'publish' ? 'article' : props.route.name === 'write-code' ? 'code' : props.route.name === 'ask' ? 'question' : props.route.name === 'edit' ? props.route.type : '')
    const original = computed(() => props.route.name === 'edit' ? props.items.find((item) => item.id === props.route.id && item.type === props.route.type) : null)
    const form = reactive({ title: '', summary: '', content: '', code: '', description: '', language: 'JavaScript', tagIds: [], visibility: 'public', publishMode: 'now', scheduledAt: '' })
    const errors = ref({}); const message = ref(''); const loading = ref(false); const newTag = ref(''); const selectedArticle = ref(''); const selectedText = ref(''); const annotationText = ref('')
    const ownArticles = computed(() => props.currentUser ? props.articles.filter((item) => item.author.id === props.currentUser.id) : [])
    watch(original, (item) => {
      if (!item) return
      Object.assign(form, { title: item.title, summary: item.summary || '', content: item.content || '', code: item.code || '', description: item.description || item.content || '', language: item.language || 'JavaScript', tagIds: [...item.tagIds], visibility: item.visibility || 'public', publishMode: item.status === 'scheduled' ? 'scheduled' : 'now', scheduledAt: item.scheduledAt ? item.scheduledAt.slice(0,16) : '' })
    }, { immediate: true })
    watch(ownArticles, (items) => { if (!selectedArticle.value && items[0]) selectedArticle.value = items[0].id }, { immediate: true })
    function resetForm() { Object.assign(form, { title: '', summary: '', content: '', code: '', description: '', language: 'JavaScript', tagIds: [], visibility: 'public', publishMode: 'now', scheduledAt: '' }) }
    function toggleTag(id) { form.tagIds = form.tagIds.includes(id) ? form.tagIds.filter((tag) => tag !== id) : [...form.tagIds, id] }
    async function submit(publish) {
      const type = editorKind.value; const content = type === 'code' ? form.code : type === 'question' ? form.description : form.content
      const next = validateContentDraft({ type, title: form.title, content, language: form.language, tagIds: form.tagIds })
      if (publish && form.publishMode === 'scheduled' && (!form.scheduledAt || new Date(form.scheduledAt).getTime() <= Date.now())) next.scheduledAt = '发布时间必须晚于当前时间'
      errors.value = next; if (Object.keys(next).length) return
      loading.value = true
      try {
        await new Promise((resolve) => setTimeout(resolve, 450))
        const item = await props.saveContent({ ...form, type, content: type === 'question' ? form.description : form.content, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : '', status: publish ? (form.publishMode === 'scheduled' ? 'scheduled' : 'published') : 'draft' }, publish, original.value?.id || '')
        message.value = publish ? (form.publishMode === 'scheduled' ? '已安排定时发布。' : '发布成功。') : '草稿已保存。'
        if (publish) setTimeout(() => emit('go', `${type}/${item.id}`), 400)
      } catch (error) {
        message.value = error.message || '保存失败，请重试'
      } finally {
        loading.value = false
      }
    }
    async function addTag() { try { const tag = await props.createTagAction(newTag.value); form.tagIds.push(tag.id); newTag.value = ''; message.value = '标签创建成功。' } catch (error) { message.value = error.message } }
    function saveAnnotation() { if (!selectedText.value) return message.value = '请先选择文章正文的一段文字'; if (annotationText.value.trim().length < 4) return message.value = '标注至少需要 4 个有效字符'; emit('annotation', { articleId: selectedArticle.value, selectedText: selectedText.value, content: annotationText.value.trim() }); annotationText.value = ''; selectedText.value = ''; message.value = '标注已保存。' }
    function captureAnnotation() { selectedText.value = globalThis.getSelection?.()?.toString().trim() || '' }
    function deleteDraft(id) { if (globalThis.confirm('确认删除草稿吗？')) emit('delete-draft', id) }
    function editAnnotation(note) { const next = globalThis.prompt('修改标注', note.content); if (next) emit('update-annotation', note.id, next) }
    return { editorKind, original, form, errors, message, loading, newTag, selectedArticle, selectedText, annotationText, ownArticles, resetForm, toggleTag, submit, addTag, saveAnnotation, captureAnnotation, deleteDraft, editAnnotation, contentTypes, visibilityOptions, formatDateTime }
  },
  template: `<section v-if="!currentUser" class="content-page"><EmptyBlock title="登录后才能创作" description="登录后可以写文章、代码、问题，保存草稿和添加标注。" action="去登录" @action="$emit('go','login')"/></section>
  <section v-else-if="route.name==='create'" class="content-page creation-page"><div class="page-intro"><p class="eyebrow">CREATION CENTER</p><h1>把想法放进页间。</h1><p>选择一种方式开始创作。草稿会保留在你的草稿箱中。</p></div><div class="creation-grid"><button v-for="entry in contentTypes" :key="entry.id" class="creation-entry" @click="$emit('go',entry.id==='article'?'publish':entry.id==='code'?'write-code':'ask')"><span class="creation-index">0{{contentTypes.indexOf(entry)+1}}</span><strong>{{entry.label}}</strong><span>{{entry.id==='article'?'记录一段完整的思考':entry.id==='code'?'分享可以复用的实现':'把具体困惑交给社区'}}</span><i>↗</i></button><button class="creation-entry creation-entry-muted" @click="$emit('go','annotate')"><span class="creation-index">04</span><strong>给文章添加标注</strong><span>为自己的文章留下旁注</span><i>↗</i></button></div><div class="creation-footer-links"><button @click="$emit('go','drafts')">打开草稿箱 <span>↗</span></button></div></section>
  <section v-else-if="route.name==='drafts'" class="content-page listing-page"><div class="page-intro"><p class="eyebrow">DRAFTS</p><h1>草稿箱</h1><p>草稿不会出现在公开列表、搜索结果或推荐内容中。</p></div><div v-if="drafts.filter(d=>d.author?.id===currentUser.id).length" class="draft-list"><div v-for="draft in drafts.filter(d=>d.author?.id===currentUser.id)" :key="draft.id" class="draft-row"><button @click="$emit('go','edit/'+draft.type+'/'+draft.id)"><span class="draft-type">{{draft.type}}</span><strong>{{draft.title || '未命名草稿'}}</strong><small>最近编辑 {{formatDateTime(draft.updatedAt)}}</small></button><button class="draft-delete" @click="deleteDraft(draft.id)">删除</button></div></div><EmptyBlock v-else title="草稿箱是空的" description="开始创作时保存草稿，它会出现在这里。" action="开始创作" @action="$emit('go','create')"/></section>
  <section v-else-if="route.name==='annotate'" class="content-page annotation-page"><div class="page-intro"><p class="eyebrow">ANNOTATIONS</p><h1>给自己的文章留下旁注。</h1><p>只能选择自己发布的文章，并在原文中选中一段文字后添加标注。</p></div><div v-if="ownArticles.length" class="annotation-layout"><div><div class="annotation-toolbar"><select v-model="selectedArticle"><option v-for="item in ownArticles" :key="item.id" :value="item.id">{{item.title}}</option></select></div><div v-for="article in ownArticles.filter(a=>a.id===selectedArticle)" :key="article.id" class="annotation-source" @mouseup="captureAnnotation"><h2>{{article.title}}</h2><section v-for="section in article.sections" :key="section.id"><h3>{{section.title}}</h3><p v-for="block in section.blocks || []" :key="block.text">{{block.text}}</p><p v-for="line in section.body || []" :key="line">{{line}}</p></section></div></div><aside class="annotation-side"><p class="toc-label">新建标注</p><div class="selected-preview">{{selectedText ? '“'+selectedText+'”' : '在左侧选择一段文字'}}</div><textarea v-model="annotationText" rows="5" placeholder="写下你的旁注…"></textarea><button class="submit-button" @click="saveAnnotation">保存标注 <span>↗</span></button><p v-if="message" class="field-error">{{message}}</p><div class="annotation-list"><div v-for="note in annotations.filter(a=>a.articleId===selectedArticle && a.userId===currentUser.id)" :key="note.id" class="annotation-item"><p>“{{note.selectedText}}”</p><strong>{{note.content}}</strong><div><button @click="editAnnotation(note)">编辑</button><button @click="$emit('delete-annotation',note.id)">删除</button></div></div></div></aside></div><EmptyBlock v-else title="还没有可以标注的文章" description="先发布一篇文章，再回来留下旁注。" action="写文章" @action="$emit('go','publish')"/></section>
  <section v-else class="content-page editor-page"><div class="editor-topline"><button class="back-link" @click="$emit('go','create')">← 返回创作中心</button></div><div class="page-intro"><p class="eyebrow">{{original?'EDIT CONTENT':'NEW CONTENT'}}</p><h1>{{editorKind==='article'?'写文章':editorKind==='code'?'写代码':'提出问题'}}</h1><p>支持草稿、公开权限、仅自己可见、订阅者可见与定时发布。</p></div><div class="editor-form"><div class="editor-main"><label class="field"><span class="field-label">标题 *</span><input v-model="form.title"><span class="field-error">{{errors.title}}</span></label><label v-if="editorKind==='article'" class="field"><span class="field-label">摘要</span><textarea v-model="form.summary" rows="3"></textarea></label><label v-if="editorKind==='code'" class="field"><span class="field-label">代码说明</span><textarea v-model="form.description" rows="3"></textarea></label><label v-if="editorKind==='code'" class="field"><span class="field-label">编程语言 *</span><select v-model="form.language"><option>JavaScript</option><option>TypeScript</option><option>Java</option><option>Python</option><option>SQL</option></select><span class="field-error">{{errors.language}}</span></label><label class="field"><span class="field-label">{{editorKind==='article'?'正文':editorKind==='code'?'代码':'问题描述'}} *</span><textarea v-if="editorKind==='article'" v-model="form.content" class="editor-textarea" rows="18" placeholder="## 一个章节标题&#10;&#10;在这里开始写正文。"></textarea><textarea v-else-if="editorKind==='code'" v-model="form.code" class="editor-textarea code-editor" rows="18" spellcheck="false"></textarea><textarea v-else v-model="form.description" class="editor-textarea" rows="14" placeholder="补充背景和已经尝试过的方法。"></textarea><span class="field-error">{{errors.content}}</span></label></div><aside class="editor-aside"><div class="editor-side-section"><p class="toc-label">内容标签 *</p><div class="publish-tags"><button v-for="tag in tags" :key="tag.id" :class="{selected:form.tagIds.includes(tag.id)}" @click="toggleTag(tag.id)">{{tag.name}} <span>{{form.tagIds.includes(tag.id)?'✓':'+'}}</span></button></div><span class="field-error">{{errors.tags}}</span><div class="new-tag-row"><input v-model="newTag" placeholder="新标签"><button @click="addTag">新增</button></div></div><div class="editor-side-section"><p class="toc-label">可见权限</p><label v-for="option in visibilityOptions" :key="option.id" class="visibility-option"><input type="radio" v-model="form.visibility" :value="option.id"><span><strong>{{option.name}}</strong><small>{{option.description}}</small></span></label></div><div class="editor-side-section"><p class="toc-label">发布方式</p><label><input type="radio" v-model="form.publishMode" value="now"> 立即发布</label><label><input type="radio" v-model="form.publishMode" value="scheduled"> 定时发布</label><input v-if="form.publishMode==='scheduled'" v-model="form.scheduledAt" class="schedule-input" type="datetime-local"><span class="field-error">{{errors.scheduledAt}}</span></div><p v-if="message" class="success-copy">{{message}}</p><button class="secondary-button" :disabled="loading" @click="submit(false)">保存草稿</button><button class="submit-button" :disabled="loading" @click="submit(true)">{{loading?'处理中…':form.publishMode==='scheduled'?'安排发布':'发布内容'}} <span>↗</span></button></aside></div></section>`,
}

export const BlogView = {
  components: { ContentCard, EmptyBlock }, props: ['authorId', 'items', 'currentUser', 'subscriptions', 'tagName'], emits: ['go', 'open', 'subscribe', 'delete'],
  setup(props) {
    const loadedItems = ref([])
    const loading = ref(true)
    const loadError = ref('')
    const viewMode = ref('latest')
    const activeTag = ref('')
    let loadTimer

    function readAuthorItems() {
      if (!Array.isArray(props.items)) throw new Error('作者内容暂时无法加载')
      return props.items
        .filter((item) => item?.author?.id === props.authorId && item.status === 'published')
        .sort((a, b) => new Date(b.publishedAt || b.updatedAt) - new Date(a.publishedAt || a.updatedAt))
    }

    function loadAuthorItems(delay = true) {
      loading.value = true
      loadError.value = ''
      clearTimeout(loadTimer)
      const finish = () => {
        try {
          loadedItems.value = readAuthorItems()
          if (activeTag.value && !loadedItems.value.some((item) => item.tagIds?.includes(activeTag.value))) activeTag.value = ''
        } catch (error) {
          loadedItems.value = []
          loadError.value = error.message || '作者内容加载失败，请重试'
        } finally {
          loading.value = false
        }
      }
      if (delay) loadTimer = setTimeout(finish, 360)
      else finish()
    }

    function showTimeline() {
      viewMode.value = 'timeline'
      activeTag.value = ''
      document.getElementById('blog-notes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    function showCategories() {
      viewMode.value = 'latest'
      document.getElementById('blog-categories')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    function selectTag(tagId) {
      activeTag.value = tagId
      viewMode.value = 'latest'
    }

    onMounted(() => loadAuthorItems())
    watch(() => props.authorId, () => {
      viewMode.value = 'latest'
      activeTag.value = ''
      loadAuthorItems()
    })
    watch(() => props.items, () => {
      if (!loading.value) loadAuthorItems(false)
    }, { deep: true })

    return { loadedItems, loading, loadError, viewMode, activeTag, loadAuthorItems, showTimeline, showCategories, selectTag }
  },
  computed: {
    authorItems() { return this.loadedItems },
    visibleItems() { return this.activeTag ? this.authorItems.filter((item) => item.tagIds?.includes(this.activeTag)) : this.authorItems },
    authorTags() {
      const ids = [...new Set(this.authorItems.flatMap((item) => item.tagIds || []))]
      return ids.map((id) => ({ id, name: this.tagName(id), count: this.authorItems.filter((item) => item.tagIds?.includes(id)).length }))
    },
    author() { return this.authorItems[0]?.author || (this.currentUser?.id === this.authorId ? this.currentUser : { id: this.authorId, name: '页间作者', bio: '记录思考，也记录生活。' }) },
    avatarSource() { return this.author.avatar || '' },
    articleCount() { return this.authorItems.filter((item) => item.type === 'article').length },
    subscriberCount() { return this.subscriptions.filter((entry) => entry.authorId === this.authorId).length },
    own() { return this.currentUser?.id === this.authorId },
    subscribed() { return !!this.currentUser && this.subscriptions.some((entry) => entry.authorId === this.authorId && entry.subscriberId === this.currentUser.id) },
    subscriptionLabel() { return this.own ? '这是你的博客' : this.subscribed ? '已订阅作者' : '尚未订阅' },
  },
  template: `<section class="blog-landing" style="--blog-background:url('/blog-illustration.svg')"><div class="blog-wash"></div><button class="blog-back" @click="$emit('go','home')">↖ <span>返回页间</span></button><div class="blog-corner blog-corner-left">PERSONAL BLOG / {{String(authorItems.length).padStart(2,'0')}} NOTES</div><div class="blog-center"><span class="blog-avatar blog-avatar-large" :class="{ 'blog-avatar-image': avatarSource }" :style="avatarSource ? { backgroundImage:'url('+avatarSource+')' } : {}"><span v-if="!avatarSource">{{author.name.slice(0,1)}}</span></span><p class="blog-kicker">THE NOTEBOOK OF</p><h1 class="blog-vertical-title">{{author.name}}</h1><p class="blog-vertical-bio">{{author.bio}}</p><div class="blog-profile-stats"><span><strong>{{articleCount}}</strong> 篇文章</span><span><strong>{{subscriberCount}}</strong> 位订阅者</span><span>{{subscriptionLabel}}</span></div><div class="blog-center-actions"><button v-if="!own" class="subscribe-button" @click="$emit('subscribe',authorId)">{{subscribed?'已订阅作者':'订阅作者'}} <span>{{subscribed?'✓':'+'}}</span></button><button class="blog-scroll-button" @click="$el.querySelector('#blog-notes').scrollIntoView({behavior:'smooth'})">浏览内容 <span>↓</span></button></div></div><div class="blog-bottom-line"><span>{{articleCount}} 篇文章 · {{authorItems.length}} 项公开内容</span><span>页间 / 2026</span></div><div id="blog-notes" class="blog-notes"><div class="blog-notes-inner"><div class="blog-notes-heading"><div><p class="eyebrow">AUTHOR NOTEBOOK</p><h2>从这里继续阅读</h2><p class="blog-notes-intro">按最新发布、时间轴或文章分类浏览 {{author.name}} 的公开内容。</p></div><button v-if="own" class="primary-button" @click="$emit('go','create')">开始创作 <span>↗</span></button></div><div class="blog-notes-toolbar" role="tablist" aria-label="博客内容视图"><button type="button" :class="{active:viewMode==='latest'}" @click="viewMode='latest'">最新内容 <span>{{authorItems.length}}</span></button><button type="button" :class="{active:viewMode==='timeline'}" @click="showTimeline">时间轴 <span>↘</span></button><button type="button" :class="{active:activeTag}" @click="showCategories">文章分类 <span>＋</span></button></div><div id="blog-categories" class="blog-category-panel"><div><p class="toc-label">按标签筛选</p><p class="blog-category-help">选择一个主题，只看作者在这个主题下发布的文章。</p></div><div class="blog-category-list"><button type="button" :class="{active:!activeTag}" @click="selectTag('')">全部 <small>{{authorItems.length}}</small></button><button v-for="tag in authorTags" :key="tag.id" type="button" :class="{active:activeTag===tag.id}" @click="selectTag(tag.id)">{{tag.name}} <small>{{tag.count}}</small></button></div></div><div v-if="loading" class="blog-loading-state" aria-live="polite"><div v-for="index in 3" :key="index" class="blog-loading-row"><span></span><div><i></i><b></b><em></em></div></div><p>正在整理作者的内容…</p></div><div v-else-if="loadError" class="blog-error-state"><span class="empty-mark">!</span><h2>内容加载失败</h2><p>{{loadError}}</p><button class="secondary-button" @click="loadAuthorItems()">重新加载 <span>↻</span></button></div><template v-else-if="viewMode==='timeline'"><div v-if="visibleItems.length" class="blog-timeline"><article v-for="(item,index) in visibleItems" :key="item.type+item.id" class="blog-timeline-item"><div class="blog-timeline-date"><strong>{{new Date(item.publishedAt || item.updatedAt).getDate()}}</strong><span>{{new Date(item.publishedAt || item.updatedAt).toLocaleDateString('zh-CN',{year:'numeric',month:'long'})}}</span></div><button class="blog-timeline-content" @click="$emit('open',item)"><span class="blog-timeline-type">{{item.type==='article'?'文章':item.type==='code'?'代码':'问题'}} · {{String(index+1).padStart(2,'0')}}</span><h3>{{item.title}}</h3><p>{{item.summary || item.description || item.content}}</p><small>{{item.views || 0}} 阅读 <span>↗</span></small></button></article></div><EmptyBlock v-else title="时间轴还是空的" description="作者发布内容后，时间会在这里留下痕迹。"/></template><template v-else><div v-if="visibleItems.length" class="blog-notes-grid"><div v-for="item in visibleItems" :key="item.type+item.id" class="blog-note-entry"><ContentCard :item="item" :tag-name="tagName" @open="$emit('open',$event)"/><div v-if="own" class="blog-note-actions"><button class="heading-action" @click="$emit('go','edit/'+item.type+'/'+item.id)">编辑</button><button class="heading-action danger-link" @click="$emit('delete',item)">删除</button></div></div></div><EmptyBlock v-else :title="activeTag ? '这个分类还没有文章' : '还没有公开内容'" :description="activeTag ? '换一个主题，继续浏览作者的记录。' : '作者的下一篇记录正在路上。'" :action="own ? '开始创作' : ''" @action="$emit('go','create')"/></template></div></div></section>`,
}

export const AboutView = {
  emits: ['go'],
  template: `<section class="content-page listing-page"><div class="page-intro"><p class="eyebrow">ABOUT YEJIAN</p><h1>让内容回到内容本身。</h1><p>页间是一个中文内容社区：既可以安静阅读文章，也可以分享代码、提出问题，把创作和交流放在同一个轻盈的空间里。</p></div><div class="about-grid"><section><h2>核心功能</h2><p>文章、代码与问题三类内容；AI 辅助阅读；评论、订阅、阅读历史；草稿、定时发布、权限控制和文章标注。</p></section><section><h2>技术栈</h2><p>前端使用 Vue 3、Vite 和浏览器 localStorage 演示数据；后端目录预留 Java 17 与 Spring Boot 服务。</p></section><section><h2>联系与反馈</h2><p>欢迎通过项目仓库 Issue 提交反馈，或联系 demo@yejian.space。</p></section></div><button class="primary-button" @click="$emit('go','home')">返回首页 <span>↗</span></button></section>`,
}
