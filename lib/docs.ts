/**
 * TeleBotHost MCP — Documentation Page Generator.
 *
 * Generates a self-contained HTML docs page (no external CSS/JS/fonts) that:
 *   - Lists all 68 tools (auto-generated from tools.ts)
 *   - Provides copy-paste MCP client configs (Claude Desktop, Cursor, VS Code, curl)
 *   - Explains the two-layer auth model (X-Tbh-Api-Key + optional MCP_AUTH_TOKEN)
 *   - Shows curl examples for testing
 *   - Is fully responsive (desktop / laptop / tablet / mobile)
 *   - Uses a dark theme matching TeleBotHost's existing docs aesthetic
 *
 * Served at:
 *   - GET /          (root, primary entry point)
 *   - GET /docs      (alias)
 *
 * Pre-fills the deployed URL by reading the request's Host header.
 */

import { allTools } from "./tools.js";

const SERVER_NAME = "telebothost-mcp";
const SERVER_VERSION = "2.0.0";
const PROTOCOL_VERSION = "2024-11-05";

const GITHUB_URL = "https://github.com/telebothost/mcp-server";
const TBH_DOCS_URL = "https://api.telebothost.com/api/v1/docs";
const MCP_SPEC_URL = "https://modelcontextprotocol.io";

// Tool group metadata (order matters for display)
const GROUPS: Array<{ name: string; icon: string; description: string }> = [
  { name: "Health", icon: "🩺", description: "API status & version probe" },
  { name: "Public Discovery", icon: "🌐", description: "Browse public profiles, templates, store — no auth required" },
  { name: "Bot Lifecycle", icon: "🤖", description: "Register, clone, transfer, import/export, delete bots" },
  { name: "Bot Storage", icon: "💾", description: "Sync/async storage stats, migration, clearing" },
  { name: "Broadcasts", icon: "📢", description: "Send messages to bot subscribers in bulk" },
  { name: "Commands", icon: "⚡", description: "Full CRUD for commands and command folders" },
  { name: "Env Vars", icon: "🔑", description: "Manage environment variables for a bot" },
  { name: "Logs & Analytics", icon: "📋", description: "Access runtime logs and user analytics" },
  { name: "Community Store", icon: "🛍️", description: "Browse and install community-published bots" },
  { name: "Quota", icon: "📊", description: "Check rate-limit quota usage" },
  { name: "Docs Search", icon: "🔍", description: "Search TBH API, TBL language, and Telegram Bot API docs" },
];

