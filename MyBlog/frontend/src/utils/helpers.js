export const parseRoute = () => {
  const raw = window.location.hash.replace(/^#\/?/, '') || 'home'
  const [path, queryString = ''] = raw.split('?')
  const query = Object.fromEntries(new URLSearchParams(queryString))
  const parts = path.split('/')
  return { name: parts[0], id: parts[1] || '', query, key: raw }
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value))
}

export function formatRelativeDate(value) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000))
  return days === 0 ? '今天' : days === 1 ? '昨天' : `${days} 天前`
}

export function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function formatFileSize(value) {
  return value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function parseEditorSections(content) {
  const lines = content.split(/\r?\n/)
  const sections = []
  let current = { title: '正文', blocks: [] }
  const pushCurrent = () => {
    if (current.blocks.length) sections.push({ ...current, id: `section-${sections.length + 1}` })
  }
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (!line) continue
    if (line.startsWith('## ')) {
      pushCurrent()
      current = { title: line.slice(3).trim(), blocks: [] }
      continue
    }
    if (line === '```') {
      const code = []
      index += 1
      while (index < lines.length && lines[index].trim() !== '```') code.push(lines[index])
      current.blocks.push({ type: 'code', text: code.join('\n') })
      continue
    }
    if (line.startsWith('- ')) {
      const items = [line.slice(2).trim()]
      while (index + 1 < lines.length && lines[index + 1].trim().startsWith('- ')) {
        index += 1
        items.push(lines[index].trim().slice(2).trim())
      }
      current.blocks.push({ type: 'list', items })
      continue
    }
    if (line.startsWith('> ')) {
      current.blocks.push({ type: 'quote', text: line.slice(2).trim() })
      continue
    }
    current.blocks.push({ type: 'paragraph', text: line })
  }
  pushCurrent()
  return sections.length ? sections : [{ id: 'section-1', title: '正文', body: [content] }]
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
