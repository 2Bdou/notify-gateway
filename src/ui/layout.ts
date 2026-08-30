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
        <a class="brand" href="/dashboard">Notify<span>Gateway</span></a>
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

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(opts.title)} · Notify Gateway</title>
  <style>${css}</style>
</head>
<body class="${opts.email ? "app" : "gate"}">
  ${nav}
  <main>
    ${opts.flash ? `<div class="flash">${esc(opts.flash)}</div>` : ""}
    ${opts.body}
  </main>
</body>
</html>`;
}

function navLink(href: string, label: string, active?: string): string {
  const on = active === href;
  return `<a href="${href}" class="${on ? "on" : ""}">${label}</a>`;
}

const css = `
:root {
  --bg: #0b1020;
  --bg2: #10172b;
  --surface: #141a2e;
  --line: #2a3454;
  --text: #e8eefc;
  --muted: #8b95b7;
  --accent: #6ea8fe;
  --ok: #3ecf8e;
  --warn: #f5a524;
  --bad: #f31260;
  --radius: 14px;
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
  font-family: "IBM Plex Sans", "Noto Sans SC", "PingFang SC", sans-serif;
  background: radial-gradient(1200px 600px at 10% -10%, #1b2a55 0%, transparent 50%), var(--bg);
  color: var(--text);
}
a { color: var(--accent); text-decoration: none; }
.app { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
.side {
  border-right: 1px solid var(--line);
  padding: 22px 16px;
  background: rgba(11,16,32,.82);
  display: flex; flex-direction: column; gap: 18px;
}
.brand { color: var(--text); font-weight: 700; font-size: 18px; letter-spacing: .02em; }
.brand span { color: var(--accent); }
.side nav { display: flex; flex-direction: column; gap: 6px; }
.side nav a { color: var(--muted); padding: 10px 12px; border-radius: 10px; }
.side nav a.on, .side nav a:hover { background: #1a2340; color: var(--text); }
.who { margin-top: auto; color: var(--muted); font-size: 13px; }
main { padding: 28px; }
.gate main { max-width: 440px; margin: 10vh auto; }
h1 { font-size: 26px; margin: 0 0 8px; }
.sub { color: var(--muted); margin: 0 0 22px; }
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
}
.grid { display: grid; gap: 14px; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.stat b { display: block; font-size: 28px; margin-top: 6px; }
.row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
label { display: block; font-size: 13px; color: var(--muted); margin: 0 0 6px; }
input, select, textarea {
  width: 100%; background: var(--bg); color: var(--text);
  border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; font: inherit;
}
textarea { min-height: 90px; }
.field { margin-bottom: 14px; }
button, .btn {
  appearance: none; border: 0; background: var(--accent); color: #081018;
  padding: 10px 14px; border-radius: 10px; font-weight: 650; cursor: pointer; font: inherit;
}
button.ghost, .btn.ghost { background: transparent; color: var(--text); border: 1px solid var(--line); }
button.danger, .btn.danger { background: var(--bad); color: white; }
button.link { background: none; color: var(--accent); padding: 0; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; color: var(--muted); font-weight: 500; padding: 10px 8px; border-bottom: 1px solid var(--line); }
td { padding: 12px 8px; border-bottom: 1px solid #1d2540; vertical-align: top; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; }
.badge.sent, .badge.success { background: #3ecf8e22; color: var(--ok); }
.badge.partial { background: #f5a52422; color: var(--warn); }
.badge.failed { background: #f3126022; color: var(--bad); }
.badge.pending, .badge.skipped { background: #6ea8fe22; color: var(--accent); }
.flash { background: #1b2a55; border: 1px solid var(--line); padding: 10px 12px; border-radius: 10px; margin-bottom: 14px; }
.empty { color: var(--muted); padding: 28px 8px; text-align: center; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.keybox { background: var(--bg); border: 1px dashed var(--accent); padding: 12px; border-radius: 10px; word-break: break-all; }
.filters { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 16px; }
.chk { display:flex; align-items:center; gap:8px; color:var(--text); font-size:14px; }
.chk input { width:auto; }
.settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.hint { color:var(--muted); font-size:13px; margin:0 0 14px; }
.okflash { background:#123528; border:1px solid #2a6b4a; color:var(--ok); padding:10px 12px; border-radius:10px; margin-bottom:14px; }
.badflash { background:#3a1020; border:1px solid #6b2a3d; color:#ff8aa8; padding:10px 12px; border-radius:10px; margin-bottom:14px; }
@media (max-width: 900px) {
  .settings-grid { grid-template-columns:1fr; }
}
@media (max-width: 900px) {
  .app { grid-template-columns: 1fr; }
  .side { border-right: 0; border-bottom: 1px solid var(--line); }
  .stats, .filters { grid-template-columns: 1fr 1fr; }
  main { padding: 16px; }
}
`;
