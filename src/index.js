import { renderSVG } from 'uqr';

const CORS = { 'Access-Control-Allow-Origin': '*' };
const HEX_RE = /^[0-9a-fA-F]{3,8}$/;
const formatColor = (c) => (HEX_RE.test(c) ? `#${c}` : c);

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          ...CORS,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    let text = url.searchParams.get('text') || url.searchParams.get('url') || url.searchParams.get('data');
    let color = url.searchParams.get('color') || url.searchParams.get('fg') || '#000000';
    let bg = url.searchParams.get('bg') || '#ffffff';
    let ecc = (url.searchParams.get('ecc') || 'M').toUpperCase();
    let border = parseInt(url.searchParams.get('margin') || url.searchParams.get('border') || '2', 10);
    let pixelSize = parseInt(url.searchParams.get('size') || url.searchParams.get('pixelSize') || '10', 10);

    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const body = await request.json();
          text = body.text || body.url || body.data || text;
          if (body.color || body.fg) color = body.color || body.fg;
          if (body.bg) bg = body.bg;
          if (body.ecc) ecc = body.ecc.toUpperCase();
          if (body.margin !== undefined || body.border !== undefined) border = Number(body.margin ?? body.border);
          if (body.size !== undefined || body.pixelSize !== undefined) pixelSize = Number(body.size ?? body.pixelSize);
        } catch {
          return jsonError('Invalid JSON', 400);
        }
      } else {
        const bodyText = await request.text();
        if (bodyText) text = bodyText;
      }
    }

    if (!text) {
      if (request.method === 'POST') return jsonError('Missing text parameter', 400);
      return handleUI(url.origin);
    }

    color = formatColor(color);
    bg = formatColor(bg);

    try {
      if (!['L', 'M', 'Q', 'H'].includes(ecc)) ecc = 'M';

      const svg = renderSVG(text, {
        ecc,
        border: isNaN(border) ? 2 : Math.max(0, border),
        pixelSize: isNaN(pixelSize) ? 10 : Math.max(1, pixelSize),
        blackColor: color,
        whiteColor: bg,
      });

      const headers = {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        ...CORS,
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      };

      const download = url.searchParams.get('download');
      if (download !== null) {
        const clean = download ? download.replace(/[^a-zA-Z0-9_-]/g, '') : '';
        headers['Content-Disposition'] = `attachment; filename="${clean || 'anvu-qr'}.svg"`;
      }

      return new Response(svg, { headers });
    } catch (err) {
      return jsonError(err.message || 'Error generating QR', 400);
    }
  },
};

