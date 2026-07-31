# 🌙 月亮通讯 · 客服管理系统

多小程序接入的客服系统:多个微信小程序 → 用户(粉)发消息 → 按规则「接粉」分配给在线客服 → 客服工作台实时回复。

- **前端** `frontend/`:Vue 3 + Element Plus + Vite + Pinia + Vue Router
- **后端** `backend/`:NestJS + JWT 鉴权(Socket.io / MySQL / Redis 后续阶段接入)

---

## 环境要求

- Node.js ≥ 18(当前机器 Node 25,OK)
- npm ≥ 9

## 启动(开两个终端)

**终端 1 — 后端**(Windows cmd 跨盘符记得加 `/d`)

```bat
cd /d E:\website\yueliang\backend
npm install
npm run dev
```

启动后:`http://localhost:3100/api`

**终端 2 — 前端**

```bat
cd /d E:\website\yueliang\frontend
npm install
npm run dev
```

浏览器打开:`http://localhost:5273`

> 前端已配置代理:`/api` → `http://localhost:3100`,两个一起开就能联调。

## 默认账号

```
用户名:admin
密码:  admin123
```

> P0 阶段账号硬编码在 `backend/src/auth/auth.service.ts`,P3「客服管理」会换成数据库 + bcrypt。

---

## 实时客服对话(P4)

- **客服工作台**:登录后进侧边栏「工作台」——会话列表 + 实时聊天 + 快捷回复 + 粉丝资料
- **粉丝端模拟页**:`http://localhost:5273/fan-demo`(公开页,模拟微信小程序用户,真实对接在 P6)

**测实时对话**:一个浏览器标签登录**客服角色**账号(如 `xiaomei` / `cs123456`)进工作台;另一个标签开 `/fan-demo` 发消息。粉丝会被自动「接粉」分配给在线客服,双向消息实时收发。

> 底层 Socket.io(WebSocket),网关在后端 3100。在线状态/接粉暂用「内存 + 数据库」实现,Redis 留作多实例扩展再加。

---

## 本地 MySQL(P2 起用)

免安装版 MySQL 8.4.3,已初始化完毕,数据落在解压目录内。

| 项 | 值 |
|----|----|
| 安装位置 | `E:\mysql-8.4.3-winx64\` |
| 数据目录 | `E:\mysql-8.4.3-winx64\data\` |
| 端口 | 3306 |
| 账号 / 密码 | `root` / `yueliang` |
| 数据库 | `yueliang` |
| 连接串 | `mysql://root:yueliang@localhost:3306/yueliang`(见 `backend/.env`) |

**启动 / 停止 MySQL**(双击运行):

```bat
E:\website\yueliang\scripts\start-mysql.bat
E:\website\yueliang\scripts\stop-mysql.bat
```

> 当前为「免服务」方式:MySQL 以普通进程运行,关掉窗口即停止(数据保留在磁盘)。
> 想开机自启 / 常驻后台,可用**管理员权限**注册成 Windows 服务(`mysqld --install`),需要提权。
> 改动 `schema.prisma` 后同步表结构:`cd backend && npx prisma db push`

---

## 端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Vite | 5273 | 开发服务器 |
| 后端 NestJS | 3100 | REST API,前缀 `/api`(特意避开现有 NextClient 官网的 3000) |

## 目录结构

```
yueliang/
├── frontend/
│   └── src/
│       ├── api/            # axios 封装 + 各模块接口
│       ├── layouts/        # AdminLayout(侧边栏后台布局)
│       ├── router/         # 路由 + 登录守卫
│       ├── stores/         # Pinia(用户/登录态)
│       ├── styles/         # 全局样式 + 主题色覆盖
│       └── views/          # Login / Dashboard / Miniapp / Cs / Settings
└── backend/
    └── src/
        ├── auth/           # 登录 + JWT 守卫
        └── stats/          # 数据统计接口
```

## 路线图

| 阶段 | 内容 | 状态 |
|------|------|------|
| **P0** | 项目脚手架(前后端 + 登录 + 布局) | ✅ 已完成 |
| **P1** | 数据统计看板(图1) | ✅ 已完成 |
| **P2** | 小程序管理(图2)+ MySQL/Prisma | ✅ 已完成 |
| **P3** | 客服管理(账号/分组/角色 + 登录迁移 DB+bcrypt) | ✅ 已完成 |
| **P4** | 客服聊天工作台(Socket.io 实时 + 接粉 + 粉丝端) | ✅ 已完成 |
| **P5** | 设置(接粉策略 / 消息模板 / 系统参数) | ✅ 已完成 |
| P6 | 微信小程序客服消息对接 | ⏳ |

> P0/P1 阶段的统计接口先返回空态(全 0,与设计图一致),不依赖数据库即可运行。
> P2 起接入 MySQL + Redis,统计改为真实聚合。
