export const cleanText = (value = '') => value.replace(/\s/g, '').trim()

export function validateAiQuestion(value) {
  const clean = cleanText(value)
  if (!clean) return '请输入想询问的问题'
  if (clean.length < 4) return '问题至少需要 4 个有效字符'
  if (!/[\p{L}\p{N}]/u.test(clean)) return '问题不能只包含符号'
  return ''
}

export function validateComment(value) {
  const clean = cleanText(value)
  if (!clean) return '评论内容不能为空'
  if (clean.length < 5) return '评论至少需要 5 个字符'
  if (/(https?:\/\/|<script|<iframe|[\u200B-\u200D\uFEFF])/i.test(value)) return '评论包含不支持的格式或内容'
  return ''
}

export function validateContentDraft({ type, title, content, language, tagIds = [] }) {
  const errors = {}
  if (!cleanText(title)) errors.title = '标题不能为空'
  else if (cleanText(title).length < 4) errors.title = '标题至少需要 4 个字符'
  if (type === 'code' && !cleanText(language)) errors.language = '请选择编程语言'
  const body = type === 'question' ? content : content
  if (!cleanText(body)) errors.content = type === 'question' ? '问题描述不能为空' : type === 'code' ? '代码内容不能为空' : '正文不能为空'
  else if (cleanText(body).length < (type === 'code' ? 8 : type === 'question' ? 12 : 20)) errors.content = type === 'question' ? '问题描述至少需要 12 个有效字符' : type === 'code' ? '代码至少需要 8 个有效字符' : '正文至少需要 20 个有效字符'
  if (!tagIds.length) errors.tags = '至少选择一个标签'
  return errors
}

export function validateTagName(value, existing = []) {
  const name = value.trim()
  if (!name) return '标签名称不能为空'
  if (name.length > 20) return '标签名称不能超过 20 个字符'
  if (!/^[\u4e00-\u9fa5A-Za-z0-9_-]+$/.test(name)) return '标签只能包含中文、字母、数字、下划线或短横线'
  if (existing.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) return '这个标签已经存在'
  return ''
}

export function canViewContent(item, currentUser, subscriptions = []) {
  if (item.status === 'draft') return !!currentUser && item.author?.id === currentUser.id
  if (item.status === 'scheduled' && new Date(item.scheduledAt).getTime() > Date.now()) return !!currentUser && item.author?.id === currentUser.id
  if (item.visibility === 'private') return !!currentUser && item.author?.id === currentUser.id
  if (item.visibility === 'subscribers') {
    return !!currentUser && (item.author?.id === currentUser.id || subscriptions.some((subscription) => subscription.authorId === item.author?.id && subscription.subscriberId === currentUser.id))
  }
  return true
}
