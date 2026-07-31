#!/usr/bin/env bash
#
# 月亮通讯 · 更新部署(拉最新代码 → 重建 → 重启,不动数据库/密码)
# 用法:cd /opt/yueliang && bash update.sh
#
set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ">>> 拉取最新代码"
cd "$REPO_DIR"
git pull

echo ">>> 后端:依赖 + 建表 + 构建 + 重启"
cd "$REPO_DIR/backend"
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart yueliang-backend

echo ">>> 前端:构建"
cd "$REPO_DIR/frontend"
npm install
npm run build
chmod -R a+rX "$REPO_DIR/frontend/dist"

echo "✅ 更新完成"
