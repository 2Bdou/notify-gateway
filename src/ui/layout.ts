import { esc } from "./escape";

export function layout(opts: {
  title: string;
  email?: string;
  active?: string;
  body: string;
  flash?: string;
}): string {
  const nav = opts.email
    ? `<aside class="side">
        <a class="brand" href="/dashboard">${mark}<span class="brand-text">Notify<small>Gateway</small></span></a>
        <nav>
          ${navLink("/dashboard", "总览", opts.active)}
          ${navLink("/projects", "项目", opts.active)}
          ${navLink("/tasks", "任务", opts.active)}
          ${navLink("/settings", "设置", opts.active)}
        </nav>
        <div class="who">
          <div>${esc(opts.email)}</div>
          <form method="post" action="/api/auth/logout"><button class="link" type="submit">退出</button></form>
        </div>
      </aside>`
    : "";

  const main = `<main id="content">
    ${opts.flash ? `<div class="flash" role="status">${esc(opts.flash)}</div>` : ""}
    ${opts.body}
  </main>`;

  const frame = opts.email
    ? `${skip}${nav}${main}`
    : `${skip}<div class="gate-split">
        <aside class="gate-aside">
          <div>
            <a class="brand" href="/">${mark}<span class="brand-text">Notify<small>Gateway</small></span></a>
            <p>续期和备份任务共用这一处上报。每把 Key 只属于一个项目。</p>
          </div>
          <p class="gate-foot">邮件和 Telegram 按项目开关发送。</p>
        </aside>
        ${main}
      </div>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="通知中转站后台：管理项目密钥，查看续期与备份任务的发送记录。">
  <meta name="theme-color" content="#f3f2ed">
  <meta name="color-scheme" content="light">
  <title>${esc(opts.title)} · Notify Gateway</title>
  <link rel="icon" href="${favicon}">
  <link rel="preconnect" href="https://api.fontshare.com" crossorigin>
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.2.8/latin-400.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.2.8/latin-500.css">
  <style>${css}</style>
</head>
<body class="${opts.email ? "app" : "gate"}">
  ${frame}
  ${opts.email ? copyScript + taskListScript : ""}
</body>
</html>`;
}

const skip = `<a class="skip" href="#content">跳到内容</a>`;

const mark = `<span class="mark" aria-hidden="true"></span>`;

const favicon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231a1c19'/%3E%3Cpath d='M8 11.5h16M8 16h16M8 20.5h10' stroke='%23f4f3ee' stroke-width='1.7' stroke-linecap='round'/%3E%3C/svg%3E";

const copyScript = `<script>
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.getAttribute("data-copy") || "";
    const label = btn.textContent;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      btn.textContent = "已复制";
    } catch {
      btn.textContent = "复制失败";
    }
    setTimeout(() => { btn.textContent = label; }, 1600);
  });
});
</script>`;

const taskListScript = `<script>
function confirmTaskBulk() {
  const n = document.querySelectorAll('input[name="ids"]:checked').length;
  const note = document.getElementById("task-bulk-note");
  if (!n) {
    if (note) note.textContent = "请先勾选要删除的任务";
    return false;
  }
  if (note) note.textContent = "";
  return confirm("确定删除选中的 " + n + " 条任务？删除后不可恢复。");
}
(function () {
  const all = document.getElementById("task-select-all");
  const countEl = document.getElementById("task-selected-count");
  if (!all && !countEl) return;
  const boxes = function () { return Array.from(document.querySelectorAll('input[name="ids"]')); };
  const sync = function () {
    const list = boxes();
    const n = list.filter(function (b) { return b.checked; }).length;
    if (countEl) countEl.textContent = String(n);
    if (all && list.length) {
      all.checked = n === list.length;
      all.indeterminate = n > 0 && n < list.length;
    }
  };
  if (all) {
    all.addEventListener("change", function () {
      const on = all.checked;
      boxes().forEach(function (b) { b.checked = on; });
      sync();
    });
  }
  document.addEventListener("change", function (e) {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("name") === "ids") sync();
  });
  sync();
})();
</script>`;

