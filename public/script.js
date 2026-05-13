const wallpaper  = document.getElementById("wallpaper");
const liveCanvas = document.getElementById("liveWallpaper");
const dock       = document.getElementById("dock");
const weatherEl  = document.getElementById("weather");

function updateTime() {
  const now = new Date();
  document.getElementById("time").textContent =
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("date").textContent =
    now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
setInterval(updateTime, 1000);
updateTime();

const samplerCanvas = document.createElement("canvas");
const samplerCtx   = samplerCanvas.getContext("2d");

function sampleAndTheme() {
  try {
    samplerCanvas.width  = wallpaper.naturalWidth;
    samplerCanvas.height = wallpaper.naturalHeight;
    samplerCtx.drawImage(wallpaper, 0, 0);
    updateTheme();
  } catch(e) {}
}

wallpaper.onload = sampleAndTheme;
if (wallpaper.complete && wallpaper.naturalWidth) sampleAndTheme();

function updateTheme() {
  try {
    const [r, g, b] = samplerCtx.getImageData(samplerCanvas.width / 2, samplerCanvas.height * 0.85, 1, 1).data;
    const bright = (r * 299 + g * 587 + b * 114) / 1000;
    dock.style.background      = bright > 140 ? "rgba(0,0,0,0.55)"    : "rgba(255,255,255,0.18)";
    weatherEl.style.background = bright > 140 ? "rgba(0,0,0,0.45)"    : "rgba(255,255,255,0.12)";
    dock.style.color = weatherEl.style.color = "white";
  } catch(e) {
    dock.style.background = "rgba(0,0,0,0.5)";
  }
}

const WEATHER_KEY = "8c613d9a099482bf87481c0354e07439";
const iconMap = { Clear:"☀️", Clouds:"☁️", Rain:"🌧️", Drizzle:"🌦️", Thunderstorm:"⛈️", Snow:"❄️", Mist:"🌫️", Haze:"🌫️", Fog:"🌫️" };

function getWeather(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`)
    .then(r => r.json())
    .then(d => {
      document.getElementById("temp").textContent      = Math.round(d.main.temp) + "°C";
      document.getElementById("condition").textContent = d.weather[0].main;
      document.getElementById("location").textContent  = d.name;
      document.getElementById("details").textContent   = "Humidity: " + d.main.humidity + "%";
      document.getElementById("icon").textContent      = iconMap[d.weather[0].main] || "🌍";
    })
    .catch(() => { document.getElementById("condition").textContent = "Weather unavailable"; });
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    p => getWeather(p.coords.latitude, p.coords.longitude),
    () => { document.getElementById("condition").textContent = "Location blocked"; }
  );
}

let highestZ = 2000;

function openApp(name) {
  const map = {
    calculator: "calculatorWindow",
    files:      "filesWindow",
    browser:    "browserWindow",
    settings:   "settingsWindow",
    terminal:   "terminalWindow",
    notepad:    "notepadWindow",
    paint:      "paintWindow",
    assistant:  "assistantWindow",
    camera:     "cameraWindow"
  };
  const el = document.getElementById(map[name]);
  if (el) { el.classList.remove("hidden"); bringToFront(el); }
}

function bringToFront(win) { win.style.zIndex = ++highestZ; }

document.querySelectorAll(".close-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();
    btn.closest(".window")?.classList.add("hidden");
  });
});

document.querySelectorAll(".window").forEach(win => {
  win.addEventListener("mousedown", () => bringToFront(win));
});

(function makeDraggable() {
  let dragging = null, sx, sy, sl, st;

  document.addEventListener("mousedown", e => {
    const h = e.target.closest(".draggable-header");
    if (!h || e.target.classList.contains("close-btn")) return;
    dragging = h.closest(".window");
    if (!dragging) return;
    bringToFront(dragging);
    sx = e.clientX; sy = e.clientY;
    const r = dragging.getBoundingClientRect();
    sl = r.left; st = r.top;
    dragging.style.left = sl + "px";
    dragging.style.top  = st + "px";
    dragging.style.transform = "";
    e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    dragging.style.left = (sl + e.clientX - sx) + "px";
    dragging.style.top  = (st + e.clientY - sy) + "px";
  });

  document.addEventListener("mouseup", () => { dragging = null; });
})();

document.querySelectorAll(".dock-item[data-app]").forEach(item => {
  item.addEventListener("click", e => {
    e.stopPropagation();
    openApp(item.getAttribute("data-app"));
  });
});

const startMenu    = document.getElementById("startMenu");
const startMenuBtn = document.getElementById("startMenuBtn");

startMenuBtn.addEventListener("click", e => {
  e.stopPropagation();
  startMenu.classList.toggle("hidden");
});

document.addEventListener("click", e => {
  if (!startMenu.contains(e.target) && !startMenuBtn.contains(e.target)) {
    startMenu.classList.add("hidden");
  }
});

document.querySelectorAll(".app-item[data-app]").forEach(item => {
  item.addEventListener("click", () => {
    openApp(item.getAttribute("data-app"));
    startMenu.classList.add("hidden");
  });
});

(function initCalculator() {
  let input = "0", op = null, prev = null, fresh = false;
  const disp = document.getElementById("calcDisplay");
  const show = () => { disp.value = input; };

  document.querySelectorAll(".calc-btn[data-value]").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-value");
      if (v === "." && input.includes(".")) return;
      if (fresh || input === "0") { input = v === "." ? "0." : v; fresh = false; }
      else input += v;
      show();
    });
  });

  document.querySelectorAll(".calc-btn.operator").forEach(btn => {
    btn.addEventListener("click", () => {
      prev  = parseFloat(input);
      op    = btn.getAttribute("data-op");
      fresh = true;
    });
  });

  document.getElementById("calcEquals")?.addEventListener("click", () => {
    if (op === null || prev === null) return;
    const cur = parseFloat(input);
    let r;
    switch(op) {
      case "+": r = prev + cur; break;
      case "-": r = prev - cur; break;
      case "*": r = prev * cur; break;
      case "/": r = cur !== 0 ? prev / cur : "Error"; break;
    }
    input = String(r); op = null; prev = null; fresh = true;
    show();
  });

  document.getElementById("calcClear")?.addEventListener("click", () => {
    input = "0"; op = null; prev = null; fresh = false;
    show();
  });

  document.getElementById("calculatorWindow")?.addEventListener("keydown", e => {
    if (document.getElementById("calculatorWindow").classList.contains("hidden")) return;
    const k = e.key;
    if ("0123456789.".includes(k)) document.querySelector(`.calc-btn[data-value="${k}"]`)?.click();
    else if (k === "Enter" || k === "=") document.getElementById("calcEquals")?.click();
    else if (k === "Escape") document.getElementById("calcClear")?.click();
    else if (["+","-","*","/"].includes(k)) document.querySelector(`.calc-btn[data-op="${k}"]`)?.click();
  });
})();

(function initSettings() {
  document.querySelectorAll(".settings-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".settings-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".settings-pane").forEach(p => p.classList.add("hidden"));
      tab.classList.add("active");
      document.getElementById(tab.getAttribute("data-target"))?.classList.remove("hidden");
    });
  });

  document.querySelectorAll("input[name='osTheme']").forEach(r => {
    r.addEventListener("change", e => {
      document.body.className = e.target.value === "dark" ? "" : "theme-" + e.target.value;
    });
  });

  document.getElementById("osAccentColor")?.addEventListener("input", e => {
    document.documentElement.style.setProperty("--accent", e.target.value);
  });

  let animFrame;

  document.getElementById("liveBgGradient")?.addEventListener("click", () => {
    wallpaper.style.display = "none";
    liveCanvas.style.display = "block";
    cancelAnimationFrame(animFrame);
    liveCanvas.width = window.innerWidth;
    liveCanvas.height = window.innerHeight;
    const ctx = liveCanvas.getContext("2d");
    let t = 0;
    function draw() {
      liveCanvas.width = window.innerWidth;
      liveCanvas.height = window.innerHeight;
      const g = ctx.createLinearGradient(0, 0, liveCanvas.width, liveCanvas.height);
      g.addColorStop(0, `hsl(${t % 360},70%,60%)`);
      g.addColorStop(1, `hsl(${(t + 90) % 360},70%,40%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, liveCanvas.width, liveCanvas.height);
      t += 0.5;
      animFrame = requestAnimationFrame(draw);
    }
    draw();
  });

  document.getElementById("liveBgParticles")?.addEventListener("click", () => {
    wallpaper.style.display = "none";
    liveCanvas.style.display = "block";
    cancelAnimationFrame(animFrame);
    liveCanvas.width = window.innerWidth;
    liveCanvas.height = window.innerHeight;
    const ctx = liveCanvas.getContext("2d");
    const pts = Array.from({ length: 120 }, () => ({
      x: Math.random() * liveCanvas.width,
      y: Math.random() * liveCanvas.height,
      s: Math.random() * 2 + 0.5,
      v: Math.random() * 0.6 + 0.15
    }));
    function draw() {
      ctx.fillStyle = "#08111f";
      ctx.fillRect(0, 0, liveCanvas.width, liveCanvas.height);
      ctx.fillStyle = "white";
      pts.forEach(p => {
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 1000 + p.x) * 0.3;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
        p.y -= p.v;
        if (p.y < 0) { p.y = liveCanvas.height; p.x = Math.random() * liveCanvas.width; }
      });
      ctx.globalAlpha = 1;
      animFrame = requestAnimationFrame(draw);
    }
    draw();
  });

  document.querySelectorAll(".bg-grid img").forEach(img => {
    img.addEventListener("click", () => {
      cancelAnimationFrame(animFrame);
      liveCanvas.style.display = "none";
      wallpaper.style.display  = "block";
      wallpaper.src = img.getAttribute("data-bg");
    });
  });
})();

