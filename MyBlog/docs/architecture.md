# 项目分层说明

## 前端

`frontend/src/App.jsx` 负责全局状态、Hash 路由和跨页面事件。

- `components/`：可复用视觉组件和布局组件
- `pages/`：按业务页面拆分的页面组件
- `data/`：用户、文章、标签、评论、订阅、阅读历史和 AI 对话的数据模型
- `utils/`：路由解析、日期格式化、编辑器内容解析和文件读取

## 后端

`backend/` 使用 Java 17 + Spring Boot 3，当前提供启动入口和配置文件。后续可按以下业务边界继续扩展：

- `auth`：注册、登录、JWT 和用户资料
- `article`：文章、标签、搜索和阅读量
- `comment`：评论与内容校验
- `subscription`：作者订阅和通知
- `ai`：AI 请求代理和上下文限制

## 数据模型

关系型表结构见 `docs/data-model.sql`。当前浏览器演示层通过 `localStorage` 模拟这些实体，后续接入 API 时可保持相同字段边界。