function navLink(href: string, label: string, active?: string): string {
  const on = active === href;
  return `<a href="${href}" class="${on ? "on" : ""}"${on ? ' aria-current="page"' : ""}>${label}</a>`;
}

// Shape lock: surfaces 12px, controls 6px, badges 4px. One ink accent.
// Status chips use washed pastels and are not a second brand color.
const css = `
:root {
  --bg: #f3f2ed;
  --surface: #fbfbf8;
  --ink: #1a1c19;
  --paper: #f6f5f1;
  --muted: #5e655f;
  --line: #e3e0d8;
  --line-strong: #cfcabe;
  --ok-bg: #edf3ec;
  --ok: #346538;
  --warn-bg: #fbf3db;
  --warn: #956400;
  --bad-bg: #fdebec;
  --bad: #9f2f2d;
  --tag-bg: #efeee8;
  --radius-surface: 12px;
  --radius-control: 6px;
  --radius-badge: 4px;
  --shadow: 0 1px 0 rgba(26, 28, 25, 0.04);
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
  font: 400 14px/1.5 Satoshi, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
  background:
    radial-gradient(880px 360px at 0% -10%, rgba(26, 28, 25, 0.045), transparent 60%),
    var(--bg);
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.18;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1  0 0 0 0 0.11  0 0 0 0 0.09  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.app, .gate-split { position: relative; z-index: 1; }
a { color: inherit; text-decoration: none; }
main a:not(.btn):hover { text-decoration: underline; text-underline-offset: 3px; }
::selection { background: var(--ink); color: var(--paper); }
.skip {
  position: absolute;
  left: 12px;
  top: 10px;
  z-index: 5;
  transform: translateY(-160%);
  background: var(--ink);
  color: var(--paper);
  padding: 8px 12px;
  border-radius: var(--radius-control);
}
.skip:focus { transform: none; }
.app { display: grid; grid-template-columns: 220px minmax(0, 1fr); min-height: 100dvh; }
.side {
  position: sticky;
  top: 0;
  height: 100dvh;
  border-right: 1px solid var(--line);
  padding: 20px 14px 16px;
  background: rgba(251, 251, 248, 0.9);
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-weight: 600;
  letter-spacing: -0.03em;
  font-size: 16px;
  line-height: 1.1;
}
.brand small {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--muted);
}
.mark {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: var(--ink);
  position: relative;
  flex: none;
}
.mark::before, .mark::after {
  content: "";
  position: absolute;
  left: 5px;
  right: 5px;
  height: 1.5px;
  background: var(--paper);
}
.mark::before { top: 8px; }
.mark::after { top: 12px; box-shadow: 0 4px 0 var(--paper); }
.side nav { display: flex; flex-direction: column; gap: 2px; }
.side nav a {
  color: var(--muted);
  padding: 8px 10px;
  border-radius: var(--radius-control);
  font-weight: 500;
  transition: background-color 180ms ease, color 180ms ease;
}
.side nav a.on { background: var(--ink); color: var(--paper); }
.side nav a:hover:not(.on) { background: rgba(26, 28, 25, 0.05); color: var(--ink); }
.who { margin-top: auto; color: var(--muted); font-size: 12px; line-height: 1.45; word-break: break-all; }
.who form { margin-top: 4px; }
main { padding: 22px 28px 36px; max-width: 1280px; }
h1 {
  font-size: 26px;
  font-weight: 600;
  margin: 0;
  line-height: 1.15;
  letter-spacing: -0.035em;
  text-wrap: balance;
}
.sub {
  color: var(--muted);
  margin: 6px 0 0;
  font-size: 13.5px;
  line-height: 1.5;
  max-width: 62ch;
  text-wrap: pretty;
}
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-surface);
  padding: 14px 16px 16px;
  box-shadow: var(--shadow);
}
.card.mb { margin-bottom: 12px; }
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 14px;
}
.section-head.flush { margin-bottom: 8px; align-items: center; }
.meter {
  display: grid;
  grid-template-columns: 1.35fr repeat(3, 1fr);
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--radius-surface);
  overflow: hidden;
  margin: 16px 0 14px;
}
.meter-item { background: var(--surface); padding: 14px 16px 16px; }
.meter-item span { display: block; color: var(--muted); font-size: 12px; font-weight: 500; }
.meter-item b {
  display: block;
  margin-top: 4px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
.meter-lead { background: var(--ink); }
.meter-lead span { color: #c8c5bc; }
.meter-lead b { color: var(--paper); font-size: 32px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.create-bar { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
.create-bar .field { flex: 1 1 220px; margin: 0; min-width: 0; }
label { display: block; font-size: 12px; font-weight: 500; color: var(--muted); margin: 0 0 5px; }
input, select, textarea {
  width: 100%;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-control);
  padding: 8px 10px;
  font: inherit;
  transition: border-color 160ms ease;
}
textarea { min-height: 88px; }
::placeholder { color: var(--muted); opacity: 1; }
.field { margin-bottom: 10px; }
.field:last-child { margin-bottom: 0; }
button, .btn {
  appearance: none;
  border: 1px solid transparent;
  background: var(--ink);
  color: var(--paper);
  padding: 8px 12px;
  border-radius: var(--radius-control);
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  transition: background-color 180ms ease, transform 120ms ease, border-color 180ms ease;
}
button:hover, .btn:hover { background: #2c302c; text-decoration: none; }
button:active, .btn:active { transform: scale(0.98); }
button.ghost, .btn.ghost {
  background: transparent;
  color: var(--ink);
  border-color: var(--line-strong);
}
button.ghost:hover, .btn.ghost:hover { background: rgba(26, 28, 25, 0.04); }
button.danger, .btn.danger { background: #8d2f2a; color: #fff; }
button.danger:hover, .btn.danger:hover { background: #742622; }
button.link {
  background: none;
  border: 0;
  color: var(--ink);
  padding: 0;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
}
button.link:hover { background: none; }
a:focus-visible, button:focus-visible, .btn:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}
input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 1px;
  border-color: var(--ink);
}
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th {
  text-align: left;
  color: var(--muted);
  font-weight: 500;
  font-size: 12px;
  padding: 8px 10px 8px 0;
  border-bottom: 1px solid var(--line);
}
td {
  padding: 10px 10px 10px 0;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}
tbody tr { transition: background-color 160ms ease; }
tbody tr:hover td { background: rgba(26, 28, 25, 0.03); }
.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: var(--radius-badge);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  background: var(--tag-bg);
  color: #3c403c;
}
.badge.sent, .badge.success { background: var(--ok-bg); color: var(--ok); }
.badge.partial { background: var(--warn-bg); color: var(--warn); }
.badge.failed { background: var(--bad-bg); color: var(--bad); }
.badge.pending, .badge.skipped, .badge.tag { background: var(--tag-bg); color: #3c403c; }
.flash, .okflash, .badflash {
  border: 1px solid var(--line);
  border-left: 3px solid var(--ink);
  background: var(--surface);
  padding: 8px 12px;
  border-radius: var(--radius-control);
  margin-bottom: 12px;
  font-size: 13px;
}
.okflash { border-left-color: var(--ok); background: var(--ok-bg); color: #245c32; }
.badflash { border-left-color: var(--bad); background: var(--bad-bg); color: #7a2624; }
.empty { color: var(--muted); padding: 28px 8px; text-align: left; }
.mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; word-break: break-all; }
.keybox {
  background: var(--bg);
  border: 1px solid var(--line-strong);
  padding: 8px 10px;
  border-radius: var(--radius-control);
  word-break: break-all;
  font-size: 12px;
}
.filters {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr auto;
  gap: 10px;
  margin-bottom: 12px;
  align-items: end;
}
.filter-actions { display: flex; gap: 8px; align-items: center; }
.task-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.task-toolbar-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 0; }
.task-toolbar .count { color: var(--muted); font-size: 12px; }
.task-toolbar .count b { color: var(--ink); font-weight: 600; }
.form-note { margin: 0; color: var(--bad); font-size: 12px; font-weight: 500; }
.form-note:empty { display: none; }
.chkcol { width: 32px; }
.chkcol input { width: auto; margin: 0; }
td.actions { width: 72px; white-space: nowrap; }
button.small, .btn.small { padding: 5px 8px; font-size: 12px; }
.btn.disabled, button:disabled {
  background: #e6e3db;
  color: #6f756f;
  border-color: transparent;
  pointer-events: none;
}
.pager {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
}
.copyrow { display: flex; gap: 8px; align-items: stretch; }
.copyrow .keybox { flex: 1; margin: 0; min-width: 0; }
.copyrow button { flex-shrink: 0; align-self: center; }
.copy-label { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; }
.copy-label strong { font-size: 14px; font-weight: 600; letter-spacing: -0.02em; }
.chk { display: flex; align-items: center; gap: 6px; color: var(--ink); font-size: 13px; font-weight: 500; margin: 0; }
.chk.gap { margin-bottom: 14px; }
.chk input { width: auto; }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }
.hint { color: var(--muted); font-size: 12px; line-height: 1.5; margin: 4px 0 10px; }
.hint.after { margin: 8px 0 0; }
.page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 14px; }
.page-head .back { margin: 0 0 6px; font-size: 12px; }
.page-head .back a { color: var(--muted); }
.statline { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; font-size: 13px; color: var(--muted); }
.statline form { margin: 0; }
.statline b { color: var(--ink); font-size: 15px; font-weight: 600; }
.cred-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; }
.detail-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr); gap: 12px; align-items: start; }
.inline-host { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr) auto; gap: 10px; align-items: end; }
.inline-host .copyrow { margin-top: 0; }
.tight-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.channels { display: flex; gap: 14px; flex-wrap: wrap; }
.card > strong { display: block; margin-bottom: 4px; letter-spacing: -0.02em; }
.gate-split {
  display: grid;
  grid-template-columns: minmax(280px, 0.86fr) minmax(340px, 1.14fr);
  min-height: 100dvh;
}
.gate-aside {
  background: var(--ink);
  color: var(--paper);
  padding: 36px 36px 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  min-height: 100dvh;
}
.gate-aside .brand { color: var(--paper); }
.gate-aside .brand small { color: #c8c5bc; }
.gate-aside .mark { background: var(--paper); }
.gate-aside .mark::before, .gate-aside .mark::after { background: var(--ink); }
.gate-aside .mark::after { box-shadow: 0 4px 0 var(--ink); }
.gate-aside p {
  max-width: 28ch;
  margin: 28px 0 0;
  color: #c8c5bc;
  font-size: 18px;
  line-height: 1.45;
  letter-spacing: -0.02em;
  text-wrap: pretty;
}
.gate-foot { margin: 0; font-size: 13px; letter-spacing: 0; }
.gate main {
  max-width: none;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 48px 64px 72px;
}
.gate .card {
  background: transparent;
  border: 0;
  box-shadow: none;
  padding: 0;
  width: min(100%, 400px);
}
.gate h1 { font-size: 32px; }
.gate .sub { margin-bottom: 18px; }
.gate .field { margin-bottom: 12px; }
.gate button[type="submit"] { width: 100%; margin-top: 6px; padding: 10px 12px; }
.gate-aside :focus-visible { outline-color: var(--paper); }
@keyframes enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
main { animation: enter 480ms cubic-bezier(0.16, 1, 0.3, 1); }
@media (max-width: 1100px) {
  .detail-grid, .cred-grid, .inline-host { grid-template-columns: 1fr; }
  .meter { grid-template-columns: 1fr 1fr; }
  .meter-lead { grid-column: 1 / -1; }
}
@media (max-width: 900px) {
  .settings-grid { grid-template-columns: 1fr; }
  .app { grid-template-columns: 1fr; }
  .side {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
  }
  .side nav { flex-direction: row; flex-wrap: wrap; }
  .who { margin-top: 0; margin-left: auto; text-align: right; }
  .filters { grid-template-columns: 1fr 1fr; }
  .filter-actions { grid-column: 1 / -1; }
  main, .gate main { padding: 20px 16px 32px; }
  .page-head, .section-head { flex-direction: column; align-items: flex-start; gap: 10px; }
  .gate-split { grid-template-columns: 1fr; }
  .gate-aside { min-height: auto; padding: 24px 18px 8px; gap: 0; }
  .gate-aside p { margin-top: 16px; font-size: 15px; max-width: 36ch; }
  .gate-foot { display: none; }
  .gate main { align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
`;
