# Eureka 落地页 EdgeOne 部署指南

## 🎯 目标
将 Eureka 落地页从 GitHub Pages 迁移到 EdgeOne Pages，实现国内快速访问。

## 📁 文件结构

```
eureka-landing-page/
├── index.html          # 落地页主文件（已从 eureka.html 复制并更新链接）
└── .edgeone/
    └── preview.json    # EdgeOne Pages 配置
```

## 🚀 部署步骤

### 方式一：通过 EdgeOne 控制台手动部署（推荐）

1. **登录 EdgeOne 控制台**
   - 访问 https://console.edgeone.ai/pages
   - 使用腾讯云账号登录

2. **创建新项目**
   - 点击「创建项目」
   - 项目名称：`eureka-landing`
   - 选择「从 Git 仓库导入」
   - 关联 GitHub 仓库：`davidma1973simu/workbuddy-agents-marketplace`

3. **配置构建设置**
   - 根目录：`eureka-landing-page`
   - 构建命令：（留空，纯静态页面）
   - 输出目录：`.`

4. **部署**
   - 点击「部署」
   - 等待构建完成
   - 获取分配的域名（如 `eureka-landing-xxx.edgeone.dev`）

5. **配置自定义域名（可选）**
   - 在域名管理中添加自定义域名
   - 如：`eureka.edgeone.dev` 或 `eureka.xiwise.com`

### 方式二：通过 CLI 部署

```bash
# 安装 EdgeOne CLI
npm install -g @edgeone/cli

# 登录
edgeone login

# 进入项目目录
cd ~/.workbuddy/agents-marketplace/eureka-landing-page

# 部署
edgeone deploy
```

## 🔗 部署后的 URL 更新

部署完成后，需要更新其他组件中的落地页链接：

### 1. Eureka Dashboard
文件：`eureka-dashboard/index.html`
```html
<!-- 旧链接 -->
<a href="https://davidma1973simu.github.io/workbuddy-agents-marketplace/eureka.html">

<!-- 新链接（部署后替换为实际 EdgeOne 地址） -->
<a href="https://eureka-landing.edgeone.dev/">
```

### 2. Persona Lab
文件：`persona-lab/index.html`
```html
<!-- 旧链接 -->
<a href="https://davidma1973simu.github.io/workbuddy-agents-marketplace/eureka.html">

<!-- 新链接 -->
<a href="https://eureka-landing.edgeone.dev/">
```

### 3. GitHub Pages 根目录
文件：`index.html`（如果存在返回落地页的链接）

## ✅ 部署验证清单

- [ ] EdgeOne Pages 项目创建成功
- [ ] 落地页可以正常访问
- [ ] 所有产品入口链接正确（Dashboard、Persona Lab、Guide）
- [ ] 留资表单功能正常
- [ ] 主题切换功能正常
- [ ] 管理后台可以正常打开

## 📝 注意事项

1. **CDN 缓存**：首次部署后可能需要等待 1-2 分钟才能全球生效
2. **版本号**：如需强制刷新缓存，可在资源链接后添加 `?v=版本号`
3. **HTTPS**：EdgeOne 默认启用 HTTPS，无需额外配置
4. **国内访问**：EdgeOne 国内节点会自动加速

## 🆘 故障排查

### 页面 404
- 检查根目录配置是否正确
- 确认 `index.html` 文件存在于根目录

### 资源加载失败
- 检查所有绝对路径链接是否正确
- 确认外部资源（如图标、字体）可访问

### 功能异常
- 检查浏览器控制台是否有报错
- 确认 localStorage 功能正常（EdgeOne 支持）

---

**创建时间**: 2026-04-10  
**版本**: v1.0
