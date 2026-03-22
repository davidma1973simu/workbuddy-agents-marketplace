# 🚀 WorkBuddy Agents Marketplace - 快速部署指南

## 📋 三步部署到GitHub Pages

### 方法1：使用部署脚本（推荐，最简单）

```bash
# 1. 进入目录
cd ~/.workbuddy/agents-marketplace

# 2. 运行部署脚本（替换YOUR_USERNAME）
./deploy.sh YOUR_USERNAME

# 3. 按提示操作
```

**示例**：
```bash
./deploy.sh johndoe
```

---

### 方法2：手动部署

#### 第一步：创建GitHub仓库

访问 https://github.com/new

填写：
- **Repository name**: `workbuddy-agents-marketplace`
- **Description**: `WorkBuddy Agents Marketplace - 专业AI Agent市场`
- **Public**: ✅ 勾选

点击 "Create repository"

#### 第二步：推送代码

```bash
cd ~/.workbuddy/agents-marketplace

# 添加远程仓库（替换YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/workbuddy-agents-marketplace.git

# 推送代码
git push -u origin main
```

#### 第三步：启用GitHub Pages

1. 访问你创建的GitHub仓库
2. 点击 "Settings" → "Pages"
3. 设置：
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. 点击 "Save"

等待1-2分钟，访问你的链接：
```
https://YOUR_USERNAME.github.io/workbuddy-agents-marketplace/
```

---

## 🌐 部署后的链接

成功后，你会获得一个公开链接，例如：

```
https://johndoe.github.io/workbuddy-agents-marketplace/
```

任何人都可以访问这个链接，查看WorkBuddy Agents Marketplace！

---

## ✅ 验证部署

访问你的GitHub Pages链接，检查：

- ✅ 页面正常显示
- ✅ Reveal Specialist Agent卡片显示正确
- ✅ "复制命令"功能正常
- ✅ 所有链接可以访问

---

## 🔄 更新部署

当你更新Agents时：

```bash
cd ~/.workbuddy/agents-marketplace

# 添加更改
git add .

# 提交更改
git commit -m "Update: 添加新Agent"

# 推送到GitHub
git push
```

GitHub Pages会自动重新部署，1-2分钟后更新完成。

---

## 💡 常见问题

### Q: 推送时提示认证失败？

A: 使用Personal Access Token：
1. 访问 https://github.com/settings/tokens
2. 生成新token，勾选 `repo` 权限
3. 使用token代替密码

### Q: Pages链接404错误？

A: 检查：
1. GitHub仓库是否为Public
2. Pages设置是否正确
3. 是否等待了足够的时间（至少2分钟）

---

## 📚 更多信息

- **详细部署指南**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Agent标准**: [AGENTS_STANDARD.md](./AGENTS_STANDARD.md)
- **Marketplace说明**: [README.md](./README.md)

---

**开发者**: 习智场景化创新训练  
**更新日期**: 2026-03-22

🚀 **立即开始部署！**
