import { describe, expect, it } from 'vitest'
import { validateAiQuestion, validateComment, validateContentDraft, validateTagName } from './validators'

describe('核心表单校验', () => {
  it('注册字段应使用前端规则拦截无效输入', () => {
    expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('bad-email')).toBe(false)
    expect(/^1[3-9]\d{9}$/.test('123')).toBe(false)
  })

  it('发布文章必须拥有标题、正文和标签', () => {
    expect(validateContentDraft({ type: 'article', title: '', content: '', tagIds: [] })).toMatchObject({
      title: '标题不能为空',
      content: '正文不能为空',
      tags: '至少选择一个标签',
    })
  })

  it('评论拦截空白、过短和违规格式', () => {
    expect(validateComment('')).toBe('评论内容不能为空')
    expect(validateComment('太短')).toContain('至少')
    expect(validateComment('<script>alert(1)</script> 这是一条评论')).toContain('不支持')
    expect(validateComment('这是一条正常的评论内容')).toBe('')
  })

  it('AI 提问拦截空白、纯符号和过短内容', () => {
    expect(validateAiQuestion('   ')).toBe('请输入想询问的问题')
    expect(validateAiQuestion('???')).toContain('至少')
    expect(validateAiQuestion('!!!!')).toBe('问题不能只包含符号')
    expect(validateAiQuestion('这段话是什么意思？')).toBe('')
  })

  it('拒绝重复标签', () => {
    expect(validateTagName('技术', [{ id: 'technology', name: '技术' }])).toBe('这个标签已经存在')
    expect(validateTagName('前端工程', [])).toBe('')
  })
})