function jsonError(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function handleUI(origin) {
  const defaultText = 'https://github.com/anvu17';
  const initialSvg = renderSVG(defaultText, {
    ecc: 'M',
    border: 2,
    pixelSize: 10,
    blackColor: '#000000',
    whiteColor: '#ffffff',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>An Vu QR</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Crect%20width='100'%20height='100'%20rx='20'%20fill='%232563eb'/%3E%3Ctext%20x='50'%20y='65'%20font-size='46'%20font-family='sans-serif'%20font-weight='600'%20fill='white'%20text-anchor='middle'%3EQR%3C/text%3E%3C/svg%3E">
  <style>
    :root{color-scheme:light dark;--bg:#fff;--text:#171717;--dim:#737373;--border:#d4d4d8;--card:#f4f4f5;--btn-bg:#f4f4f5;--btn-hover:#e4e4e7;--accent:#2563eb;--accent-text:#fff;--focus:#2563eb}
    @media(prefers-color-scheme:dark){:root{--bg:#121214;--text:#e4e4e7;--dim:#a1a1aa;--border:#27272a;--card:#18181b;--btn-bg:#27272a;--btn-hover:#3f3f46;--accent:#3b82f6;--accent-text:#fff;--focus:#60a5fa}}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.5;padding:16px}
    .app{max-width:620px;margin:0 auto}
    header{margin-bottom:12px}
    h1{font-size:18px;font-weight:600}
    .card{background:var(--card);border:1px solid var(--border);border-radius:4px;padding:12px;margin-bottom:12px}
    .text-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
    .text-lbl{font-size:12px;font-weight:500;color:var(--dim)}
    .text-actions{display:flex;gap:6px}
    .btn-sm{font-size:12px;padding:2px 8px;height:24px}
    textarea{width:100%;height:68px;padding:8px 10px;font-family:inherit;font-size:13px;line-height:1.5;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text);resize:vertical}
    textarea:focus,input:focus,select:focus{outline:none;border-color:var(--focus)}
    .options{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
    @media(max-width:520px){.options{grid-template-columns:1fr 1fr}}
    .field label{display:block;font-size:11px;margin-bottom:4px;color:var(--dim)}
    .field input,.field select{width:100%;height:28px;padding:2px 6px;font-family:inherit;font-size:12px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text)}
    .color-row{display:flex;gap:4px;align-items:center}
    .color-row input[type="color"]{width:28px;height:28px;padding:1px;border:1px solid var(--border);border-radius:4px;cursor:pointer}
    .color-row input[type="text"]{flex:1}
    .preview{display:flex;gap:14px;align-items:center;background:var(--card);border:1px solid var(--border);border-radius:4px;padding:12px}
    @media(max-width:520px){.preview{flex-direction:column;align-items:center}}
    .qr-card{background:#fff;padding:8px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
    .qr-card svg{width:140px;height:140px;display:block}
    .actions{flex:1;width:100%;display:flex;flex-direction:column;gap:10px}
    .btn-ctrl{display:flex;gap:6px;align-items:center}
    .btn-ctrl button{flex:1;height:30px}
    button{display:inline-flex;align-items:center;justify-content:center;padding:5px 10px;font-family:inherit;font-size:13px;border:1px solid var(--border);border-radius:4px;background:var(--btn-bg);color:var(--text);cursor:pointer;user-select:none;transition:background .15s}
    button:hover:not(:disabled){background:var(--btn-hover)}
    .btn-accent{background:var(--accent);color:var(--accent-text);border-color:var(--accent);font-weight:500}
    .btn-accent:hover:not(:disabled){opacity:.9;background:var(--accent)}
    .api-row{display:flex;gap:6px}
    .api-row input{flex:1;height:28px;padding:2px 8px;font-size:11px;font-family:monospace;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text)}
    .api-row button{height:28px;font-size:11px;padding:0 8px}
    .status-text{font-size:12px;color:var(--dim);min-height:18px}
  </style>
</head>
<body>
  <main class="app">
    <header>
      <h1>An Vu QR</h1>
    </header>
    <div class="card">
      <div class="text-bar">
        <label for="text" class="text-lbl">Content</label>
        <div class="text-actions">
          <button type="button" id="btn-paste" class="btn-sm">Paste</button>
          <button type="button" id="btn-clear" class="btn-sm">Clear</button>
        </div>
      </div>
      <textarea id="text" spellcheck="false" placeholder="https://github.com/anvu17"></textarea>
      <div class="options">
        <div class="field">
          <label for="color">Color</label>
          <div class="color-row">
            <input type="color" id="color-picker" value="#000000">
            <input type="text" id="color" value="#000000" spellcheck="false">
          </div>
        </div>
        <div class="field">
          <label for="bg">Background</label>
          <div class="color-row">
            <input type="color" id="bg-picker" value="#ffffff">
            <input type="text" id="bg" value="#ffffff" spellcheck="false">
          </div>
        </div>
        <div class="field">
          <label for="ecc">Error correction</label>
          <select id="ecc">
            <option value="L">L</option>
            <option value="M" selected>M</option>
            <option value="Q">Q</option>
            <option value="H">H</option>
          </select>
        </div>
        <div class="field">
          <label for="margin">Margin</label>
          <input type="number" id="margin" value="2" min="0" max="10">
        </div>
      </div>
    </div>
    <div class="preview">
      <div class="qr-card" id="qr-box">${initialSvg}</div>
      <div class="actions">
        <div class="btn-ctrl">
          <button type="button" id="btn-copy-url" class="btn-accent">Copy link</button>
          <button type="button" id="btn-svg">SVG</button>
          <button type="button" id="btn-png">PNG</button>
        </div>
        <div class="api-row">
          <input type="text" id="api-url" readonly value="${origin}/?text=${encodeURIComponent(defaultText)}" />
          <button type="button" id="btn-copy-input">Copy</button>
        </div>
        <div id="status" class="status-text"></div>
      </div>
    </div>
  </main>
  <script>
    const o=window.location.origin,DEF='${defaultText}';let t=null;
    const $=id=>document.getElementById(id);
    function url(){
      const text=$('text').value.trim()||DEF,
        color=$('color').value.trim().replace('#',''),
        bg=$('bg').value.trim().replace('#',''),
        ecc=$('ecc').value,margin=$('margin').value,
        p=new URLSearchParams;
      p.set('text',text);
      if(color&&color.toLowerCase()!=='000000')p.set('color',color);
      if(bg&&bg.toLowerCase()!=='ffffff')p.set('bg',bg);
      if(ecc&&ecc!=='M')p.set('ecc',ecc);
      if(margin&&margin!=='2')p.set('margin',margin);
      return o+'/?'+p
    }
    async function load(){
      const u=url();$('api-url').value=u;
      try{const r=await fetch(u);if(r.ok)$('qr-box').innerHTML=await r.text()}
      catch(e){status('Error')}
    }
    function sched(){clearTimeout(t);t=setTimeout(load,80)}
    function status(m){const e=$('status');e.textContent=m;if(m)setTimeout(()=>{e.textContent=''},1800)}
    function sync(a,b){$(a).addEventListener('input',e=>{$(b).value=e.target.value;sched()});
      $(b).addEventListener('input',e=>{if(/^#[0-9a-fA-F]{6}$/.test(e.target.value))$(a).value=e.target.value;sched()})}
    sync('color-picker','color');sync('bg-picker','bg');
    ['text','ecc','margin'].forEach(id=>$(id).addEventListener('input',sched));
    $('btn-clear').addEventListener('click',()=>{$('text').value='';sched()});
    $('btn-paste').addEventListener('click',async()=>{try{const t=await navigator.clipboard.readText();if(t){$('text').value=t;sched()}}catch{}});
    function copy(){navigator.clipboard.writeText($('api-url').value);status('Copied')}
    $('btn-copy-url').addEventListener('click',copy);
    $('btn-copy-input').addEventListener('click',copy);
    $('btn-svg').addEventListener('click',()=>{const s=document.querySelector('#qr-box svg');if(!s)return;const b=new Blob([s.outerHTML],{type:'image/svg+xml;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='anvu-qr.svg';a.click();URL.revokeObjectURL(a.href)});
    $('btn-png').addEventListener('click',()=>{const s=document.querySelector('#qr-box svg');if(!s)return;const c=document.createElement('canvas'),x=c.getContext('2d'),b=new Blob([s.outerHTML],{type:'image/svg+xml;charset=utf-8'}),u=URL.createObjectURL(b),i=new Image;i.onload=()=>{c.width=c.height=800;x.drawImage(i,0,0,800,800);URL.revokeObjectURL(u);const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='anvu-qr.png';a.click()};i.src=u});
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
