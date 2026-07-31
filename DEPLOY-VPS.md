# 🖥️ 月亮通讯 · 香港 VPS 部署(给客户看,无域名)

一台服务器全搞定:Nginx 同源 + NestJS(PM2)+ MySQL,IP + http 直接访问。

## 1. 买服务器时选什么

| 项 | 选择 |
|----|------|
| 内存 | **2GB 起**(关键,别选 1GB) |
| CPU / 硬盘 | 1 核 / 40GB SSD 即可 |
| **系统镜像** | **Ubuntu 22.04**(别选 CentOS / Windows) |
| 地区 | 香港 |

> 记下开机后给的:**公网 IP**、**root 密码**(或 SSH 端口)。

## 2. 连上服务器

Windows 用自带的 `ssh`(PowerShell/cmd):

```bash
ssh root@你的服务器IP
```

首次会问 yes,然后输 root 密码。

## 3. 一键部署(三条命令)

```bash
apt-get update && apt-get install -y git
git clone https://github.com/miscos330/yueliang.git /opt/yueliang
cd /opt/yueliang && bash deploy-vps.sh
```

脚本会自动装好 Node / MySQL / Nginx / PM2,建库建表、构建前后端、配好反代和开机自启。约 5–10 分钟。

## 4. 完成

脚本结尾会打印:

```
访问地址 : http://你的IP/
管理员   : admin / admin123
粉丝端   : http://你的IP/fan-demo
MySQL root 密码: (请保存)
```

浏览器打开 `http://你的IP/` 就能给客户演示了。

## 演示实时对话

一个浏览器登录后台(admin)进「客服」建个客服账号并登录进「工作台」;
另一个标签开 `http://你的IP/fan-demo` 发消息 —— 实时接粉对话。
(客户演示时,你登客服工作台,让客户在手机浏览器开 `/fan-demo`,当场对话。)

## 常用运维

```bash
pm2 logs yueliang-backend      # 后端日志
pm2 restart yueliang-backend   # 重启后端
pm2 status                     # 进程状态
```

## 更新代码后重新部署

```bash
cd /opt/yueliang && git pull && bash deploy-vps.sh
```

---

> 说明:当前是 http(无 HTTPS)。给客户看够用。以后有域名了告诉我,我帮你加 Certbot 免费 HTTPS。