/** Generate the full HTML docs page. */
export function generateDocsHtml(origin: string): string {
  const mcpUrl = `${origin}/api/mcp`;
  const healthUrl = `${origin}/api/health`;

  // Group tools by their section in tools.ts (we infer from name prefix)
  const grouped = groupToolsBySection();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>TeleBotHost MCP Server — Docs</title>
<meta name="description" content="MCP server for the TeleBotHost Developer API. 68 tools covering bot lifecycle, storage, broadcasts, commands, and community store.">
<meta name="theme-color" content="#0d0e12">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0d0e12;--bg-card:#16171e;--bg-elev:#1e1f29;--bg-code:#0a0b0f;
    --border:#2a2b35;--border-strong:#3a3b47;
    --text:#e4e4e7;--text-dim:#9ca3af;--text-mute:#6b7280;
    --accent:#6366f1;--accent-hov:#818cf8;--accent-soft:rgba(99,102,241,.12);
    --green:#10b981;--amber:#f59e0b;--red:#ef4444;
    --radius:8px;--radius-sm:4px;
    --mono:'JetBrains Mono','SF Mono',ui-monospace,Menlo,Monaco,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  }
  html{scroll-behavior:smooth}
  body{
    background:var(--bg);color:var(--text);font-family:var(--sans);
    line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased;
  }
  a{color:var(--accent);text-decoration:none}
  a:hover{color:var(--accent-hov)}
  code{font-family:var(--mono);font-size:.875em;background:var(--bg-elev);padding:.15em .4em;border-radius:var(--radius-sm);color:var(--accent-hov)}

  /* ─── Nav ─── */
  .nav{
    position:sticky;top:0;z-index:50;
    background:rgba(13,14,18,.85);backdrop-filter:blur(12px);
    border-bottom:1px solid var(--border);
  }
  .nav-inner{
    max-width:1200px;margin:0 auto;padding:14px 24px;
    display:flex;align-items:center;justify-content:space-between;gap:16px;
  }
  .nav-logo{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px}
  .nav-logo-icon{font-size:20px}
  .nav-links{display:flex;gap:24px;align-items:center;font-size:14px}
  .nav-links a{color:var(--text-dim);transition:color .15s}
  .nav-links a:hover{color:var(--text)}
  .nav-badge{
    font-size:11px;padding:3px 8px;border-radius:99px;
    background:var(--accent-soft);color:var(--accent-hov);font-weight:500;
    border:1px solid rgba(99,102,241,.25);
  }
  @media(max-width:640px){.nav-links{gap:16px}.nav-links a:not(.nav-badge){font-size:13px}}

  /* ─── Hero ─── */
  .hero{padding:80px 24px 60px;text-align:center;border-bottom:1px solid var(--border)}
  .hero-inner{max-width:760px;margin:0 auto}
  .hero h1{font-size:clamp(32px,5vw,48px);font-weight:700;letter-spacing:-.02em;margin-bottom:16px;background:linear-gradient(135deg,#fff 0%,#a5b4fc 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .hero p{font-size:clamp(16px,2vw,19px);color:var(--text-dim);margin-bottom:28px;max-width:580px;margin-left:auto;margin-right:auto}
  .hero-badges{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:32px}
  .badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;font-size:12px;font-weight:500;border:1px solid var(--border);background:var(--bg-card)}
  .badge-green{color:var(--green);border-color:rgba(16,185,129,.3);background:rgba(16,185,129,.08)}
  .badge-amber{color:var(--amber);border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.08)}
  .badge-accent{color:var(--accent-hov);border-color:rgba(99,102,241,.3);background:var(--accent-soft)}
  .hero-cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:var(--radius);font-size:14px;font-weight:500;transition:all .15s;cursor:pointer;border:1px solid transparent}
  .btn-primary{background:var(--accent);color:#fff}
  .btn-primary:hover{background:var(--accent-hov);color:#fff;transform:translateY(-1px)}
  .btn-secondary{background:var(--bg-card);color:var(--text);border-color:var(--border)}
  .btn-secondary:hover{border-color:var(--border-strong);color:#fff}

  /* ─── Sections ─── */
  section{padding:64px 24px;border-bottom:1px solid var(--border)}
  .section-inner{max-width:1200px;margin:0 auto}
  .section-head{margin-bottom:36px}
  .section-head h2{font-size:clamp(24px,3vw,32px);font-weight:700;letter-spacing:-.01em;margin-bottom:8px}
  .section-head p{color:var(--text-dim);font-size:16px}
  .section-num{display:inline-block;font-family:var(--mono);font-size:13px;color:var(--accent-hov);background:var(--accent-soft);padding:2px 10px;border-radius:99px;margin-bottom:12px;border:1px solid rgba(99,102,241,.2)}

  /* ─── Quick Start ─── */
  .steps{display:grid;gap:20px;grid-template-columns:1fr}
  @media(min-width:880px){.steps{grid-template-columns:repeat(3,1fr)}}
  .step{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;position:relative}
  .step-num{position:absolute;top:-12px;left:20px;width:28px;height:28px;border-radius:50%;background:var(--accent);color:#fff;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;font-family:var(--mono)}
  .step h3{font-size:15px;margin-bottom:8px;font-weight:600}
  .step p{color:var(--text-dim);font-size:14px;margin-bottom:12px}
  .step-link{font-size:13px;color:var(--accent-hov);font-weight:500}

  /* ─── Tabs ─── */
  .tabs-container{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
  .tabs{display:flex;border-bottom:1px solid var(--border);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .tabs::-webkit-scrollbar{display:none}
  .tab{flex:0 0 auto;padding:14px 20px;background:transparent;border:none;color:var(--text-dim);font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;font-family:var(--sans);white-space:nowrap;border-bottom:2px solid transparent}
  .tab:hover{color:var(--text)}
  .tab.active{color:var(--text);border-bottom-color:var(--accent);background:var(--accent-soft)}
  .tab-pane{display:none;padding:20px 24px}
  .tab-pane.active{display:block}
  .tab-pane pre{background:var(--bg-code);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;overflow-x:auto;font-family:var(--mono);font-size:13px;line-height:1.5;color:#d4d4d8;position:relative}
  .copy-btn{
    position:absolute;top:8px;right:8px;
    background:var(--bg-elev);border:1px solid var(--border);color:var(--text-dim);
    padding:4px 10px;font-size:11px;border-radius:var(--radius-sm);cursor:pointer;
    font-family:var(--sans);transition:all .15s;
  }
  .copy-btn:hover{color:var(--text);border-color:var(--border-strong)}
  .copy-btn.copied{color:var(--green);border-color:var(--green)}

  /* ─── Tools ─── */
  .tools-search{margin-bottom:32px;position:relative;max-width:480px}
  .tools-search input{
    width:100%;padding:12px 16px 12px 42px;background:var(--bg-card);
    border:1px solid var(--border);border-radius:var(--radius);color:var(--text);
    font-size:14px;font-family:var(--sans);transition:border-color .15s;
  }
  .tools-search input:focus{outline:none;border-color:var(--accent)}
  .tools-search input::placeholder{color:var(--text-mute)}
  .tools-search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-mute);font-size:16px}
  .tool-group{margin-bottom:32px}
  .tool-group-head{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border)}
  .tool-group-icon{font-size:18px}
  .tool-group-name{font-size:15px;font-weight:600}
  .tool-group-desc{color:var(--text-mute);font-size:13px;margin-left:auto;font-weight:400}
  .tool-group-count{font-family:var(--mono);font-size:11px;padding:2px 8px;background:var(--bg-elev);border-radius:99px;color:var(--text-dim)}
  .tools-grid{display:grid;gap:10px;grid-template-columns:1fr}
  @media(min-width:720px){.tools-grid{grid-template-columns:1fr 1fr}}
  @media(min-width:1080px){.tools-grid{grid-template-columns:1fr 1fr 1fr}}
  .tool{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;transition:all .15s}
  .tool:hover{border-color:var(--border-strong);transform:translateY(-1px)}
  .tool-name{font-family:var(--mono);font-size:13px;font-weight:500;color:var(--accent-hov);margin-bottom:4px;word-break:break-all}
  .tool-desc{color:var(--text-dim);font-size:12px;line-height:1.45}
  .tool-tag{display:inline-block;font-size:10px;padding:1px 6px;border-radius:var(--radius-sm);margin-top:6px;font-weight:500;text-transform:uppercase;letter-spacing:.04em}
  .tool-tag-write{background:rgba(245,158,11,.1);color:var(--amber);border:1px solid rgba(245,158,11,.2)}
  .tool-tag-public{background:rgba(16,185,129,.1);color:var(--green);border:1px solid rgba(16,185,129,.2)}
  .tool-tag-binary{background:rgba(99,102,241,.1);color:var(--accent-hov);border:1px solid rgba(99,102,241,.2)}
  .no-results{text-align:center;padding:40px;color:var(--text-mute);font-size:14px;display:none}
  .hidden{display:none !important}

  /* ─── Auth ─── */
  .auth-grid{display:grid;gap:16px;grid-template-columns:1fr}
  @media(min-width:880px){.auth-grid{grid-template-columns:1fr 1fr}}
  .auth-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px}
  .auth-card h3{font-size:15px;margin-bottom:6px;display:flex;align-items:center;gap:8px}
  .auth-card p{color:var(--text-dim);font-size:13px;margin-bottom:12px}
  .auth-card code{display:inline-block;font-size:12px}

  /* ─── Try It ─── */
  .try-section pre{background:var(--bg-code);border:1px solid var(--border);border-radius:var(--radius);padding:16px;overflow-x:auto;font-family:var(--mono);font-size:13px;color:#d4d4d8;margin-bottom:12px;position:relative}
  .try-section .comment{color:var(--text-mute)}

  /* ─── Footer ─── */
  footer{padding:48px 24px;text-align:center}
  .footer-inner{max-width:1200px;margin:0 auto}
  .footer-links{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;font-size:14px}
  .footer-links a{color:var(--text-dim)}
  .footer-links a:hover{color:var(--text)}
  .footer-meta{color:var(--text-mute);font-size:13px}

  /* ─── Mobile tweaks ─── */
  @media(max-width:640px){
    .hero{padding:60px 20px 40px}
    section{padding:48px 20px}
    .nav-inner{padding:12px 16px}
    .step{padding:20px}
    .tab-pane{padding:16px}
    .tab-pane pre{font-size:12px}
    .tools-search input{font-size:13px}
  }
</style>
</head>
<body>

<!-- ─── Nav ─── -->
<nav class="nav">
  <div class="nav-inner">
    <a href="/" style="color:inherit">
      <div class="nav-logo">
        <span class="nav-logo-icon">🤖</span>
        <span>TeleBotHost MCP</span>
        <span class="nav-badge">v${SERVER_VERSION}</span>
      </div>
    </a>
    <div class="nav-links">
      <a href="#quickstart">Quick Start</a>
      <a href="#tools">Tools</a>
      <a href="#auth">Auth</a>
      <a href="${GITHUB_URL}" target="_blank" rel="noopener">GitHub ↗</a>
    </div>
  </div>
</nav>

<!-- ─── Hero ─── -->
<header class="hero">
  <div class="hero-inner">
    <h1>TeleBotHost MCP Server</h1>
    <p>A production-ready Model Context Protocol server for the TeleBotHost Developer API. Control your Telegram bots from any AI assistant.</p>
    <div class="hero-badges">
      <span class="badge badge-green">✓ 100% API Coverage</span>
      <span class="badge badge-amber">⚡ ${allTools.length} Tools</span>
      <span class="badge badge-accent">🔌 MCP ${PROTOCOL_VERSION}</span>
      <span class="badge">📦 TypeScript</span>
      <span class="badge">🚀 Multi-Platform</span>
    </div>
    <div class="hero-cta">
      <a href="#quickstart" class="btn btn-primary">Quick Start →</a>
      <a href="${GITHUB_URL}" target="_blank" rel="noopener" class="btn btn-secondary">View Source</a>
    </div>
  </div>
</header>

<!-- ─── Quick Start ─── -->
<section id="quickstart">
  <div class="section-inner">
    <div class="section-head">
      <span class="section-num">01</span>
      <h2>Quick Start</h2>
      <p>Get up and running in under 2 minutes.</p>
    </div>
    <div class="steps">
      <div class="step">
        <span class="step-num">1</span>
        <h3>Get your TBH API key</h3>
        <p>Log in to TeleBotHost, go to Developer Settings → API Keys. Generate an <code>sk_*</code> key (full access) or <code>pub_*</code> (read-only).</p>
        <a href="https://telebothost.com" target="_blank" rel="noopener" class="step-link">telebothost.com →</a>
      </div>
      <div class="step">
        <span class="step-num">2</span>
        <h3>Copy client config</h3>
        <p>Choose your AI client below, copy the config, and paste your API key where indicated. The MCP endpoint URL is pre-filled for you.</p>
      </div>
      <div class="step">
        <span class="step-num">3</span>
        <h3>Restart &amp; use</h3>
        <p>Restart your AI client. Ask it to "list my TeleBotHost bots" or "create a new command" — it will use this MCP automatically.</p>
      </div>
    </div>

    <div style="margin-top:32px">
      <div class="tabs-container">
        <div class="tabs" role="tablist">
          <button class="tab active" data-tab="claude">Claude Desktop</button>
          <button class="tab" data-tab="cursor">Cursor</button>
          <button class="tab" data-tab="vscode">VS Code</button>
          <button class="tab" data-tab="curl">curl (test)</button>
        </div>

        <div class="tab-pane active" data-pane="claude">
          <pre><button class="copy-btn" data-copy="claude">Copy</button>{
  "mcpServers": {
    "telebothost": {
      "url": "${mcpUrl}",
      "transport": "http",
      "headers": {
        "X-Tbh-Api-Key": "sk_YOUR_KEY_HERE"
      }
    }
  }
}</pre>
          <p style="font-size:13px;color:var(--text-dim);margin-top:8px">Edit <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS) or <code>%APPDATA%\\Claude\\claude_desktop_config.json</code> (Windows).</p>
        </div>

        <div class="tab-pane" data-pane="cursor">
          <pre><button class="copy-btn" data-copy="cursor">Copy</button>{
  "mcpServers": {
    "telebothost": {
      "url": "${mcpUrl}",
      "headers": {
        "X-Tbh-Api-Key": "sk_YOUR_KEY_HERE"
      }
    }
  }
}</pre>
          <p style="font-size:13px;color:var(--text-dim);margin-top:8px">Settings → MCP → Add Server. Paste this config.</p>
        </div>

        <div class="tab-pane" data-pane="vscode">
          <pre><button class="copy-btn" data-copy="vscode">Copy</button>{
  "mcp.servers": {
    "telebothost": {
      "url": "${mcpUrl}",
      "headers": {
        "X-Tbh-Api-Key": "sk_YOUR_KEY_HERE"
      }
    }
  }
}</pre>
          <p style="font-size:13px;color:var(--text-dim);margin-top:8px">Add to your VS Code MCP settings (with Cline or Continue extension).</p>
        </div>

        <div class="tab-pane" data-pane="curl">
          <pre><button class="copy-btn" data-copy="curl">Copy</button><span class="comment"># 1. List all available tools</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

<span class="comment"># 2. Call a tool with your API key</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Tbh-Api-Key: sk_YOUR_KEY_HERE" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_bots","arguments":{}}}'</pre>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ─── Tools ─── -->
<section id="tools">
  <div class="section-inner">
    <div class="section-head">
      <span class="section-num">02</span>
      <h2>Available Tools (${allTools.length})</h2>
      <p>Full coverage of the TeleBotHost Developer API — 47 endpoints mapped to ${allTools.length} tools.</p>
    </div>

    <div class="tools-search">
      <span class="tools-search-icon">🔍</span>
      <input type="text" id="toolSearch" placeholder="Search tools by name or description..." autocomplete="off">
    </div>

    <div id="toolsList">
      ${grouped.map((g) => `
      <div class="tool-group" data-group="${g.name}">
        <div class="tool-group-head">
          <span class="tool-group-icon">${g.icon}</span>
          <span class="tool-group-name">${g.name}</span>
          <span class="tool-group-desc">${g.description}</span>
          <span class="tool-group-count">${g.tools.length}</span>
        </div>
        <div class="tools-grid">
          ${g.tools.map((t) => `
          <div class="tool" data-name="${t.name.toLowerCase()}" data-desc="${escapeHtml(t.description.toLowerCase())}">
            <div class="tool-name">${t.name}</div>
            <div class="tool-desc">${escapeHtml(t.description.split(".")[0])}.</div>
            ${t.tags.map((tag) => `<span class="tool-tag ${tag.class}">${tag.label}</span>`).join("")}
          </div>`).join("")}
        </div>
      </div>`).join("")}
    </div>

    <div class="no-results" id="noResults">
      No tools found matching your search.
    </div>
  </div>
</section>

<!-- ─── Auth ─── -->
<section id="auth">
  <div class="section-inner">
    <div class="section-head">
      <span class="section-num">03</span>
      <h2>Authentication</h2>
      <p>Two independent layers — don't confuse them.</p>
    </div>
    <div class="auth-grid">
      <div class="auth-card">
        <h3>🔐 <code>X-Tbh-Api-Key</code> <span style="color:var(--text-mute);font-weight:400;font-size:12px">(required)</span></h3>
        <p>Your TeleBotHost API key. Passed per-request via the <code>X-Tbh-Api-Key</code> header. The server forwards it to TBH API without storing it.</p>
        <p style="font-size:12px;color:var(--text-mute)">Get it from: <a href="https://telebothost.com" target="_blank" rel="noopener">telebothost.com → Developer Settings → API Keys</a></p>
        <div style="margin-top:12px">
          <span class="badge badge-amber" style="font-size:11px">sk_* = full access</span>
          <span class="badge badge-green" style="font-size:11px">pub_* = read-only</span>
        </div>
      </div>
      <div class="auth-card">
        <h3>🛡️ <code>MCP_AUTH_TOKEN</code> <span style="color:var(--text-mute);font-weight:400;font-size:12px">(optional)</span></h3>
        <p>If the server has this env var set, clients must also send <code>Authorization: Bearer &lt;token&gt;</code> to access the MCP endpoint itself. Use it to restrict WHO can call your MCP.</p>
        <p style="font-size:12px;color:var(--text-mute)">Set by the server operator. If you're just using this deployment, you don't need to worry about it.</p>
      </div>
    </div>
  </div>
</section>

<!-- ─── Try It ─── -->
<section id="try">
  <div class="section-inner">
    <div class="section-head">
      <span class="section-num">04</span>
      <h2>Try It Live</h2>
      <p>Test the MCP endpoint directly from your terminal.</p>
    </div>
    <div class="try-section">
      <pre><button class="copy-btn" data-copy="try1">Copy</button><span class="comment"># Check server health (no auth needed)</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"${PROTOCOL_VERSION}","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'</pre>

      <pre><button class="copy-btn" data-copy="try2">Copy</button><span class="comment"># List all 68 tools</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'</pre>

      <pre><button class="copy-btn" data-copy="try3">Copy</button><span class="comment"># Browse community store (public, no key needed)</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list_public_store_bots","arguments":{"limit":"5"}}}'</pre>

      <pre><button class="copy-btn" data-copy="try4">Copy</button><span class="comment"># List your bots (requires your TBH API key)</span>
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Tbh-Api-Key: sk_YOUR_KEY_HERE" \\
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_bots","arguments":{}}}'</pre>
    </div>
  </div>
</section>

<!-- ─── Footer ─── -->
<footer>
  <div class="footer-inner">
    <div class="footer-links">
      <a href="${GITHUB_URL}" target="_blank" rel="noopener">GitHub</a>
      <a href="${TBH_DOCS_URL}" target="_blank" rel="noopener">TBH API Docs</a>
      <a href="${MCP_SPEC_URL}" target="_blank" rel="noopener">MCP Spec</a>
      <a href="https://telebothost.com" target="_blank" rel="noopener">TeleBotHost</a>
      <a href="/api/health">Health</a>
    </div>
    <div class="footer-meta">
      ${SERVER_NAME} v${SERVER_VERSION} · ${allTools.length} tools · 100% API coverage<br>
      Built with ❤️ for the TeleBotHost community · MIT License
    </div>
  </div>
</footer>

<script>
  // ─── Tab switching ───
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector('[data-pane="' + target + '"]').classList.add('active');
    });
  });

  // ─── Copy buttons ───
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const pre = btn.closest('pre');
      const code = pre ? pre.innerText.replace(/^Copy\\n/, '').trim() : '';
      try {
        await navigator.clipboard.writeText(code);
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1800);
      } catch (err) {
        btn.textContent = 'Failed';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
      }
    });
  });

  // ─── Tool search ───
  const search = document.getElementById('toolSearch');
  const noResults = document.getElementById('noResults');
  const groups = document.querySelectorAll('.tool-group');
  const tools = document.querySelectorAll('.tool');

  search.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    let totalVisible = 0;

    groups.forEach(group => {
      let groupVisible = 0;
      group.querySelectorAll('.tool').forEach(tool => {
        const name = tool.dataset.name || '';
        const desc = tool.dataset.desc || '';
        const match = !q || name.includes(q) || desc.includes(q);
        tool.classList.toggle('hidden', !match);
        if (match) groupVisible++;
      });
      group.classList.toggle('hidden', groupVisible === 0);
      totalVisible += groupVisible;
    });

    noResults.style.display = totalVisible === 0 ? 'block' : 'none';
  });
