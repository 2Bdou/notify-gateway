import { maskKey } from "../projects";
import type { Project, TaskRecord } from "../types";
import { attr, esc } from "./escape";
import { layout } from "./layout";

export function loginPage(opts?: { error?: string; next?: string }): string {
  return layout({
    title: "登录",
    body: `
      <div class="card">
        <h1>通知中转站</h1>
        <p class="sub">用管理员邮箱登录，管理项目密钥与发送记录。</p>
        ${opts?.error ? `<div class="flash">${esc(opts.error)}</div>` : ""}
        <form method="post" action="/api/auth/login">
          <input type="hidden" name="next" value="${attr(opts?.next || "/dashboard")}">
          <div class="field"><label>邮箱</label><input name="email" type="email" required autocomplete="username"></div>
          <div class="field"><label>密码</label><input name="password" type="password" required autocomplete="current-password"></div>
          <button type="submit">登录</button>
        </form>
      </div>`,
  });
}

export function setupPage(opts?: { error?: string }): string {
  return layout({
    title: "初始化",
    body: `
      <div class="card">
        <h1>创建管理员</h1>
        <p class="sub">首次部署需要一个邮箱账号。密码至少 8 位，哈希后写入 KV 与 D1。</p>
        ${opts?.error ? `<div class="flash">${esc(opts.error)}</div>` : ""}
        <form method="post" action="/api/setup">
          <div class="field"><label>管理员邮箱</label><input name="email" type="email" required></div>
          <div class="field"><label>密码</label><input name="password" type="password" required minlength="8"></div>
          <button type="submit">创建并进入后台</button>
        </form>
      </div>`,
  });
}

export function dashboardPage(
  email: string,
  stats: { projects: number; total: number; sent: number; partial: number; failed: number },
  recent: TaskRecord[],
  names: Record<string, string>,
): string {
  return layout({
    title: "总览",
    email,
    active: "/dashboard",
    body: `
      <h1>总览</h1>
      <p class="sub">续期与备份任务的统一上报入口。每个项目一把独立 Key。</p>
      <div class="stats">
        ${stat("项目", stats.projects)}
        ${stat("任务", stats.total)}
        ${stat("已送达", stats.sent)}
        ${stat("部分失败", stats.partial + stats.failed)}
      </div>
      <div class="card">
        <div class="row" style="justify-content:space-between;margin-bottom:8px">
          <strong>最近任务</strong>
          <a href="/tasks">查看全部</a>
        </div>
        ${taskTable(recent, names)}
      </div>`,
  });
}

export function projectsPage(email: string, projects: Project[], flash?: string): string {
  const rows = projects
    .map(
      (p) => `<tr>
        <td><a href="/projects/${attr(p.id)}">${esc(p.name)}</a></td>
        <td class="mono">${esc(maskKey(p.apiKey))}</td>
        <td>${p.channels.map((c) => `<span class="badge pending">${esc(c)}</span>`).join(" ")}</td>
        <td>${p.enabled ? '<span class="badge success">开启</span>' : '<span class="badge failed">关闭</span>'}</td>
        <td>${esc(fmtTime(p.createdAt))}</td>
      </tr>`,
    )
    .join("");

  return layout({
    title: "项目",
    email,
    active: "/projects",
    flash,
    body: `
      <div class="row" style="justify-content:space-between">
        <div><h1>项目</h1><p class="sub">新建项目会立即生成 Base64 Key，并用 HMAC-SHA256 入库。</p></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <form method="post" action="/api/projects">
          <div class="row">
            <div class="field" style="flex:1;margin:0"><label>项目名称</label><input name="name" required placeholder="例如 puratya-renew"></div>
            <div class="field" style="margin:0"><label>邮件</label><input type="checkbox" name="channel_email" value="1" checked></div>
            <div class="field" style="margin:0"><label>Telegram</label><input type="checkbox" name="channel_telegram" value="1" checked></div>
            <button type="submit">新建项目</button>
          </div>
        </form>
      </div>
      <div class="card">
        ${
          rows
            ? `<table><thead><tr><th>名称</th><th>API Key</th><th>通道</th><th>状态</th><th>创建</th></tr></thead><tbody>${rows}</tbody></table>`
            : `<div class="empty">还没有项目。先创建一个，再把 Key 配到续期仓库的 NOTIFY_TOKEN。</div>`
        }
      </div>`,
  });
}

export function projectDetailPage(
  email: string,
  project: Project,
  stats: { total: number; sent: number; partial: number; failed: number },
  revealedKey?: string,
): string {
  return layout({
    title: project.name,
    email,
    active: "/projects",
    body: `
      <p><a href="/projects">← 项目列表</a></p>
      <h1>${esc(project.name)}</h1>
      <p class="sub">${esc(project.id)}</p>
      <div class="stats">
        ${stat("任务", stats.total)}
        ${stat("送达", stats.sent)}
        ${stat("部分失败", stats.partial)}
        ${stat("失败", stats.failed)}
      </div>
      ${
        revealedKey
          ? `<div class="card" style="margin-bottom:16px"><div>请立即复制完整 Key，离开本页后只显示掩码。</div><div class="keybox mono">${esc(revealedKey)}</div></div>`
          : ""
      }
      <div class="grid" style="grid-template-columns:2fr 1fr;gap:16px">
        <div class="card">
          <form method="post" action="/api/projects/${attr(project.id)}">
            <input type="hidden" name="_method" value="PUT">
            <div class="field"><label>名称</label><input name="name" value="${attr(project.name)}" required></div>
            <div class="field">
              <label>通知通道</label>
              <label><input type="checkbox" name="channel_email" ${project.channels.includes("email") ? "checked" : ""}> 邮件</label>
              <label><input type="checkbox" name="channel_telegram" ${project.channels.includes("telegram") ? "checked" : ""}> Telegram</label>
            </div>
            <div class="field">
              <label>项目开关</label>
              <label><input type="checkbox" name="enabled" ${project.enabled ? "checked" : ""}> 允许上报</label>
            </div>
            <button type="submit">保存</button>
          </form>
        </div>
        <div class="card">
          <div class="field"><label>当前 Key</label><div class="mono">${esc(maskKey(project.apiKey))}</div></div>
          <form method="post" action="/api/projects/${attr(project.id)}/regenerate" style="margin-bottom:12px">
            <button class="ghost" type="submit">重新生成 Key</button>
          </form>
          <form method="post" action="/api/projects/${attr(project.id)}" onsubmit="return confirm('软删除后 Key 立即失效，历史任务会保留。')">
            <input type="hidden" name="_method" value="DELETE">
            <button class="danger" type="submit">软删除项目</button>
          </form>
        </div>
      </div>`,
  });
}

