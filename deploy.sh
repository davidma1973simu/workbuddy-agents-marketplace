#!/bin/bash

# WorkBuddy Agents Marketplace - 快速部署脚本
# 使用方法: ./deploy.sh YOUR_GITHUB_USERNAME

set -e

echo "🚀 WorkBuddy Agents Marketplace - 部署到GitHub Pages"
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo "❌ 错误：请提供GitHub用户名"
    echo ""
    echo "使用方法："
    echo "  ./deploy.sh YOUR_GITHUB_USERNAME"
    echo ""
    echo "示例："
    echo "  ./deploy.sh johndoe"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="workbuddy-agents-marketplace"
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo "📋 部署信息："
echo "  GitHub用户名: ${GITHUB_USERNAME}"
echo "  仓库名称: ${REPO_NAME}"
echo "  GitHub URL: ${GITHUB_URL}"
echo ""

# 检查远程仓库是否已配置
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ 远程仓库已配置"
    echo "  当前远程: $(git remote get-url origin)"
    echo ""
    read -p "是否更新远程仓库地址？(y/n): " update_remote
    if [ "$update_remote" = "y" ] || [ "$update_remote" = "Y" ]; then
        git remote set-url origin ${GITHUB_URL}
        echo "✅ 远程仓库已更新"
    fi
else
    echo "➕ 添加远程仓库..."
    git remote add origin ${GITHUB_URL}
    echo "✅ 远程仓库已添加"
fi

echo ""
echo "📦 推送代码到GitHub..."
echo ""

# 尝试推送
if git push -u origin main; then
    echo ""
    echo "✅ 推送成功！"
else
    echo ""
    echo "❌ 推送失败！"
    echo ""
    echo "可能的原因："
    echo "  1. GitHub仓库不存在"
    echo "  2. 需要认证"
    echo ""
    echo "请执行以下步骤："
    echo ""
    echo "1️⃣ 访问 https://github.com/new"
    echo "2️⃣ 创建新仓库："
    echo "   Repository name: ${REPO_NAME}"
    echo "   Public: ✅"
    echo "3️⃣ 重新运行此脚本"
    echo ""
    echo "或者，如果需要认证，使用Personal Access Token："
    echo "  1. 访问 https://github.com/settings/tokens"
    echo "  2. 生成新token（勾选repo权限）"
    echo "  3. 使用token代替密码推送"
    echo ""
    exit 1
fi

echo ""
echo "🌐 下一步："
echo ""
echo "1. 访问你的GitHub仓库："
echo "   ${GITHUB_URL}"
echo ""
echo "2. 进入 Settings → Pages"
echo "3. 配置："
echo "   Branch: main"
echo "   Folder: / (root)"
echo "4. 点击 Save"
echo ""
echo "5. 等待1-2分钟，访问："
echo "   https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/"
echo ""
echo "🎉 部署完成！"
