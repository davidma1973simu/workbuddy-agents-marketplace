# WorkBuddy Agents Marketplace - 部署指南

## 🚀 部署到GitHub Pages

### 方法1: 使用GitHub网站（推荐，简单）

#### 第一步：创建GitHub仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `workbuddy-agents-marketplace`
   - **Description**: WorkBuddy Agents Marketplace - 专业AI Agent市场
   - **Public**: ✅ 勾选
   - **Initialize this repository**: ❌ 不勾选（我们已有本地仓库）
3. 点击 "Create repository"

#### 第二步：获取仓库地址

创建后，GitHub会显示一个地址，类似：
```
https://github.com/YOUR_USERNAME/workbuddy-agents-marketplace.git
```

复制这个地址。

#### 第三步：推送代码到GitHub

在终端中运行以下命令（替换YOUR_USERNAME）：

```bash
cd ~/.workbuddy/agents-marketplace

# 添加远程仓库（替换YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/workbuddy-agents-marketplace.git

# 推送代码
git push -u origin main
```

#### 第四步：启用GitHub Pages

1. 访问你创建的GitHub仓库
2. 点击 "Settings" 标签
3. 在左侧菜单中找到 "Pages"
4. 在 "Build and deployment" 部分：
   - **Branch**: 选择 `main`
   - **Folder**: 选择 `/ (root)`
5. 点击 "Save"

等待1-2分钟，GitHub会生成一个公开链接，格式类似：
```
https://YOUR_USERNAME.github.io/workbuddy-agents-marketplace/
```

---

### 方法2: 使用GitHub CLI（需要安装）

#### 安装GitHub CLI

```bash
# macOS
brew install gh

# Linux
sudo apt install gh

# Windows
# 从 https://cli.github.com/ 下载安装
```

#### 登录GitHub

```bash
gh auth login
```

#### 创建仓库并推送

```bash
cd ~/.workbuddy/agents-marketplace

# 创建GitHub仓库
gh repo create workbuddy-agents-marketplace --public --description "WorkBuddy Agents Marketplace - 专业AI Agent市场" --source=.

# 或使用现有仓库
gh repo set-default YOUR_USERNAME/workbuddy-agents-marketplace
```

---

### 方法3: 使用Git命令推送

```bash
cd ~/.workbuddy/agents-marketplace

# 添加远程仓库（替换YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/workbuddy-agents-marketplace.git

# 推送到GitHub
git push -u origin main
```

---

## 🌐 部署后的URL

GitHub Pages会自动生成公开链接，格式为：

```
https://YOUR_USERNAME.github.io/workbuddy-agents-marketplace/
```

例如，如果你的GitHub用户名是 `johndoe`，链接就是：
```
https://johndoe.github.io/workbuddy-agents-marketplace/
```

---

## ✅ 验证部署

1. 访问你的GitHub Pages链接
2. 应该能看到WorkBuddy Agents Marketplace的界面
3. 检查Reveal Specialist Agent是否显示正确
4. 测试"复制命令"功能是否正常

---

## 🔄 更新部署

当你更新Agents或添加新Agent时：

```bash
cd ~/.workbuddy/agents-marketplace

# 添加更改
git add .

# 提交更改
git commit -m "Update: 添加新Agent"

# 推送到GitHub
git push
```

GitHub Pages会自动重新部署，通常在1-2分钟内完成。

---

## 🎯 自定义域名（可选）

如果你想使用自己的域名：

1. 在域名DNS设置中添加CNAME记录：
   - **Name**: `workbuddy`（或你想要的子域名）
   - **Target**: `YOUR_USERNAME.github.io`

2. 在GitHub仓库的Pages设置中：
   - 点击 "Add a domain"
   - 输入你的域名（如：`workbuddy.yourdomain.com`）
   - 等待DNS生效

---

## 📊 访问统计

GitHub Pages不提供内置的访问统计，你可以：

1. 使用Google Analytics
2. 使用Cloudflare Analytics
3. 使用其他第三方统计服务

在 `index.html` 的 `<head>` 标签中添加统计代码。

---

## 🔒 安全设置

### 公开访问

- GitHub Pages默认公开访问
- 任何人都可以访问你的Marketplace

### 访问限制（可选）

如果需要限制访问：

1. GitHub Pages不支持访问限制
2. 可以使用Netlify、Vercel等服务
3. 这些服务支持密码保护和访问控制

---

## 📝 示例：完整部署流程

```bash
# 1. 进入目录
cd ~/.workbuddy/agents-marketplace

# 2. 添加远程仓库（替换YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/workbuddy-agents-marketplace.git

# 3. 推送到GitHub
git push -u origin main

# 4. 在GitHub网站启用Pages
# 访问: https://github.com/YOUR_USERNAME/workbuddy-agents-marketplace/settings/pages
# 设置: Branch = main, Folder = / (root)

# 5. 等待1-2分钟
# 访问: https://YOUR_USERNAME.github.io/workbuddy-agents-marketplace/
```

---

## 💡 提示

1. **首次部署可能需要5-10分钟**，GitHub需要生成SSL证书
2. **每次推送后自动部署**，无需手动操作
3. **HTTPS默认启用**，安全访问
4. **免费服务**，无需付费

---

## 🆘 常见问题

### Q: 推送时提示认证失败？

A: 使用Personal Access Token：
1. 访问 https://github.com/settings/tokens
2. 生成新token，勾选 `repo` 权限
3. 使用token代替密码：
```bash
git push -u origin main
# Username: YOUR_USERNAME
# Password: ghp_xxxxxxxxxxxxxx (你的token)
```

### Q: Pages链接404错误？

A: 检查：
1. GitHub仓库是否为Public（公开）
2. Pages设置是否正确（Branch = main, Folder = / (root)）
3. 是否等待了足够的时间（至少2分钟）

### Q: 如何查看部署日志？

A: 在GitHub仓库的 "Actions" 标签中查看部署日志。

---

## 🎉 部署成功！

部署成功后，你会获得一个公开链接，可以分享给任何人使用！

**示例链接**：
```
https://YOUR_USERNAME.github.io/workbuddy-agents-marketplace/
```

---

**开发者**: 习智场景化创新训练  
**更新日期**: 2026-03-22

🚀 **立即开始部署！**