export function tasksPage(
  email: string,
  items: TaskRecord[],
  names: Record<string, string>,
  projects: Project[],
  query: { projectId?: string; status?: string; from?: string; to?: string },
  total: number,
): string {
  const options = projects
    .map((p) => `<option value="${attr(p.id)}" ${query.projectId === p.id ? "selected" : ""}>${esc(p.name)}</option>`)
    .join("");
  const statuses = ["", "pending", "sent", "partial", "failed"]
    .map((s) => `<option value="${s}" ${query.status === s ? "selected" : ""}>${s || "全部状态"}</option>`)
    .join("");
  const qs = new URLSearchParams();
  if (query.projectId) qs.set("project_id", query.projectId);
  if (query.status) qs.set("status", query.status);
  if (query.from) qs.set("from", query.from);
  if (query.to) qs.set("to", query.to);

  return layout({
    title: "任务",
    email,
    active: "/tasks",
    body: `
      <div class="row" style="justify-content:space-between">
        <div><h1>任务</h1><p class="sub">共 ${total} 条。可按项目、发送状态和时间筛选。</p></div>
        <a class="btn ghost" href="/api/tasks/export?${qs.toString()}">下载 CSV</a>
      </div>
      <form class="filters" method="get" action="/tasks">
        <div><label>项目</label><select name="project_id"><option value="">全部项目</option>${options}</select></div>
        <div><label>状态</label><select name="status">${statuses}</select></div>
        <div><label>从</label><input type="date" name="from" value="${attr(query.from || "")}"></div>
        <div><label>到</label><input type="date" name="to" value="${attr(query.to || "")}"></div>
        <div style="align-self:end"><button type="submit">筛选</button></div>
      </form>
      <div class="card">${taskTable(items, names)}</div>`,
  });
}

export function taskDetailPage(
  email: string,
  task: TaskRecord,
  projectName: string,
): string {
  const details = (task.data?.details || [])
    .map(
      (d) => `<tr>
        <td>${esc(d.name)}</td>
        <td class="mono">${esc(d.id)}</td>
        <td><span class="badge ${d.status}">${esc(d.status)}</span></td>
        <td>${esc(d.error || d.message || "")}</td>
      </tr>`,
    )
    .join("");

  return layout({
    title: task.title,
    email,
    active: "/tasks",
    body: `
      <p><a href="/tasks">← 任务列表</a></p>
      <h1>${esc(task.title)}</h1>
      <p class="sub">${esc(projectName)} · ${esc(task.source)} · ${esc(fmtTime(task.createdAt))}</p>
      <div class="stats">
        ${stat("级别", task.level)}
        ${stat("发送", task.sendStatus)}
        ${stat("邮件", task.emailStatus || "—")}
        ${stat("Telegram", task.telegramStatus || "—")}
      </div>
      <div class="card" style="margin-bottom:16px">
        <p>${esc(task.content)}</p>
        ${task.error ? `<div class="flash">${esc(task.error)}</div>` : ""}
        <div class="mono">email id: ${esc(task.emailMessageId || "—")}<br>telegram id: ${esc(task.telegramMessageId || "—")}</div>
      </div>
      <div class="card">
        <strong>账号明细</strong>
        ${
          details
            ? `<table><thead><tr><th>账号</th><th>ID</th><th>状态</th><th>说明</th></tr></thead><tbody>${details}</tbody></table>`
            : `<div class="empty">这次上报没有账号明细。</div>`
        }
      </div>`,
  });
}

function taskTable(items: TaskRecord[], names: Record<string, string>): string {
  if (!items.length) return `<div class="empty">没有匹配的任务。</div>`;
  const rows = items
    .map(
      (t) => `<tr>
        <td><a href="/tasks/${t.id}">${esc(t.title)}</a></td>
        <td>${esc(names[t.projectId] || t.projectId)}</td>
        <td><span class="badge ${t.level}">${esc(t.level)}</span></td>
        <td><span class="badge ${t.sendStatus}">${esc(t.sendStatus)}</span></td>
        <td>${esc(t.data ? `${t.data.success}/${t.data.total}` : "—")}</td>
        <td>${esc(fmtTime(t.createdAt))}</td>
      </tr>`,
    )
    .join("");
  return `<table><thead><tr><th>标题</th><th>项目</th><th>级别</th><th>发送</th><th>账号</th><th>时间</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function stat(label: string, value: string | number): string {
  return `<div class="card stat"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
}

function fmtTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().replace("T", " ").slice(0, 19);
}
