# 页间 · 中文内容社区

页间是一个以阅读、写作和安静交流为核心的中文内容社区 Web 应用。当前前端提供可交互的账号、文章、评论、AI 辅助阅读、阅读历史、个人博客和主题偏好流程。

## 项目结构

```text
MyBlog/
├─ frontend/                 # Vue 3 + Vite 前端
│  ├─ public/                # 插画和纹理资源
│  ├─ src/
│  │  ├─ data/               # 数据模型、种子数据、本地存储
│  │  ├─ utils/              # 路由、格式化、编辑器解析工具
│  │  ├─ App.vue             # 路由分发和全局状态
│  │  ├─ views.js            # Vue 页面视图组件
│  │  ├─ main.js             # Vue 入口
│  │  └─ styles.css          # 全局样式
│  ├─ package.json
│  └─ index.html
├─ backend/                  # Java + Spring Boot 后端骨架
│  ├─ src/main/java/
│  ├─ src/main/resources/
│  └─ pom.xml
├─ docs/                     # 数据库 SQL 和架构文档
└─ README.md
```

## 功能列表

- 注册与登录：姓名、手机号、身份证号、邮箱和密码校验
- 登录态和主题偏好持久化
- 登录后全屏插画首屏，向下滚动进入内容首页
- 推荐文章、精选文章、最近更新
- 文章详情、正文、目录导航、作者、标签和阅读量
- 标题、正文、标签、作者搜索和主题分类
- 阅读历史
- 文章选中文本后询问 AI
- AI 问题校验、加载、失败重试和问答记录
- 登录拦截、评论校验、评论提交状态
- 登录用户发布文章、标签必选、Markdown 风格正文解析
- 个人博客、时间轴、作者订阅和重复订阅提示
- 文章、代码、问题三类内容及对应详情页
- 创作中心、代码编辑、提问、草稿箱、文章标注
- 新建标签、编辑删除、可见权限和定时发布
- 响应式桌面端和移动端布局

## 技术栈

- 前端：Vue 3、Vite、CSS、Vitest
- 前端数据：浏览器 `localStorage`
- 后端骨架：Java 17、Spring Boot 3、Maven
- 数据库设计：关系型 SQL，见 `docs/data-model.sql`

## 本地运行

环境要求：

- Node.js 18+
- Java 17+ 和 Maven 3.9+（仅启动后端时需要）

启动前端：

```bash
cd frontend
npm install
npm run dev
```

也可以在项目根目录直接运行：

```bash
npm run install:frontend
npm run dev
```

前端默认地址为 `http://localhost:5173/`。

启动后端骨架：

```bash
cd backend
mvn spring-boot:run
```

后端默认地址为 `http://localhost:8080/`。当前前端尚未切换到后端 API，页面演示数据仍保存在浏览器本地。

## 环境变量

在 `frontend/` 下创建 `.env.local`：

```bash
VITE_AI_API_URL=https://your-api.example.com/ai/answer
```

未配置时使用本地模拟回答，因此 AI 阅读流程可以离线演示。配置后，浏览器会以 `POST` 调用该地址；当前文章上下文会限制为最多 4000 个字符，用户选中的文字最多携带 500 个字符，以控制请求大小。接口需要接受：

```json
{
  "question": "用户问题",
  "selectedText": "用户选中的文章内容",
  "context": "限制长度后的文章上下文",
  "article": {
    "id": "attention",
    "title": "文章标题"
  }
}
```

并返回：

```json
{
  "answer": "AI 回答内容"
}
```

生产环境建议由 `backend/` 提供同源代理，再由后端安全地调用 AI 服务；不要将任何私有 API Key 写入 `VITE_` 前缀的前端环境变量。

## 构建

```bash
cd frontend
npm run build
npm run test
```

## 部署

前端是 Vite 静态站点，可部署到 Vercel、Netlify、GitHub Pages 或任意静态托管平台。部署根目录设置为 `frontend/`，构建命令为 `npm run build`，发布目录为 `dist`。

当前项目的 Java 后端为基础骨架，接入真实业务后可部署到 Railway、Render、云服务器或容器平台，并将数据库连接配置放入 `backend/src/main/resources/application.yml` 或环境变量。当前尚未完成公开部署，因此没有可提供的线上地址。

## 演示账号

```text
账号：demo@yejian.space
密码：Demo123456
```