const DEFAULT_VFS = {
  Home:      { "readme.txt": { type:"text", content:"Welcome to Cloud OS!\n\nThis is your virtual file system.\nYou can create, edit, and delete files here." } },
  Documents: {},
  Downloads: {},
  Pictures:  {}
};

function loadVFS() {
  try { const v = JSON.parse(localStorage.getItem("vfs_data")); return v && v.Home ? v : DEFAULT_VFS; }
  catch(e) { return DEFAULT_VFS; }
}

function saveVFS(vfs) {
  try { localStorage.setItem("vfs_data", JSON.stringify(vfs)); } catch(e) {}
}

(function initFiles() {
  let vfs = loadVFS();
  let folder = "Home";

  const list    = document.getElementById("filesList");
  const path    = document.getElementById("currentPath");
  const modal   = document.getElementById("fileModal");
  const nameIn  = document.getElementById("fileNameInput");
  const contIn  = document.getElementById("fileContentInput");
  const ctxMenu = document.getElementById("osContextMenu");

  if (!list) return;

  const render = window.refreshFiles = () => {
    list.innerHTML = "";
    if (path) path.textContent = "/" + folder;
    Object.entries(vfs[folder] || {}).forEach(([name, data]) => {
      const el = document.createElement("div");
      el.className = "file-item";
      el.innerHTML = `<span class="file-icon">${data.type === "image" ? "🖼️" : "📄"}</span><span style="word-break:break-all;font-size:11px;">${name}</span><button class="del-btn">✕</button>`;
      el.addEventListener("dblclick", () => {
        if (data.type === "text") window.openNotepad?.(name, data.content);
        else openApp("paint");
      });
      el.querySelector(".del-btn").addEventListener("click", e => {
        e.stopPropagation();
        if (confirm("Delete " + name + "?")) { delete vfs[folder][name]; saveVFS(vfs); render(); }
      });
      list.appendChild(el);
    });
  };

  document.querySelectorAll(".sidebar-item").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
      el.classList.add("active");
      folder = el.textContent.replace(/[^a-zA-Z]/g, "").trim() || "Home";
      render();
    });
  });

  document.getElementById("newFileBtn")?.addEventListener("click", () => {
    nameIn.value = ""; contIn.value = "";
    modal.classList.remove("hidden"); nameIn.focus();
  });

  document.getElementById("fileCancelBtn")?.addEventListener("click", () => modal.classList.add("hidden"));

  document.getElementById("fileSaveBtn")?.addEventListener("click", () => {
    const n = nameIn.value.trim() || "untitled.txt";
    vfs[folder] = vfs[folder] || {};
    vfs[folder][n] = { type:"text", content: contIn.value };
    saveVFS(vfs); modal.classList.add("hidden"); render();
  });

  if (ctxMenu) {
    list.addEventListener("contextmenu", e => {
      e.preventDefault();
      ctxMenu.style.left = e.pageX + "px";
      ctxMenu.style.top  = e.pageY + "px";
      ctxMenu.classList.remove("hidden");
    });
    document.addEventListener("click", e => { if (!ctxMenu.contains(e.target)) ctxMenu.classList.add("hidden"); });
    document.getElementById("ctxNewFile")?.addEventListener("click", () => {
      ctxMenu.classList.add("hidden");
      document.getElementById("newFileBtn")?.click();
    });
  }

  window.saveVfsImage = (filename, dataUrl) => {
    const v = loadVFS();
    v.Pictures = v.Pictures || {};
    v.Pictures[filename] = { type:"image", content: dataUrl };
    saveVFS(v);
    if (folder === "Pictures") render();
  };

  render();
})();

