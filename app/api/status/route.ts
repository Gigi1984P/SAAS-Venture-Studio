import { NextResponse } from "next/server";

const HTML = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>System Status — SAAS Venture Studio</title>
<style>:root{--bg:#0a0a0a;--card:#111;--border:#1a1a1a;--text:#e5e5e5;--muted:#737373;--green:#22c55e;--green-bg:#22c55e1a;--red:#ef4444;--red-bg:#ef44441a;--amber:#f59e0b;--amber-bg:#f59e0b1a}*{box-sizing:border-box}body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;display:flex;justify-content:center;align-items:center;min-height:100vh}.container{width:100%;max-width:640px;padding:24px}.header{text-align:center;margin-bottom:32px}.header h1{margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.02em}.header p{margin:0;color:var(--muted)}.overall{border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;transition:all .3s ease}.overall.ok{background:var(--green-bg);border:1px solid #22c55e33}.overall.error{background:var(--red-bg);border:1px solid #ef444433}.overall svg{width:64px;height:64px;margin-bottom:16px}.overall h2{margin:0 0 8px;font-size:22px}.overall .meta{color:var(--muted);font-size:13px}.checks{display:flex;flex-direction:column;gap:12px}.check{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:center;justify-content:space-between;transition:background .2s}.check:hover{background:#161616}.check-left{display:flex;align-items:center;gap:12px}.check-left svg{width:20px;height:20px;flex-shrink:0}.check-title{font-weight:600}.check-desc{color:var(--muted);font-size:12px}.badge{font-size:12px;font-weight:500;padding:4px 12px;border-radius:999px;white-space:nowrap}.badge.ok{background:var(--green-bg);color:var(--green)}.badge.error{background:var(--red-bg);color:var(--red)}.badge.missing{background:var(--amber-bg);color:var(--amber)}.latency{color:var(--muted);font-size:12px;margin-right:8px}.loading{text-align:center;padding:48px}.spinner{width:32px;height:32px;border:2px solid var(--border);border-top-color:var(--text);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}.error-box{background:var(--red-bg);border:1px solid #ef444433;border-radius:12px;padding:24px;text-align:center}.error-box button{margin-top:16px;background:var(--text);color:var(--bg);border:none;padding:8px 20px;border-radius:8px;font-weight:600;cursor:pointer}.footer{text-align:center;margin-top:24px;color:var(--muted);font-size:13px}.footer a{color:var(--text);text-decoration:none}.footer a:hover{text-decoration:underline}</style>
</head>
<body>
<div class="container">
<div class="header"><h1>System Status</h1><p>Real-time health checks for SAAS Venture Studio</p></div>
<div id="overall"></div>
<div id="checks"></div>
<div class="footer"><p>Checks refresh automatically every 30 seconds.</p><p style="margin-top:4px"><a href="/api/health" target="_blank">View raw JSON →</a></p></div>
</div>
<script>
const labels={database:'PostgreSQL Database',nextauth:'NEXTAUTH_SECRET',databaseUrl:'DATABASE_URL',resend:'RESEND_API_KEY'};
const descs={database:'Verbindung zur PostgreSQL-Datenbank',nextauth:'NextAuth JWT-Secret für Session-Signatur',databaseUrl:'Datenbank-Verbindungsstring',resend:'E-Mail-Versand über Resend'};
function iOk(){return '<svg fill="none" viewBox="0 0 24 24" stroke="#22c55e" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';}
function iErr(){return '<svg fill="none" viewBox="0 0 24 24" stroke="#ef4444" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';}
function iWarn(){return '<svg fill="none" viewBox="0 0 24 24" stroke="#f59e0b" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>';}
function render(data){const ok=data.status==='ok';document.getElementById('overall').innerHTML='<div class="overall '+(ok?'ok':'error')+'"><div style="display:flex;justify-content:center">'+(ok?iOk():iErr())+'</div><h2>'+(ok?'All Systems Operational':'Some Systems Degraded')+'</h2><p class="meta">Last updated: '+new Date(data.timestamp).toLocaleString()+' · Version: '+(data.version||'dev')+' · Env: '+(data.environment||data.nodeEnv||'unknown')+'</p><p class="meta">Response time: '+data.totalLatencyMs+'ms</p></div>';let h='<div class="checks">';for(const[k,c]of Object.entries(data.checks)){const icon=c.status==='ok'?iOk():c.status==='missing'?iWarn():iErr();const bc=c.status==='ok'?'ok':c.status==='missing'?'missing':'error';const bt=c.status==='ok'?'Operational':c.status==='missing'?'Missing':'Error';h+='<div class="check"><div class="check-left">'+icon+'<div><div class="check-title">'+(labels[k]||k)+'</div><div class="check-desc">'+(descs[k]||'')+'</div></div></div><div style="display:flex;align-items:center">'+(c.latencyMs?'<span class="latency">'+c.latencyMs+'ms</span>':'')+'<span class="badge '+bc+'">'+bt+'</span></div></div>';}h+='</div>';document.getElementById('checks').innerHTML=h;}
function ld(){document.getElementById('checks').innerHTML='<div class="loading"><div class="spinner"></div><p style="color:var(--muted)">Checking system health...</p></div>';}
function err(m){document.getElementById('overall').innerHTML='';document.getElementById('checks').innerHTML='<div class="error-box"><p style="margin:0;font-weight:600;color:var(--red)">Failed to fetch health status</p><p style="margin:8px 0 0 0;color:var(--muted);font-size:13px">'+m+'</p><button onclick="fh()">Retry</button></div>';}
async function fh(){ld();try{const r=await fetch('/api/health',{cache:'no-store'});const d=await r.json();render(d);}catch(e){err(String(e));}}
setInterval(fh,30000);fh();
</script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