</script>

</body>
</html>`;
}

/** Generate a minimal JSON health response. */
export function generateHealthJson(origin: string): string {
  return JSON.stringify(
    {
      status: "ok",
      server: SERVER_NAME,
      version: SERVER_VERSION,
      protocol: PROTOCOL_VERSION,
      tools: allTools.length,
      endpoints: {
        mcp: `${origin}/api/mcp`,
        docs: `${origin}/`,
        health: `${origin}/api/health`,
      },
      coverage: "100%",
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ToolWithTags {
  name: string;
  description: string;
  tags: Array<{ label: string; class: string }>;
}

interface ToolGroup {
  name: string;
  icon: string;
  description: string;
  tools: ToolWithTags[];
}

/** Group tools into display sections based on name patterns. */
function groupToolsBySection(): ToolGroup[] {
  const groups: Record<string, ToolWithTags[]> = {};
  for (const g of GROUPS) groups[g.name] = [];

  for (const tool of allTools) {
    const name = tool.name;
    let groupName: string;
    const tags: Array<{ label: string; class: string }> = [];

    // Classify by name
    if (name === "get_status") {
      groupName = "Health";
    } else if (name.startsWith("get_public_") || name.startsWith("list_public_") || name.startsWith("list_templates") || name.startsWith("get_template") || name === "get_public_ads") {
      groupName = "Public Discovery";
      tags.push({ label: "public", class: "tool-tag-public" });
    } else if (name.startsWith("get_bot_storage") || name === "clear_bot_storage" || name === "migrate_bot_storage") {
      groupName = "Bot Storage";
    } else if (name.includes("broadcast")) {
      groupName = "Broadcasts";
      if (name === "start_broadcast") tags.push({ label: "write", class: "tool-tag-write" });
    } else if (name.includes("command") || name.includes("_folder")) {
      groupName = "Commands";
      if (["create_command", "delete_commands", "delete_command", "permanently_delete_command",
           "recover_deleted_command", "create_command_folder", "update_command_folder",
           "delete_command_folder"].includes(name)) {
        tags.push({ label: "write", class: "tool-tag-write" });
      }
    } else if (name.includes("_env_")) {
      groupName = "Env Vars";
      if (["create_env_var", "update_env_var", "delete_env_var"].includes(name)) {
        tags.push({ label: "write", class: "tool-tag-write" });
      }
    } else if (name === "get_bot_logs" || name === "clear_bot_logs" || name === "get_bot_analytics") {
      groupName = "Logs & Analytics";
      if (name === "clear_bot_logs") tags.push({ label: "write", class: "tool-tag-write" });
    } else if (name === "list_store_bots" || name === "install_store_bot") {
      groupName = "Community Store";
      if (name === "install_store_bot") tags.push({ label: "write", class: "tool-tag-write" });
    } else if (name === "get_quota") {
      groupName = "Quota";
    } else if (name.startsWith("search_")) {
      groupName = "Docs Search";
      tags.push({ label: "public", class: "tool-tag-public" });
    } else {
      groupName = "Bot Lifecycle";
      if (["download_bot", "import_bot"].includes(name)) {
        tags.push({ label: "binary", class: "tool-tag-binary" });
      } else if (["register_bot", "delete_bots", "purge_deleted_bot", "update_bot", "pin_bots", "clone_bot", "clone_bot_as_child", "transfer_bot", "reset_bot", "toggle_bot_template", "update_bot_readme", "export_bot"].includes(name)) {
        tags.push({ label: "write", class: "tool-tag-write" });
      }
    }

    if (groups[groupName]) {
      groups[groupName].push({ name: tool.name, description: tool.description, tags });
    }
  }

  return GROUPS.map((g) => ({
    name: g.name,
    icon: g.icon,
    description: g.description,
    tools: groups[g.name] || [],
  })).filter((g) => g.tools.length > 0);
}
