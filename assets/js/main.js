/* Main JS for Gabriele's one-page site */
(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const state = {
    theme: 'tokyo',
    projectsLoaded: false,
    projects: [],
    username: 'GabrielProjects'
  };

  // Year
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Live clock
  const clockEl = $('#live-clock');
  if (clockEl){
    function updateClock(){
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${h}:${m}:${s}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Theme management
  const themeKey = 'gabriele_theme';
  const body = document.body;
  const themeBtn = $('#theme-toggle');
  function applyTheme(name, skipAnimation = false){
    body.classList.remove('theme-light','theme-matrix','theme-dark');
    switch(name){
      case 'light': 
        if (!skipAnimation) {
          triggerFlashbang(() => {
            body.classList.add('theme-light');
            state.theme = name;
            try{ localStorage.setItem(themeKey, name); }catch{}
          });
          return;
        }
        body.classList.add('theme-light'); break;
      case 'matrix': body.classList.add('theme-matrix'); break;
      case 'dark': body.classList.add('theme-dark'); break;
    }
    state.theme = name;
    try{ localStorage.setItem(themeKey, name); }catch{}
  }
  const savedTheme = (()=>{try{return localStorage.getItem(themeKey)}catch{return null}})();
  applyTheme(savedTheme || 'tokyo');
  if (themeBtn){
    themeBtn.addEventListener('click', () => {
      const order = ['tokyo','dark','light','matrix'];
      const idx = order.indexOf(state.theme);
      const next = order[(idx+1) % order.length];
      applyTheme(next);
      toast(`Theme switched to ${next}`);
    });
  }

  // Toast helper
  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    t.className = 'chip';
    Object.assign(t.style, {position:'fixed', bottom:'16px', right:'16px', zIndex:1000});
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; }, 1600);
    setTimeout(()=> t.remove(), 2000);
  }

  // Typewriter effect
  (function typewriter(){
    const el = $('#typed');
    if (!el) return;
    const messages = [
      "Student from Palermo, Italy 🇮🇹",
      "JavaScript • Python • PHP • MySQL",
      "Open to collaborate and learn"
    ];
    let msgIdx = 0, charIdx = 0, deleting = false;
    function tick(){
      const msg = messages[msgIdx];
      if (!deleting){
        charIdx++;
        el.textContent = msg.slice(0, charIdx);
        if (charIdx === msg.length){ deleting = true; setTimeout(tick, 1200); return; }
      } else {
        charIdx--;
        el.textContent = msg.slice(0, charIdx);
        if (charIdx === 0){ deleting = false; msgIdx = (msgIdx+1)%messages.length; }
      }
      setTimeout(tick, deleting ? 25 : 38);
    }
    tick();
  })();

  // Background particles
  (function particles(){
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let w=0,h=0, points=[];
    function resize(){
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = Math.max(window.innerHeight, document.body.scrollHeight);
      canvas.width = Math.floor(w*DPR);
      canvas.height = Math.floor(h*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
      if (points.length === 0){
        const count = Math.min(120, Math.floor((w*h)/50000));
        points = Array.from({length: count}, ()=>({
          x: Math.random()*w, y: Math.random()*h,
          vx: (Math.random()-0.5)*0.2, vy: (Math.random()-0.5)*0.2,
          r: Math.random()*1.6 + 0.3
        }));
      }
    }
    resize();
    window.addEventListener('resize', resize);
    function step(){
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid');
      for (const p of points){
        p.x += p.vx; p.y += p.vy;
        if (p.x<0||p.x>w) p.vx*=-1;
        if (p.y<0||p.y>h) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(step);
    }
    step();
  })();

  // Reveal on scroll
  (function reveal(){
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.06 });
    $$('.section').forEach(sec => { sec.setAttribute('data-reveal',''); observer.observe(sec); });
  })();

  // Projects (GitHub API)
  async function loadProjects(){
    if (state.projectsLoaded) return state.projects;
    const url = `https://api.github.com/users/${state.username}/repos?sort=updated&per_page=12`;
    try{
      const res = await fetch(url, { headers: { 'Accept':'application/vnd.github+json' }});
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const data = await res.json();
      // Filter forks and archived, pick top by stargazers then updated
      const repos = data
        .filter(r => !r.fork && !r.archived)
        .sort((a,b)=> (b.stargazers_count - a.stargazers_count) || (new Date(b.updated_at) - new Date(a.updated_at)))
        .slice(0, 6);
      state.projects = repos;
      state.projectsLoaded = true;
      renderProjects(repos);
      return repos;
    }catch(err){
      console.warn('Projects fetch failed:', err);
      const grid = $('#projects-grid');
      if (grid) grid.innerHTML = `<div class="muted">Could not load projects right now.</div>`;
      return [];
    }
  }
  function renderProjects(repos){
    const grid = $('#projects-grid');
    if (!grid) return;
    grid.innerHTML = repos.map(r => `
      <article class="project">
        <h3>${escapeHTML(r.name)}</h3>
        <p class="muted">${escapeHTML(r.description || 'No description')}</p>
        <div class="meta">
          <span>★ ${r.stargazers_count}</span>
          ${r.language ? `<span>${escapeHTML(r.language)}</span>` : ''}
          <span>Updated ${new Date(r.updated_at).toLocaleDateString()}</span>
        </div>
        <a href="${r.html_url}" target="_blank" rel="noreferrer noopener">View on GitHub →</a>
      </article>
    `).join('');
  }
  function escapeHTML(s){ const div = document.createElement('div'); div.textContent = s == null ? '' : String(s); return div.innerHTML; }
  // Preload projects soon after idle
  if ('requestIdleCallback' in window){ requestIdleCallback(loadProjects); } else { setTimeout(loadProjects, 800); }

  // Terminal implementation
  (function terminal(){
    const out = $('#term-output');
    const input = $('#term-input');
    const terminalEl = $('#terminal');
    if (!out || !input) return;

    const history = [];
    let historyIdx = -1;
    const commands = {
      help(){
        printLine(`<span class="ok">Available commands</span>\n` +
          `help, about, skills, projects, socials, stats, contact,\n`+
          `theme &lt;tokyo|light|matrix|dark&gt;, open &lt;section|url&gt;, clear`);
      },
      about(){
        openSection('#about');
        printLine("I'm Gabriele — student and aspiring developer from Palermo, Italy.\nI enjoy building small tools and clean interfaces.");
      },
      skills(){
        openSection('#skills');
        printLine('Skills: HTML, CSS, JavaScript, Python, PHP, MySQL');
      },
      async projects(){
        openSection('#projects');
        const repos = await loadProjects();
        if (!repos.length){ printLine('No projects to show right now.'); return; }
        printLine('<span class="ok">Top projects:</span>');
        repos.forEach(r => printLine(`• <a href="${r.html_url}" target="_blank">${escapeHTML(r.name)}</a> — ${escapeHTML(r.description || 'No description')}`));
      },
      socials(){
        openSection('#contact');
        printLine([
          link('LinkedIn','https://www.linkedin.com/in/gabriele-d-asta-587226244/'),
          link('Instagram','https://www.instagram.com/gabriele_dasta'),
          'Telegram: <span class="muted">@</span> (DM me)',
          'Discord: <span class="muted">gabriele654321</span>',
          link('Buy me a coffee','https://www.buymeacoffee.com/gdasta06c')
        ].join('\n'));
      },
      stats(){
        openSection('#stats');
        printLine('Opening stats section…');
      },
      contact(){
        openSection('#contact');
        printLine('Best way to reach me: LinkedIn or Instagram DMs.');
      },
      theme(arg){
        let t = (arg||'').toLowerCase();
        // common typos/aliases
        if (t === 'tokuo' || t === 'tokio') t = 'tokyo';
        const valid = ['tokyo','light','matrix','dark'];
        if (!valid.includes(t)){ printLine(`<span class="warn">Usage:</span> theme &lt;${valid.join('|')}&gt;`); return; }
        applyTheme(t);
        printLine(`Theme set to ${t}.`);
      },
      open(arg){
        if (!arg){ printLine('<span class="warn">Usage:</span> open &lt;about|skills|projects|stats|contact|url&gt;'); return; }
        if (arg.startsWith('#')){ openSection(arg); return; }
        const known = ['about','skills','projects','stats','contact'];
        if (known.includes(arg)){ openSection('#'+arg); return; }
        try{
          const u = new URL(arg, location.href);
          window.open(u.href, '_blank','noopener,noreferrer');
          printLine(`Opened ${u.href}`);
        }catch{ printLine('<span class="err">Invalid target</span>'); }
      },
      clear(){ out.innerHTML=''; }
    };

    function link(text, href){ return `<a href="${href}" target="_blank" rel="noreferrer noopener">${text}</a>`; }
    function printLine(html){
      const div = document.createElement('div');
      div.className = 'term-line';
      div.innerHTML = html;
      out.appendChild(div);
      out.scrollTop = out.scrollHeight;
    }
    function openSection(sel){
      const el = $(sel);
      if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
    }
    function execute(cmd){
      if (!cmd.trim()) return;
      printLine(`<span class="prompt">gabriel@portfolio:~$</span> ${escapeHTML(cmd)}`);
      const [name, ...rest] = cmd.split(/\s+/);
      const arg = rest.join(' ').trim();
      const fn = commands[name];
      if (typeof fn === 'function'){
        Promise.resolve(fn(arg)).catch(err=> printLine(`<span class="err">${escapeHTML(err.message || 'Error')}</span>`));
      } else {
        printLine(`<span class="err">Command not found:</span> ${escapeHTML(name)}. Type <span class="mono">help</span>.`);
      }
    }

    input.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter'){
        e.preventDefault();
        const value = input.value;
        history.unshift(value); historyIdx = -1;
        input.value = '';
        execute(value);
      } else if (e.key === 'ArrowUp'){
        e.preventDefault();
        if (history.length){ historyIdx = Math.min(historyIdx+1, history.length-1); input.value = history[historyIdx] || ''; }
      } else if (e.key === 'ArrowDown'){
        e.preventDefault();
        if (history.length){ historyIdx = Math.max(historyIdx-1, -1); input.value = historyIdx===-1 ? '' : (history[historyIdx]||''); }
      } else if (e.key === 'c' && e.ctrlKey){ // Ctrl+C
        e.preventDefault(); printLine('^C'); input.value='';
      }
    });
    terminalEl.addEventListener('click', ()=> input.focus());

    // Greet and suggest help
    setTimeout(()=>{
      printLine('<span class="ok">Welcome!</span> Type <span class="mono">help</span> to see available commands.');
    }, 300);
  })();

  // Flashbang animation for light theme
  function triggerFlashbang(callback) {
    // Remove any existing flashbang elements first
    const existingContainer = document.getElementById('flashbang-container');
    const existingOverlay = document.getElementById('flash-overlay');
    if (existingContainer) existingContainer.remove();
    if (existingOverlay) existingOverlay.remove();
    
    // Create flashbang elements
    const container = document.createElement('div');
    container.id = 'flashbang-container';
    container.style.display = 'block';
    
    const flashbang = document.createElement('div');
    flashbang.className = 'flashbang';
    
    const overlay = document.createElement('div');
    overlay.id = 'flash-overlay';
    
    container.appendChild(flashbang);
    document.body.appendChild(container);
    document.body.appendChild(overlay);
    
    // Start throw animation
    setTimeout(() => {
      flashbang.classList.add('flashbang-throw');
    }, 50);
    
    // Trigger flash after throw
    setTimeout(() => {
      overlay.classList.add('flashbang-explode');
      // Apply theme during peak flash
      setTimeout(callback, 400);
    }, 800);
    
    // Clean up - force remove with better cleanup
    setTimeout(() => {
      if (container && container.parentNode) container.remove();
      if (overlay && overlay.parentNode) overlay.remove();
      
      // Extra safety cleanup
      const cleanupContainer = document.getElementById('flashbang-container');
      const cleanupOverlay = document.getElementById('flash-overlay');
      if (cleanupContainer) cleanupContainer.remove();
      if (cleanupOverlay) cleanupOverlay.remove();
    }, 3000);
  }

  // Emergency cleanup function for stuck flashbang
  function forceCleanupFlashbang() {
    const containers = document.querySelectorAll('#flashbang-container');
    const overlays = document.querySelectorAll('#flash-overlay');
    containers.forEach(el => el.remove());
    overlays.forEach(el => el.remove());
  }
  
  // Run cleanup on page load in case of stuck elements
  forceCleanupFlashbang();
  
  // Also expose cleanup function globally for emergency use
  window.cleanupFlashbang = forceCleanupFlashbang;
})();
