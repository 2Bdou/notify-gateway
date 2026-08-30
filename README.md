# Notify Gateway

续期和备份任务的通知中转站。多个项目共用一个网关，各自一把 API Key，按项目开关把结构化结果发到邮件和 Telegram。

技术栈：Cloudflare Workers + KV + D1。管理后台是 Worker 直接输出的 HTML。

## 能做什么

- 邮箱 + 密码登录，JWT 写入 HttpOnly Cookie
- 新建 / 编辑 / 软删除项目，默认打开邮件和 Telegram
- 每个项目独立 Base64 Key，HMAC-SHA256 后写入 KV（`project_key:{hash}`）
- `POST /api/notify` 结构化上报，支持 `level=partial` 和多账号混合状态
- 请求通道与项目开关取交集后再发送
- 任务写入 D1，后台可按项目、发送状态、时间筛选，并下载 CSV
- IP 60 次/分钟、项目 120 次/分钟限流；正文不超过 5000 字
- 邮件和 Telegram 失败自动重试 3 次
- 后台「设置」页配置整站 SMTP / Telegram，改完立即生效
- 本地没配 SMTP / Bot 时走 mock，接口和后台仍可完整演示

## 本地运行

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

打开 http://127.0.0.1:43147/setup 创建管理员。需要真发信时，到后台 **设置** 填写 SMTP / Telegram，不必改 `.dev.vars`。然后新建项目，复制 Key。

```bash
export NOTIFY_URL=http://127.0.0.1:43147/api/notify
export NOTIFY_TOKEN='项目完整 Key'
python3 examples/notify.py
```

未配置 SMTP / Telegram 时，通道会返回 `mock_*` messageId，任务仍记为已发送。

```bash
npm test
```

## 部署到 Cloudflare

1. 在 Cloudflare 创建 Worker、KV 命名空间 `notify-projects`、D1 数据库 `notify-tasks`
2. 把 `wrangler.toml` 里的 KV / D1 id 换成真实 id
3. 执行建表：

```bash
npx wrangler d1 execute notify-tasks --remote --file=./schema.sql
```

4. 只配置登录与 Key 的根密钥（不要写进仓库）：

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put KEY_HMAC_SECRET
npx wrangler deploy
```

SMTP 和 Telegram **不要**再 `secret put`。部署后打开后台 **设置** 填写，点「发送测试」即可。若你以前写过这些 Secret，没填设置页时仍会作为回退。

5. 打开 `https://<worker>/setup` 创建管理员
6. 打开 **设置** 配置 SMTP / Telegram
7. 后台新建项目，把 Key 配到续期仓库：

```text
NOTIFY_URL=https://notify.example.com/api/notify
NOTIFY_TOKEN=该项目独立密钥
```

Workers 没有完整 Node 运行时，邮件通道用 `cloudflare:sockets` 直连你的第三方 SMTP（465 隐式 TLS / 587 STARTTLS），而不是 nodemailer。

## 上报格式

```
POST /api/notify
Authorization: Bearer <项目独立密钥>
```

```json
{
  "source": "puratya-renew",
  "title": "MWS 续期完成",
  "content": "续期完成报告",
  "level": "partial",
  "channel": ["email", "telegram"],
  "data": {
    "total": 5,
    "success": 3,
    "failed": 2,
    "details": [
      { "id": "bot_001", "name": "Bot A", "status": "success" },
      { "id": "bot_002", "name": "Bot B", "status": "failed", "error": "HTTP 403" }
    ]
  }
}
```

## 接口

| 路径 | 方法 | 说明 |
| --- | --- | --- |
| `/api/notify` | POST | 项目 Key 上报 |
| `/api/auth/login` | POST | 登录，返回 JWT |
| `/api/auth/logout` | POST | 登出 |
| `/api/projects` | GET / POST | 项目列表 / 新建 |
| `/api/projects/:id` | PUT / DELETE | 编辑 / 软删除 |
| `/api/projects/:id/regenerate` | POST | 轮换 Key |
| `/api/tasks` | GET | 任务列表 |
| `/api/tasks/:id` | GET | 任务详情 |
| `/api/tasks/export` | GET | 发送日志 CSV |
| `/api/settings` | GET / PUT | 通道设置（密码只回显掩码） |
| `/api/settings/test-email` | POST | 试发邮件 |
| `/api/settings/test-telegram` | POST | 试发 Telegram |
| `/health` | GET | KV / D1 / 通道是否已配齐 |

## 存储

KV

| Key | 含义 |
| --- | --- |
| `admin:{email}` | 管理员密码哈希 |
| `project:{id}` | 项目 JSON |
| `project_key:{keyHash}` | Key → 项目 ID |
| `ratelimit:*` | 限流计数 |
| `settings:channels` | 后台配置的 SMTP / Telegram |

D1 表：`admins`、`projects`、`tasks`。项目删除是软删，任务历史保留，对应 Key 映射立即失效。