(function initBrowser() {
  const tabsEl   = document.getElementById("browserTabs");
  const framesEl = document.getElementById("browserFrames");
  const urlBar   = document.getElementById("urlBar");
  const bBar     = document.getElementById("bookmarksBar");
  const bBtn     = document.getElementById("bookmarkBtn");
  const loadBar  = document.getElementById("loadingBar");

  if (!tabsEl || !framesEl) return;

  const HOME = "https://www.google.com/search?igu=1";
  let tabs = [], activeId = null, counter = 0;

  let bookmarks = (() => {
    try { return JSON.parse(localStorage.getItem("browser_bookmarks")) || []; } catch(e) { return []; }
  })();
  if (!bookmarks.length) bookmarks = [
    { name:"Google",    url: HOME },
    { name:"Wikipedia", url:"https://en.wikipedia.org" },
    { name:"GitHub",    url:"https://github.com" }
  ];

  const saveB = () => { try { localStorage.setItem("browser_bookmarks", JSON.stringify(bookmarks)); } catch(e) {} };

  const fmt = u => {
    if (!u.startsWith("http://") && !u.startsWith("https://"))
      return u.includes(".") && !u.includes(" ") ? "https://" + u : "https://www.google.com/search?igu=1&q=" + encodeURIComponent(u);
    return u;
  };

  const triggerLoad = () => {
    if (!loadBar) return;
    loadBar.style.width = "0%";
    setTimeout(() => { loadBar.style.width = "70%"; }, 20);
    setTimeout(() => { loadBar.style.width = "100%"; }, 600);
    setTimeout(() => { loadBar.style.width = "0%"; }, 1100);
  };

  const renderB = () => {
    if (!bBar) return;
    bBar.innerHTML = "";
    bookmarks.forEach((b, i) => {
      const el = document.createElement("div");
      el.className = "bookmark-item";
      el.textContent = b.name;
      el.addEventListener("click", () => navigate(b.url));
      el.addEventListener("contextmenu", e => {
        e.preventDefault();
        if (confirm("Remove bookmark: " + b.name + "?")) { bookmarks.splice(i, 1); saveB(); renderB(); updateBIcon(); }
      });
      bBar.appendChild(el);
    });
  };

  const updateBIcon = () => {
    if (!bBtn) return;
    const tab = tabs.find(t => t.id === activeId);
    if (!tab) return;
    const saved = bookmarks.some(b => b.url === tab.url);
    bBtn.textContent = saved ? "★" : "☆";
    bBtn.classList.toggle("bookmarked", saved);
  };

  const renderTabs = () => {
    tabsEl.innerHTML = "";
    tabs.forEach(tab => {
      const el = document.createElement("div");
      el.className = "browser-tab" + (tab.id === activeId ? " active" : "");
      el.innerHTML = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tab.url.replace(/https?:\/\/(www\.)?/,"").split("/")[0]||"New Tab"}</span><div class="tab-close">✕</div>`;
      el.addEventListener("click", () => switchTab(tab.id));
      el.querySelector(".tab-close").addEventListener("click", e => { e.stopPropagation(); closeTab(tab.id); });
      tabsEl.appendChild(el);
    });
    document.querySelectorAll(".browser-iframe").forEach(f => f.classList.toggle("active", f.id === "frame_" + activeId));
    const tab = tabs.find(t => t.id === activeId);
    if (tab && urlBar) urlBar.value = tab.url;
    updateBIcon();
  };

  const navigate = url => {
    const tab = tabs.find(t => t.id === activeId);
    if (!tab) return;
    const u = fmt(url);
    tab.url = u; tab.history = tab.history.slice(0, tab.histIdx + 1);
    tab.history.push(u); tab.histIdx++;
    const fr = document.getElementById("frame_" + activeId);
    if (fr) { fr.src = u; triggerLoad(); }
    renderTabs();
  };

  const newTab = (url = HOME) => {
    const id = ++counter, u = fmt(url);
    tabs.push({ id, url:u, history:[u], histIdx:0 });
    const fr = document.createElement("iframe");
    fr.id = "frame_" + id; fr.className = "browser-iframe"; fr.src = u;
    framesEl.appendChild(fr);
    activeId = id; triggerLoad(); renderTabs();
  };

  const switchTab = id => { activeId = id; renderTabs(); };

  const closeTab = id => {
    tabs = tabs.filter(t => t.id !== id);
    document.getElementById("frame_" + id)?.remove();
    if (!tabs.length) { newTab(); return; }
    if (activeId === id) activeId = tabs[tabs.length - 1].id;
    renderTabs();
  };

  document.getElementById("newTabBtn")?.addEventListener("click", () => newTab());
  urlBar?.addEventListener("keypress", e => { if (e.key === "Enter") navigate(urlBar.value); });
  document.getElementById("homeBtn")?.addEventListener("click", () => navigate(HOME));
  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    const fr = document.getElementById("frame_" + activeId);
    if (fr) { fr.src = fr.src; triggerLoad(); }
  });
  document.getElementById("backBtn")?.addEventListener("click", () => {
    const tab = tabs.find(t => t.id === activeId);
    if (tab && tab.histIdx > 0) { tab.histIdx--; tab.url = tab.history[tab.histIdx]; const fr = document.getElementById("frame_" + activeId); if (fr) { fr.src = tab.url; triggerLoad(); } renderTabs(); }
  });
  document.getElementById("forwardBtn")?.addEventListener("click", () => {
    const tab = tabs.find(t => t.id === activeId);
    if (tab && tab.histIdx < tab.history.length - 1) { tab.histIdx++; tab.url = tab.history[tab.histIdx]; const fr = document.getElementById("frame_" + activeId); if (fr) { fr.src = tab.url; triggerLoad(); } renderTabs(); }
  });
  bBtn?.addEventListener("click", () => {
    const tab = tabs.find(t => t.id === activeId);
    if (!tab) return;
    const idx = bookmarks.findIndex(b => b.url === tab.url);
    if (idx > -1) bookmarks.splice(idx, 1);
    else { const n = prompt("Bookmark name:", tab.url.replace(/https?:\/\/(www\.)?/,"").split("/")[0]); if (n) bookmarks.push({ name:n, url:tab.url }); }
    saveB(); renderB(); updateBIcon();
  });

  renderB(); newTab();
})();

(function initPaint() {
  const canvas = document.getElementById("paintCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let history = [], step = -1, eraser = false, painting = false, lx = 0, ly = 0;

  const save = () => { step++; history = history.slice(0, step); history.push(canvas.toDataURL()); };
  const restore = () => {
    if (step < 0 || step >= history.length) return;
    const img = new Image(); img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); }; img.src = history[step];
  };
  const resize = () => {
    const p = canvas.parentElement;
    if (!p) return;
    const r = p.getBoundingClientRect();
    if (r.width < 10) return;
    const saved = step >= 0 ? history[step] : null;
    canvas.width = r.width; canvas.height = r.height;
    ctx.fillStyle = "white"; ctx.fillRect(0,0,canvas.width,canvas.height);
    if (saved) { const img = new Image(); img.onload = () => ctx.drawImage(img,0,0); img.src = saved; }
    else save();
  };

  new ResizeObserver(() => { if (!document.getElementById("paintWindow")?.classList.contains("hidden")) resize(); }).observe(canvas.parentElement);
  document.querySelectorAll("[data-app='paint']").forEach(b => b.addEventListener("click", () => setTimeout(resize, 60)));

  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return { x:(e.clientX??e.touches?.[0]?.clientX??0)-r.left, y:(e.clientY??e.touches?.[0]?.clientY??0)-r.top };
  };

  canvas.addEventListener("mousedown", e => {
    painting = true;
    const {x,y} = pos(e); lx=x; ly=y;
    ctx.beginPath(); ctx.arc(x,y,ctx.lineWidth/2,0,Math.PI*2);
    ctx.fillStyle = eraser ? "white" : document.getElementById("paintColor").value; ctx.fill();
  });

  canvas.addEventListener("mousemove", e => {
    if (!painting) return;
    const {x,y} = pos(e);
    ctx.lineWidth = document.getElementById("paintSize").value;
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.strokeStyle = eraser ? "white" : document.getElementById("paintColor").value;
    ctx.beginPath(); ctx.moveTo(lx,ly); ctx.lineTo(x,y); ctx.stroke();
    lx=x; ly=y;
  });

  const end = () => { if (painting) { painting = false; ctx.beginPath(); save(); } };
  canvas.addEventListener("mouseup", end); canvas.addEventListener("mouseleave", end);

  document.getElementById("paintBrushBtn")?.addEventListener("click", () => {
    eraser = false;
    document.getElementById("paintBrushBtn").classList.add("active");
    document.getElementById("paintEraserBtn").classList.remove("active");
  });
  document.getElementById("paintEraserBtn")?.addEventListener("click", () => {
    eraser = true;
    document.getElementById("paintEraserBtn").classList.add("active");
    document.getElementById("paintBrushBtn").classList.remove("active");
  });
  document.getElementById("paintUndoBtn")?.addEventListener("click", () => { if (step > 0) { step--; restore(); } });
  document.getElementById("paintRedoBtn")?.addEventListener("click", () => { if (step < history.length - 1) { step++; restore(); } });
  document.getElementById("paintClear")?.addEventListener("click", () => { ctx.fillStyle="white"; ctx.fillRect(0,0,canvas.width,canvas.height); save(); });
  document.getElementById("paintSave")?.addEventListener("click", () => {
    const name = prompt("Save image as:", "painting.png");
    if (!name) return;
    window.saveVfsImage?.(name, canvas.toDataURL("image/png"));
    alert("Saved to Pictures!");
  });
})();

(function initNotepad() {
  const ta    = document.getElementById("notepadText");
  const title = document.getElementById("notepadTitle");
  const btn   = document.getElementById("notepadSave");
  let file    = null;

  window.openNotepad = (filename, content) => {
    file = filename || null; ta.value = content || "";
    title.textContent = "Notepad — " + (filename || "Untitled");
    openApp("notepad"); setTimeout(() => ta.focus(), 100);
  };

  btn?.addEventListener("click", () => {
    const name = file || prompt("Save as:", "note.txt");
    if (!name) return;
    const vfs = loadVFS();
    vfs.Documents = vfs.Documents || {};
    vfs.Documents[name] = { type:"text", content: ta.value };
    saveVFS(vfs); file = name;
    title.textContent = "Notepad — " + name;
    alert("Saved to Documents!"); window.refreshFiles?.();
  });
})();

(function initTerminal() {
  const input  = document.getElementById("terminalInput");
  const output = document.getElementById("terminalOutput");
  if (!input || !output) return;

  let curPath = "Home", history = [], histIdx = -1;

  const print = (text, color = "#00ff41") => {
    const d = document.createElement("div"); d.style.color = color; d.textContent = text;
    output.appendChild(d); output.scrollTop = output.scrollHeight;
  };

  print("Cloud OS Terminal v2.0"); print("Type 'help' for commands."); print("");

  input.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") { if (histIdx < history.length-1) histIdx++; input.value = history[history.length-1-histIdx]||""; e.preventDefault(); }
    else if (e.key === "ArrowDown") { if (histIdx > -1) histIdx--; input.value = histIdx>=0 ? history[history.length-1-histIdx]||"" : ""; e.preventDefault(); }
  });

  input.addEventListener("keypress", e => {
    if (e.key !== "Enter") return;
    const line = input.value.trim(); input.value = ""; histIdx = -1;
    if (!line) return;
    history.push(line);
    print(`user@cloud-os:~/${curPath}$ ${line}`, "#fff");
    const [cmd, ...rest] = line.split(" "), param = rest.join(" "), vfs = loadVFS();

    switch(cmd.toLowerCase()) {
      case "help": print("Commands: help, ls, ll, cd, cat, touch, rm, clear, whoami, date, echo, pwd, neofetch"); break;
      case "ls": case "ll": { const f = vfs[curPath]||{}; const ks=Object.keys(f); ks.length ? ks.forEach(k=>print(k)) : print("(empty)"); break; }
      case "pwd": print("/" + curPath); break;
      case "cd":
        if (!param || param==="~" || param==="/") curPath="Home";
        else if (vfs[param]) curPath=param;
        else print("cd: no such directory: "+param,"#ff5555");
        break;
      case "cat": {
        if (!param) { print("cat: missing operand","#ff5555"); break; }
        const f = vfs[curPath]?.[param];
        if (f?.type==="text") print(f.content);
        else if (f?.type==="image") print("[binary image data]","#888");
        else print("cat: "+param+": no such file","#ff5555");
        break;
      }
      case "touch": { if (!param) { print("touch: missing operand","#ff5555"); break; } const v=loadVFS(); v[curPath]=v[curPath]||{}; v[curPath][param]={type:"text",content:""}; saveVFS(v); print("Created: "+param); window.refreshFiles?.(); break; }
      case "rm": { if (!param) { print("rm: missing operand","#ff5555"); break; } const v=loadVFS(); if (!v[curPath]?.[param]) { print("rm: "+param+": no such file","#ff5555"); break; } delete v[curPath][param]; saveVFS(v); print("Deleted: "+param); window.refreshFiles?.(); break; }
      case "echo": print(param); break;
      case "clear": output.innerHTML=""; break;
      case "whoami": print("user"); break;
      case "date": print(new Date().toString()); break;
      case "neofetch":
        print("         ████        user@cloud-os","#4facfe");
        print("        ██████       ─────────────");
        print("       ████████      OS: Cloud OS");
        print("      ██  ██  ██     Shell: CloudShell");
        print("     ██████████      Terminal: CloudTerm");
        print("    ████████████     Theme: Glass Dark");
        print("   ██████████████    Icons: SVG Stroke");
        break;
      default: print(`${cmd}: command not found`, "#ff5555");
    }
  });
})();

(function initSearch() {
  const inp = document.getElementById("startSearch");
  const res = document.getElementById("searchResults");
  const grid = document.querySelector(".start-menu .app-grid");
  const apps = ["Calculator","Files","Browser","Settings","Terminal","Notepad","Paint","AI Assistant","Camera"];

  if (!inp) return;

  inp.addEventListener("input", () => {
    const q = inp.value.toLowerCase().trim();
    if (!q) { res.classList.add("hidden"); grid.style.display = ""; return; }
    res.innerHTML = ""; res.classList.remove("hidden"); grid.style.display = "none";

    apps.filter(n => n.toLowerCase().includes(q)).forEach(name => {
      const d = document.createElement("div"); d.className="search-item";
      d.innerHTML = `<span>🚀</span><span>${name}</span>`;
      d.addEventListener("click", () => { openApp(name.toLowerCase().replace(" ","")); startMenu.classList.add("hidden"); });
      res.appendChild(d);
    });

    const vfs = loadVFS();
    for (const folder in vfs) {
      for (const fname in vfs[folder]) {
        if (fname.toLowerCase().includes(q)) {
          const d = document.createElement("div"); d.className="search-item";
          d.innerHTML = `<span>📄</span><span>${fname}</span><small style="opacity:0.5;margin-left:auto;">${folder}</small>`;
          d.addEventListener("click", () => {
            const fd = vfs[folder][fname];
            if (fd.type==="text") window.openNotepad?.(fname, fd.content); else openApp("paint");
            startMenu.classList.add("hidden");
          });
          res.appendChild(d);
        }
      }
    }

    if (!res.children.length) {
      const d = document.createElement("div"); d.className="search-item"; d.style.opacity="0.5";
      d.textContent = `No results for "${q}"`; res.appendChild(d);
    }
  });
})();

(function initCamera() {
  const video    = document.getElementById("cameraVideo");
  const photoBtn = document.getElementById("cameraPhotoBtn");
  const videoBtn = document.getElementById("cameraVideoBtn");
  const status   = document.getElementById("cameraStatus");
  const camWin   = document.getElementById("cameraWindow");

  if (!video || !camWin) return;

  let stream = null, recorder = null, chunks = [], recording = false;

  const showStatus = (text, duration = 1500) => {
    status.textContent = text; status.classList.add("visible");
    setTimeout(() => status.classList.remove("visible"), duration);
  };

  const startCam = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      video.srcObject = stream;
    } catch(e) { showStatus("Camera access denied", 3000); }
  };

  const stopCam = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (recorder && recording) { recorder.stop(); recording = false; }
  };

  new MutationObserver(() => {
    if (!camWin.classList.contains("hidden")) startCam();
    else stopCam();
  }).observe(camWin, { attributes: true });

  photoBtn?.addEventListener("click", () => {
    if (!stream) return;
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0);
    window.saveVfsImage?.("photo_" + Date.now() + ".png", c.toDataURL("image/png"));
    video.style.opacity = "0"; setTimeout(() => { video.style.opacity = "1"; }, 120);
    showStatus("📸 Photo saved!");
  });

  videoBtn?.addEventListener("click", () => {
    if (!stream) return;
    if (!recording) {
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type:"video/webm" });
        const fr = new FileReader();
        fr.onloadend = () => window.saveVfsImage?.("video_" + Date.now() + ".webm", fr.result);
        fr.readAsDataURL(blob);
        showStatus("🎥 Video saved!");
      };
      recorder.start(); recording = true;
      videoBtn.classList.add("recording");
      showStatus("● Recording...", 99999);
    } else {
      recorder.stop(); recording = false;
      videoBtn.classList.remove("recording");
      status.classList.remove("visible");
    }
  });
})();

(function initAssistant() {
  const welcome   = document.getElementById("aiWelcome");
  const messages  = document.getElementById("aiMessages");
  const input     = document.getElementById("aiInput");
  const sendBtn   = document.getElementById("aiSendBtn");

  if (!messages || !input) return;

  let chatHistory = [];
  let streaming   = false;

  const showChat = () => {
    if (welcome) welcome.style.display = "none";
    messages.style.display = "flex";
  };

  const addMsg = (text, role) => {
    showChat();
    const wrap = document.createElement("div");
    wrap.className = "ai-msg " + role;
    const avatar = document.createElement("div");
    avatar.className = "ai-msg-avatar";
    avatar.textContent = role === "user" ? "👤" : "✦";
    const bubble = document.createElement("div");
    bubble.className = "ai-msg-bubble";
    bubble.textContent = text;
    wrap.appendChild(avatar); wrap.appendChild(bubble);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  };

  const addTyping = () => {
    showChat();
    const wrap = document.createElement("div"); wrap.className = "ai-msg bot"; wrap.id = "ai-typing-indicator";
    const avatar = document.createElement("div"); avatar.className = "ai-msg-avatar"; avatar.textContent = "✦";
    const bubble = document.createElement("div"); bubble.className = "ai-msg-bubble";
    bubble.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';
    wrap.appendChild(avatar); wrap.appendChild(bubble);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return wrap;
  };

  const removeTyping = () => { document.getElementById("ai-typing-indicator")?.remove(); };

  const send = async () => {
    const text = input.value.trim();
    if (!text || streaming) return;

    input.value = ""; input.style.height = "";
    addMsg(text, "user");
    chatHistory.push({ role:"user", content: text });

    streaming = true; sendBtn.disabled = true;
    const typingEl = addTyping();

    try {
      const resp = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [
            { role:"system", content:"You are Cloud OS AI Assistant, a helpful AI built into a web-based OS. You can open apps by responding with <OPEN_APP:appname>. Available apps: calculator, files, browser, settings, terminal, notepad, paint, camera. Use this tag only when the user explicitly wants to open an app. Keep responses concise and helpful." },
            ...chatHistory
          ],
          stream: true
        })
      });

      removeTyping();

      if (!resp.ok) throw new Error("API error " + resp.status);

      const bubble = addMsg("", "bot");
      let reply = "";

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data:"));
        for (const line of lines) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              reply += content;
              const appMatch = reply.match(/<OPEN_APP:(\w+)>/);
              const display = appMatch ? reply.replace(appMatch[0], "").trim() : reply;
              bubble.textContent = display || "…";
              messages.scrollTop = messages.scrollHeight;
            }
          } catch(e) {}
        }
      }

      const appMatch = reply.match(/<OPEN_APP:(\w+)>/);
      if (appMatch) {
        openApp(appMatch[1].toLowerCase());
        reply = reply.replace(appMatch[0], "").trim();
        if (!reply) reply = "Opening " + appMatch[1] + "…";
        bubble.textContent = reply;
      }

      chatHistory.push({ role:"assistant", content: reply });

    } catch(e) {
      removeTyping();
      addMsg("Connection failed: " + e.message, "bot");
    }

    streaming = false; sendBtn.disabled = false;
    messages.scrollTop = messages.scrollHeight;
  };

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  });

  input.addEventListener("input", () => {
    input.style.height = "";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  });

  document.querySelectorAll(".ai-suggestion-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const p = chip.getAttribute("data-prompt");
      if (p) { input.value = p; send(); }
    });
  });

  messages.style.display = "none";
})();
