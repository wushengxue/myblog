const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
const userStorageKey = 'myblog.currentUser'

export const apiEnabled = Boolean(baseUrl)

function currentUserId() {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey) || 'null')?.id || ''
  } catch {
    return ''
  }
}

async function request(path, options = {}) {
  if (!apiEnabled) throw new Error('未启用后端 API，请在 frontend/.env.local 配置 VITE_API_BASE_URL')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const userId = currentUserId()
  if (userId) headers['X-User-Id'] = userId
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers, signal: controller.signal })
    if (!response.ok) {
      let message = `请求失败（${response.status}）`
      try {
        const data = await response.json()
        message = data.message || message
      } catch {}
      throw new Error(message)
    }
    if (response.status === 204) return null
    return response.json()
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('后端请求超时，请确认后端已启动')
    if (error instanceof TypeError) throw new Error('无法连接后端，请确认后端地址和服务状态')
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export const api = {
  auth: {
    register: (payload) => request('/auth/register', json('POST', payload)),
    login: (payload) => request('/auth/login', json('POST', payload)),
  },
  content: {
    list: (params = {}) => {
      const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value))
      return request(`/content${query.toString() ? `?${query}` : ''}`)
    },
    detail: (type, id) => request(`/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}`),
    save: (payload, id = '') => request(id ? `/content/${payload.type}/${id}` : '/content', json(id ? 'PUT' : 'POST', payload)),
    remove: (type, id) => request(`/content/${type}/${id}`, { method: 'DELETE' }),
  },
  tags: {
    list: () => request('/tags'),
    create: (name) => request('/tags', json('POST', { name })),
  },
  comments: {
    list: (contentId) => request(`/comments/${contentId}`),
    create: (contentId, content) => request('/comments', json('POST', { contentId, content })),
  },
  subscriptions: {
    list: () => request('/subscriptions'),
    create: (authorId) => request(`/subscriptions/${authorId}`, { method: 'POST' }),
    remove: (authorId) => request(`/subscriptions/${authorId}`, { method: 'DELETE' }),
  },
  history: {
    list: () => request('/history'),
    add: (contentType, contentId) => request('/history', json('POST', { contentType, contentId })),
  },
  ai: {
    answer: (payload) => request('/ai/answer', json('POST', payload)),
  },
}
