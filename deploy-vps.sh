#!/usr/bin/env bash
#
# 月亮通讯 · Ubuntu VPS 一键部署脚本
# 适用:Ubuntu 22.04 / 24.04,全新服务器,无需域名(IP + http)
#
# 用法(在服务器上,以 root 或 sudo):
#   1) 把源码解压/上传到 /opt/yueliang
#   2) cd /opt/yueliang && sudo bash deploy-vps.sh
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_NAME="yueliang"
BACKEND_PORT=3100
MYSQL_ROOT_PW="yl_$(openssl rand -hex 8)"
JWT_SECRET="$(openssl rand -hex 24)"

echo "=============================================="
echo " 月亮通讯 VPS 部署  (目录: $REPO_DIR)"
echo "=============================================="

# ---------- 1. 基础工具 ----------
echo ">>> [1/9] 更新系统 + 基础工具"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx ufw openssl ca-certificates

# ---------- 2. Swap(防止小内存构建 OOM) ----------
echo ">>> [2/9] 配置 2GB Swap(若不存在)"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "    已创建 2GB swap"
else
  echo "    swap 已存在,跳过"
fi

# ---------- 3. Node 20 ----------
echo ">>> [3/9] 安装 Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v

# ---------- 4. MySQL 8 ----------
echo ">>> [4/9] 安装 MySQL 8 + 建库"
apt-get install -y mysql-server
systemctl enable --now mysql
# 限制内存占用(小机器友好)
cat > /etc/mysql/mysql.conf.d/zz-yueliang.cnf <<EOF
[mysqld]
innodb_buffer_pool_size=128M
max_connections=50
EOF
systemctl restart mysql
# root 设密码 + 建库(首次 root 走 auth_socket,可无密码执行)
mysql <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PW}';
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
SQL

# ---------- 5. PM2 ----------
echo ">>> [5/9] 安装 PM2"
npm install -g pm2

# ---------- 6. 后端 ----------
echo ">>> [6/9] 部署后端(NestJS)"
cd "$REPO_DIR/backend"
cat > .env <<EOF
PORT=${BACKEND_PORT}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES=8h
DATABASE_URL="mysql://root:${MYSQL_ROOT_PW}@localhost:3306/${DB_NAME}"
EOF
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 delete yueliang-backend >/dev/null 2>&1 || true
pm2 start dist/main.js --name yueliang-backend

# ---------- 7. 前端 ----------
echo ">>> [7/9] 构建前端(Vue,同源模式)"
cd "$REPO_DIR/frontend"
npm install
npm run build          # 无需配后端地址:/api 与 socket 都走同源
chmod -R a+rX "$REPO_DIR/frontend/dist"

# ---------- 8. Nginx 同源反代 ----------
echo ">>> [8/9] 配置 Nginx"
cat > /etc/nginx/sites-available/yueliang <<EOF
server {
    listen 80 default_server;
    server_name _;
    root ${REPO_DIR}/frontend/dist;
    index index.html;

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    # WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
    # SPA 前端路由回退
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
ln -sf /etc/nginx/sites-available/yueliang /etc/nginx/sites-enabled/yueliang
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# ---------- 9. 防火墙 + 开机自启 ----------
echo ">>> [9/9] 防火墙 + PM2 开机自启"
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw --force enable || true
pm2 save
env PATH="$PATH:/usr/bin" pm2 startup systemd -u root --hp /root | tail -1 | bash || true
pm2 save

IP="$(curl -s --max-time 8 ifconfig.me || echo '你的服务器IP')"
echo ""
echo "=============================================="
echo " ✅ 部署完成!"
echo "----------------------------------------------"
echo " 访问地址 : http://${IP}/"
echo " 管理员   : admin / admin123"
echo " 粉丝端   : http://${IP}/fan-demo"
echo " MySQL root 密码(请保存): ${MYSQL_ROOT_PW}"
echo "----------------------------------------------"
echo " 常用命令:"
echo "   pm2 logs yueliang-backend   # 看后端日志"
echo "   pm2 restart yueliang-backend"
echo "=============================================="
