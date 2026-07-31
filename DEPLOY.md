# 🚀 月亮通讯 · Render 部署指南

把整套系统(后端 NestJS + 前端 Vue + PostgreSQL)部署到 [Render](https://render.com) 试运行。

> 代码侧已全部就绪:`render.yaml` 蓝图、生产地址可配、健康检查、PostgreSQL。
> 下面 **1、2 步需要你自己做**(涉及账号/密码,我无法代劳),第 3 步之后照着点即可。

---

## 1. 把代码推到 GitHub

在 `E:\website\yueliang` 目录(已 `git init`):

```bash
git add .
git commit -m "月亮通讯 P0-P5"
git branch -M main
git remote add origin https://github.com/<你的用户名>/yueliang.git
git push -u origin main
```

> 需要先在 GitHub 新建一个空仓库 `yueliang`(Private 也行)。

## 2. 在 Render 上一键部署(Blueprint)

1. 登录 https://dashboard.render.com
2. **New → Blueprint**
3. 连接并选择你刚推的 `yueliang` 仓库
4. Render 会读到根目录的 `render.yaml`,自动创建 3 个资源:
   - `yueliang-db`(PostgreSQL,免费)
   - `yueliang-backend`(NestJS Web Service)
   - `yueliang-frontend`(Vue 静态站)
5. 点 **Apply**,等后端 + 数据库先部署好

## 3. 部署后:让前端指向后端

后端部署好后会有个公网地址,形如 `https://yueliang-backend.onrender.com`。

到 **yueliang-frontend → Environment**,填两个变量(值用你后端的真实地址):

| 变量 | 值 |
|------|-----|
| `VITE_API_BASE` | `https://yueliang-backend.onrender.com/api` |
| `VITE_WS_URL` | `https://yueliang-backend.onrender.com` |

保存后 **Manual Deploy → Deploy latest commit** 重新构建前端(Vite 在构建时把地址打进包里)。

## 4. 打开试用

- 前端地址:`https://yueliang-frontend.onrender.com`
- 默认管理员:`admin` / `admin123`
- 粉丝端模拟:`https://yueliang-frontend.onrender.com/fan-demo`

---

## 说明与注意

- **数据库**:后端启动时 `prisma db push` 自动建表,首启动自动创建管理员账号。
- **免费额度**:
  - Web Service 闲置 15 分钟会休眠,下次访问冷启动约 30 秒(首次打开慢属正常)。
  - 免费 PostgreSQL 约 90 天后过期,试运行足够。
- **实时通讯**:Render 的 Web Service 支持 WebSocket,聊天/接粉正常。
- **CORS**:后端已放开跨域,前端静态站可直接调。
- **P6 微信对接**尚未接入,试运行范围是 P0–P5(看板/小程序/客服/实时对话/设置)。

## 备选:不想用 Blueprint,手动建

分别 New 三个资源即可:
1. **PostgreSQL**(免费),复制其 Internal Database URL。
2. **Web Service**:仓库 `yueliang`,Root Directory `backend`,Build `npm install && npx prisma generate && npm run build`,Start `npx prisma db push --accept-data-loss && node dist/main`,环境变量 `DATABASE_URL`(粘贴上面的)、`JWT_SECRET`(随便一段)、`JWT_EXPIRES=8h`。
3. **Static Site**:仓库 `yueliang`,Root Directory `frontend`,Build `npm install && npm run build`,Publish `dist`,环境变量 `VITE_API_BASE` / `VITE_WS_URL`(见第 3 步),并加一条 Rewrite 规则 `/*` → `/index.html`。
