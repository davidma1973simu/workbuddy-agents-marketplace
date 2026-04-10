#!/bin/bash
# Eureka 落地页 EdgeOne Pages 自动部署脚本
# 使用方式: ./deploy.sh

set -e

echo "🚀 Eureka 落地页 EdgeOne Pages 部署脚本"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}步骤 1/3:${NC} 检查文件..."
if [ ! -f "index.html" ]; then
    echo "❌ 错误: index.html 不存在"
    exit 1
fi
echo -e "${GREEN}✓${NC} index.html 存在"

# 创建 zip 包
echo ""
echo -e "${BLUE}步骤 2/3:${NC} 创建部署包..."
cd ..
zip -r eureka-landing-page.zip eureka-landing-page/ -x "*.git*" -x "*.zip" -q
echo -e "${GREEN}✓${NC} 已创建 eureka-landing-page.zip"

# 检查 EdgeOne CLI
echo ""
echo -e "${BLUE}步骤 3/3:${NC} 检查 EdgeOne CLI..."
if ! command -v edgeone &> /dev/null; then
    echo -e "${YELLOW}⚠ EdgeOne CLI 未安装${NC}"
    echo "正在安装..."
    npm install -g @edgeone/cli
fi

# 检查登录状态
echo ""
echo "检查 EdgeOne 登录状态..."
if ! edgeone whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ 未登录 EdgeOne${NC}"
    echo "请运行: edgeone login -s china"
    echo ""
    echo "或者使用 API Token 部署:"
    echo "  edgeone pages deploy eureka-landing-page -n eureka-landing -t YOUR_API_TOKEN"
    exit 1
fi

# 部署
echo ""
echo -e "${GREEN}✓${NC} 已登录，开始部署..."
edgeone pages deploy eureka-landing-page -n eureka-landing -e production

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 部署完成!${NC}"
echo ""
echo "部署完成后，你将获得一个类似以下的域名:"
echo "  https://eureka-landing-xxx.edgeone.dev"
echo ""
echo "你可以在 EdgeOne 控制台配置自定义域名:"
echo "  https://console.tencentcloud.com/edgeone/pages"
echo ""
