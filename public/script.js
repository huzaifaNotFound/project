/* ═══════════════════════════════════════════════════
   CLOUD OS — COMBINED SCRIPT
   v1 aesthetic + v2 features
   ═══════════════════════════════════════════════════ */

const wallpaper    = document.getElementById("wallpaper");
const liveCanvas   = document.getElementById("liveWallpaper");
const dock         = document.getElementById("dock");
const weatherEl    = document.getElementById("weather");

/* ── TIME & DATE ─────────────────────────────────── */
function updateTime() {
  const now = new Date();
  document.getElementById("time").textContent =
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("date").textContent =
    now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
setInterval(updateTime, 1000);
updateTime();

/* ── BACKGROUND SAMPLING / THEME ─────────────────── */
const samplerCanvas = document.createElement("canvas");
const samplerCtx    = samplerCanvas.getContext("2d");

function sampleAndTheme() {
  try {
    samplerCanvas.width  = wallpaper.naturalWidth;
    samplerCanvas.height = wallpaper.naturalHeight;
    samplerCtx.drawImage(wallpaper, 0, 0);
    updateTheme();
  } catch(e) {
    // CORS — skip sampling, keep defaults
  }
}

wallpaper.onload = sampleAndTheme;
if (wallpaper.complete && wallpaper.naturalWidth) sampleAndTheme();

function updateTheme() {
  try {
    const x = samplerCanvas.width / 2;
    const y = samplerCanvas.height * 0.85;
    const [r, g, b] = samplerCtx.getImageData(x, y, 1, 1).data;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness > 140) {
      dock.style.background      = "rgba(0,0,0,0.55)";
      weatherEl.style.background = "rgba(0,0,0,0.45)";
    } else {
      dock.style.background      = "rgba(255,255,255,0.18)";
      weatherEl.style.background = "rgba(255,255,255,0.12)";
    }
    dock.style.color      = "white";
    weatherEl.style.color = "white";
  } catch(e) {
    dock.style.background = "rgba(0,0,0,0.5)";
  }
}

/* ── WEATHER ─────────────────────────────────────── */
const WEATHER_API_KEY = "8c613d9a099482bf87481c0354e07439";
const iconMap = {
  Clear:"☀️", Clouds:"☁️", Rain:"🌧️", Drizzle:"🌦️",
  Thunderstorm:"⛈️", Snow:"❄️", Mist:"🌫️", Haze:"🌫️", Fog:"🌫️"
};

function getWeather(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`)
    .then(r => r.json())
    .then(d => {
      document.getElementById("temp").textContent      = Math.round(d.main.temp) + "°C";
      document.getElementById("condition").textContent = d.weather[0].main;
      document.getElementById("location").textContent  = d.name;
      document.getElementById("details").textContent   = "Humidity: " + d.main.humidity + "%";
      document.getElementById("icon").textContent      = iconMap[d.weather[0].main] || "🌍";
    })
    .catch(() => {
      document.getElementById("condition").textContent = "Weather unavailable";
    });
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => getWeather(pos.coords.latitude, pos.coords.longitude),
    ()  => { document.getElementById("condition").textContent = "Location blocked"; }
  );
}

/* ══════════════════════════════════════════════════
   WINDOW SYSTEM
   ══════════════════════════════════════════════════ */

let highestZ = 2000;

/* Open any app window by name */
function openApp(appName) {
  const map = {
    calculator: "calculatorWindow",
    files:      "filesWindow",
    browser:    "browserWindow",
    settings:   "settingsWindow",
    terminal:   "terminalWindow",
    notepad:    "notepadWindow",
    paint:      "paintWindow"
  };
  const el = document.getElementById(map[appName]);
  if (el) {
    el.classList.remove("hidden");
    bringToFront(el);
  }
}

function bringToFront(win) {
  highestZ++;
  win.style.zIndex = highestZ;
}

/* Close buttons — all windows */
document.querySelectorAll(".close-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    e.stopPropagation();
    btn.closest(".window")?.classList.add("hidden");
  });
});

/* Bring window to front on click */
document.querySelectorAll(".window").forEach(win => {
  win.addEventListener("mousedown", () => bringToFront(win));
});

/* ── DRAGGABLE WINDOWS ───────────────────────────── */
(function makeWindowsDraggable() {
  let dragging = null;
  let startMouseX, startMouseY, startLeft, startTop;

  document.addEventListener("mousedown", e => {
    const header = e.target.closest(".draggable-header");
    if (!header) return;
    if (e.target.classList.contains("close-btn")) return;

    dragging = header.closest(".window");
    if (!dragging) return;

    bringToFront(dragging);

    startMouseX = e.clientX;
    startMouseY = e.clientY;

    const rect = dragging.getBoundingClientRect();
    startLeft = rect.left;
    startTop  = rect.top;

    // Ensure absolute positioning from current visual position
    dragging.style.left = startLeft + "px";
    dragging.style.top  = startTop  + "px";
    dragging.style.transform = "";

    e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    dragging.style.left = (startLeft + e.clientX - startMouseX) + "px";
    dragging.style.top  = (startTop  + e.clientY - startMouseY) + "px";
  });

  document.addEventListener("mouseup", () => { dragging = null; });
})();

/* ── DOCK CLICKS ─────────────────────────────────── */
document.querySelectorAll(".dock-item[data-app]").forEach(item => {
  item.addEventListener("click", e => {
    e.stopPropagation();
    openApp(item.getAttribute("data-app"));
  });
});

/* ── START MENU ──────────────────────────────────── */
const startMenu    = document.getElementById("startMenu");
const startMenuBtn = document.getElementById("startMenuBtn");

startMenuBtn.addEventListener("click", e => {
  e.stopPropagation();
  startMenu.classList.toggle("hidden");
});

// Close on outside click
document.addEventListener("click", e => {
  if (!startMenu.contains(e.target) && e.target !== startMenuBtn && !startMenuBtn.contains(e.target)) {
    startMenu.classList.add("hidden");
  }
});

// Start menu app items
document.querySelectorAll(".app-item[data-app]").forEach(item => {
  item.addEventListener("click", () => {
    openApp(item.getAttribute("data-app"));
    startMenu.classList.add("hidden");
  });
});

/* ══════════════════════════════════════════════════
   CALCULATOR
   ══════════════════════════════════════════════════ */
(function initCalculator() {
  let calcInput   = "0";
  let operator    = null;
  let prevVal     = null;
  let freshInput  = false;

  const display = document.getElementById("calcDisplay");
  const update  = () => { display.value = calcInput; };

  document.querySelectorAll(".calc-btn[data-value]").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-value");
      if (v === "." && calcInput.includes(".")) return;
      if (freshInput || calcInput === "0") {
        calcInput  = (v === ".") ? "0." : v;
        freshInput = false;
      } else {
        calcInput += v;
      }
      update();
    });
  });

  document.querySelectorAll(".calc-btn.operator").forEach(btn => {
    btn.addEventListener("click", () => {
      prevVal    = parseFloat(calcInput);
      operator   = btn.getAttribute("data-op");
      freshInput = true;
    });
  });

  document.getElementById("calcEquals")?.addEventListener("click", () => {
    if (operator === null || prevVal === null) return;
    const cur = parseFloat(calcInput);
    let result;
    switch(operator) {
      case "+": result = prevVal + cur; break;
      case "-": result = prevVal - cur; break;
      case "*": result = prevVal * cur; break;
      case "/": result = cur !== 0 ? prevVal / cur : "Error"; break;
    }
    calcInput  = String(result);
    operator   = null;
    prevVal    = null;
    freshInput = true;
    update();
  });

  document.getElementById("calcClear")?.addEventListener("click", () => {
    calcInput  = "0";
    operator   = null;
    prevVal    = null;
    freshInput = false;
    update();
  });

  // Keyboard support
  document.getElementById("calculatorWindow")?.addEventListener("keydown", e => {
    if (document.getElementById("calculatorWindow").classList.contains("hidden")) return;
    const k = e.key;
    if ("0123456789.".includes(k)) {
      document.querySelector(`.calc-btn[data-value="${k}"]`)?.click();
    } else if (k === "Enter" || k === "=") {
      document.getElementById("calcEquals")?.click();
    } else if (k === "Escape") {
      document.getElementById("calcClear")?.click();
    } else if (["+","-","*","/"].includes(k)) {
      document.querySelector(`.calc-btn[data-op="${k}"]`)?.click();
    }
  });
})();

/* ══════════════════════════════════════════════════
   SETTINGS
   ══════════════════════════════════════════════════ */
(function initSettings() {
  // Tab switching
  document.querySelectorAll(".settings-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".settings-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".settings-pane").forEach(p => p.classList.add("hidden"));
      tab.classList.add("active");
      document.getElementById(tab.getAttribute("data-target"))?.classList.remove("hidden");
    });
  });

  // Theme selection
  document.querySelectorAll("input[name='osTheme']").forEach(radio => {
    radio.addEventListener("change", e => {
      document.body.className = e.target.value === "dark" ? "" : "theme-" + e.target.value;
    });
  });

  // Accent colour
  document.getElementById("osAccentColor")?.addEventListener("input", e => {
    document.documentElement.style.setProperty("--accent", e.target.value);
  });

  let animFrame;

  // Live wallpapers
  document.getElementById("liveBgGradient")?.addEventListener("click", () => {
    wallpaper.style.display = "none";
    liveCanvas.style.display = "block";
    cancelAnimationFrame(animFrame);

    liveCanvas.width  = window.innerWidth;
    liveCanvas.height = window.innerHeight;
    const ctx = liveCanvas.getContext("2d");
    let time = 0;

    function drawGradient() {
      liveCanvas.width = window.innerWidth;
      liveCanvas.height = window.innerHeight;
      const g = ctx.createLinearGradient(0, 0, liveCanvas.width, liveCanvas.height);
      g.addColorStop(0, `hsl(${time % 360},70%,60%)`);
      g.addColorStop(1, `hsl(${(time + 90) % 360},70%,40%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, liveCanvas.width, liveCanvas.height);
      time += 0.5;
      animFrame = requestAnimationFrame(drawGradient);
    }
    drawGradient();
  });

  document.getElementById("liveBgParticles")?.addEventListener("click", () => {
    wallpaper.style.display = "none";
    liveCanvas.style.display = "block";
    cancelAnimationFrame(animFrame);

    liveCanvas.width  = window.innerWidth;
    liveCanvas.height = window.innerHeight;
    const ctx = liveCanvas.getContext("2d");

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * liveCanvas.width,
      y: Math.random() * liveCanvas.height,
      s: Math.random() * 2 + 0.5,
      v: Math.random() * 0.6 + 0.15
    }));

    function drawStars() {
      ctx.fillStyle = "#08111f";
      ctx.fillRect(0, 0, liveCanvas.width, liveCanvas.height);
      ctx.fillStyle = "white";
      particles.forEach(p => {
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 1000 + p.x) * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.v;
        if (p.y < 0) { p.y = liveCanvas.height; p.x = Math.random() * liveCanvas.width; }
      });
      ctx.globalAlpha = 1;
      animFrame = requestAnimationFrame(drawStars);
    }
    drawStars();
  });

  // Static wallpapers
  document.querySelectorAll(".bg-grid img").forEach(img => {
    img.addEventListener("click", () => {
      cancelAnimationFrame(animFrame);
      liveCanvas.style.display = "none";
      wallpaper.style.display  = "block";
      wallpaper.src = img.getAttribute("data-bg");
    });
  });
})();

/* ══════════════════════════════════════════════════
   VIRTUAL FILE SYSTEM & FILES APP
   ══════════════════════════════════════════════════ */
const DEFAULT_VFS = {
  Home:      { "readme.txt": { type:"text", content:"Welcome to Cloud OS!\n\nThis is your virtual file system.\nYou can create, edit, and delete files here." } },
  Documents: {},
  Downloads: {},
  Pictures:  {}
};

function loadVFS() {
  try {
    const v = JSON.parse(localStorage.getItem("vfs_data"));
    return v && v.Home ? v : DEFAULT_VFS;
  } catch(e) { return DEFAULT_VFS; }
}

function saveVFS(vfs) {
  try { localStorage.setItem("vfs_data", JSON.stringify(vfs)); } catch(e) {}
}

(function initFiles() {
  let vfs           = loadVFS();
  let currentFolder = "Home";

  const filesList    = document.getElementById("filesList");
  const pathLabel    = document.getElementById("currentPath");
  const modal        = document.getElementById("fileModal");
  const nameInput    = document.getElementById("fileNameInput");
  const contentInput = document.getElementById("fileContentInput");
  const contextMenu  = document.getElementById("osContextMenu");

  if (!filesList) return;

  const renderFiles = window.refreshFiles = () => {
    filesList.innerHTML = "";
    if (pathLabel) pathLabel.textContent = "/" + currentFolder;

    const folder = vfs[currentFolder] || {};
    Object.entries(folder).forEach(([filename, fileData]) => {
      const item = document.createElement("div");
      item.className = "file-item";
      const icon = fileData.type === "image" ? "🖼️" : "📄";
      item.innerHTML = `
        <span class="file-icon">${icon}</span>
        <span style="word-break:break-all;font-size:11px;">${filename}</span>
        <button class="del-btn">✕</button>
      `;

      item.addEventListener("dblclick", () => {
        if (fileData.type === "text") window.openNotepad?.(filename, fileData.content);
        else openApp("paint");
      });

      item.querySelector(".del-btn").addEventListener("click", e => {
        e.stopPropagation();
        if (confirm("Delete " + filename + "?")) {
          delete vfs[currentFolder][filename];
          saveVFS(vfs);
          renderFiles();
        }
      });

      filesList.appendChild(item);
    });
  };

  // Sidebar folder switching
  document.querySelectorAll(".sidebar-item").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("active"));
      el.classList.add("active");
      // Extract folder name from emoji text like "🏠 Home" -> "Home"
      const text = el.textContent.replace(/[^a-zA-Z]/g, "").trim();
      currentFolder = text || "Home";
      renderFiles();
    });
  });

  // New file button
  document.getElementById("newFileBtn")?.addEventListener("click", () => {
    nameInput.value    = "";
    contentInput.value = "";
    modal.classList.remove("hidden");
    nameInput.focus();
  });

  document.getElementById("fileCancelBtn")?.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document.getElementById("fileSaveBtn")?.addEventListener("click", () => {
    const fname = nameInput.value.trim() || "untitled.txt";
    vfs[currentFolder]       = vfs[currentFolder] || {};
    vfs[currentFolder][fname] = { type:"text", content: contentInput.value };
    saveVFS(vfs);
    modal.classList.add("hidden");
    renderFiles();
  });

  // Context menu on file list
  if (contextMenu) {
    filesList.addEventListener("contextmenu", e => {
      e.preventDefault();
      contextMenu.style.left = e.pageX + "px";
      contextMenu.style.top  = e.pageY + "px";
      contextMenu.classList.remove("hidden");
    });
    document.addEventListener("click", e => {
      if (!contextMenu.contains(e.target)) contextMenu.classList.add("hidden");
    });
    document.getElementById("ctxNewFile")?.addEventListener("click", () => {
      contextMenu.classList.add("hidden");
      document.getElementById("newFileBtn")?.click();
    });
  }

  // Expose VFS image save for Paint
  window.saveVfsImage = (filename, dataUrl) => {
    const v = loadVFS();
    v.Pictures = v.Pictures || {};
    v.Pictures[filename] = { type:"image", content: dataUrl };
    saveVFS(v);
    if (currentFolder === "Pictures") renderFiles();
  };

  renderFiles();
})();

/* ══════════════════════════════════════════════════
   BROWSER
   ══════════════════════════════════════════════════ */
(function initBrowser() {
  const tabsEl       = document.getElementById("browserTabs");
  const framesEl     = document.getElementById("browserFrames");
  const urlBar       = document.getElementById("urlBar");
  const bookmarksBar = document.getElementById("bookmarksBar");
  const bookmarkBtn  = document.getElementById("bookmarkBtn");
  const loadingBar   = document.getElementById("loadingBar");

  if (!tabsEl || !framesEl) return;

  const HOME_URL = "https://www.google.com/search?igu=1";

  let tabs       = [];
  let activeTabId = null;
  let tabCounter  = 0;

  let bookmarks = (() => {
    try { return JSON.parse(localStorage.getItem("browser_bookmarks")) || []; } catch(e) { return []; }
  })();
  if (!bookmarks.length) bookmarks = [
    { name:"Google",    url: HOME_URL },
    { name:"Wikipedia", url:"https://en.wikipedia.org" },
    { name:"GitHub",    url:"https://github.com" }
  ];

  const saveBookmarks = () => {
    try { localStorage.setItem("browser_bookmarks", JSON.stringify(bookmarks)); } catch(e) {}
  };

  const formatUrl = (url) => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes(".") && !url.includes(" ")) return "https://" + url;
      return "https://www.google.com/search?igu=1&q=" + encodeURIComponent(url);
    }
    return url;
  };

  const triggerLoading = () => {
    if (!loadingBar) return;
    loadingBar.style.width = "0%";
    setTimeout(() => { loadingBar.style.width = "70%"; }, 20);
    setTimeout(() => { loadingBar.style.width = "100%"; }, 600);
    setTimeout(() => { loadingBar.style.width = "0%"; }, 1100);
  };

  const renderBookmarks = () => {
    if (!bookmarksBar) return;
    bookmarksBar.innerHTML = "";
    bookmarks.forEach((b, i) => {
      const el = document.createElement("div");
      el.className   = "bookmark-item";
      el.textContent = b.name;
      el.addEventListener("click", () => navigate(b.url));
      el.addEventListener("contextmenu", e => {
        e.preventDefault();
        if (confirm("Remove bookmark: " + b.name + "?")) {
          bookmarks.splice(i, 1);
          saveBookmarks();
          renderBookmarks();
          updateBookmarkIcon();
        }
      });
      bookmarksBar.appendChild(el);
    });
  };

  const updateBookmarkIcon = () => {
    if (!bookmarkBtn) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    const saved = bookmarks.some(b => b.url === tab.url);
    bookmarkBtn.textContent = saved ? "★" : "☆";
    bookmarkBtn.classList.toggle("bookmarked", saved);
  };

  const renderTabs = () => {
    if (!tabsEl) return;
    tabsEl.innerHTML = "";
    tabs.forEach(tab => {
      const el = document.createElement("div");
      el.className  = "browser-tab" + (tab.id === activeTabId ? " active" : "");
      const label   = tab.url.replace(/https?:\/\/(www\.)?/, "").split("/")[0] || "New Tab";
      el.innerHTML  = `<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${label}</span><div class="tab-close">✕</div>`;
      el.addEventListener("click", () => switchTab(tab.id));
      el.querySelector(".tab-close").addEventListener("click", e => { e.stopPropagation(); closeTab(tab.id); });
      tabsEl.appendChild(el);
    });
    // Show/hide frames
    document.querySelectorAll(".browser-iframe").forEach(f => {
      f.classList.toggle("active", f.id === "frame_" + activeTabId);
    });
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab && urlBar) urlBar.value = activeTab.url;
    updateBookmarkIcon();
  };

  const navigate = (url) => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    const fUrl = formatUrl(url);
    tab.url = fUrl;
    tab.history = tab.history.slice(0, tab.histIdx + 1);
    tab.history.push(fUrl);
    tab.histIdx++;
    const frame = document.getElementById("frame_" + activeTabId);
    if (frame) { frame.src = fUrl; triggerLoading(); }
    renderTabs();
  };

  const newTab = (url = HOME_URL) => {
    const id = ++tabCounter;
    const fUrl = formatUrl(url);
    tabs.push({ id, url:fUrl, history:[fUrl], histIdx:0 });
    const frame = document.createElement("iframe");
    frame.id        = "frame_" + id;
    frame.className = "browser-iframe";
    frame.src       = fUrl;
    if (framesEl) framesEl.appendChild(frame);
    activeTabId = id;
    triggerLoading();
    renderTabs();
  };

  const switchTab = (id) => { activeTabId = id; renderTabs(); };

  const closeTab = (id) => {
    tabs = tabs.filter(t => t.id !== id);
    document.getElementById("frame_" + id)?.remove();
    if (!tabs.length) { newTab(); return; }
    if (activeTabId === id) activeTabId = tabs[tabs.length - 1].id;
    renderTabs();
  };

  document.getElementById("newTabBtn")?.addEventListener("click", () => newTab());

  urlBar?.addEventListener("keypress", e => {
    if (e.key === "Enter") navigate(urlBar.value);
  });

  document.getElementById("homeBtn")?.addEventListener("click", () => navigate(HOME_URL));

  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    const frame = document.getElementById("frame_" + activeTabId);
    if (frame) { frame.src = frame.src; triggerLoading(); }
  });

  document.getElementById("backBtn")?.addEventListener("click", () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.histIdx > 0) {
      tab.histIdx--;
      tab.url = tab.history[tab.histIdx];
      const frame = document.getElementById("frame_" + activeTabId);
      if (frame) { frame.src = tab.url; triggerLoading(); }
      renderTabs();
    }
  });

  document.getElementById("forwardBtn")?.addEventListener("click", () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.histIdx < tab.history.length - 1) {
      tab.histIdx++;
      tab.url = tab.history[tab.histIdx];
      const frame = document.getElementById("frame_" + activeTabId);
      if (frame) { frame.src = tab.url; triggerLoading(); }
      renderTabs();
    }
  });

  bookmarkBtn?.addEventListener("click", () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    const idx = bookmarks.findIndex(b => b.url === tab.url);
    if (idx > -1) {
      bookmarks.splice(idx, 1);
    } else {
      const name = prompt("Bookmark name:", tab.url.replace(/https?:\/\/(www\.)?/, "").split("/")[0]);
      if (name) bookmarks.push({ name, url: tab.url });
    }
    saveBookmarks();
    renderBookmarks();
    updateBookmarkIcon();
  });

  // Open browser creates first tab
  document.querySelector(".dock-item[data-app='browser']")?.addEventListener("click", () => {
    if (tabs.length === 0) newTab();
  });

  document.querySelector(".app-item[data-app='browser']")?.addEventListener("click", () => {
    if (tabs.length === 0) newTab();
  });

  renderBookmarks();
  newTab();
})();

/* ══════════════════════════════════════════════════
   PAINT
   ══════════════════════════════════════════════════ */
(function initPaint() {
  const canvas = document.getElementById("paintCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  let history   = [];
  let histStep  = -1;
  let isEraser  = false;
  let painting  = false;
  let lastX = 0, lastY = 0;

  const saveState = () => {
    histStep++;
    history = history.slice(0, histStep);
    history.push(canvas.toDataURL());
  };

  const restoreState = () => {
    if (histStep < 0 || histStep >= history.length) return;
    const img = new Image();
    img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
    img.src = history[histStep];
  };

  const resizeCanvas = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const saved = histStep >= 0 ? history[histStep] : null;
    canvas.width  = rect.width;
    canvas.height = rect.height;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (saved) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = saved;
    } else {
      saveState();
    }
  };

  // Resize when paint window becomes visible
  new ResizeObserver(() => {
    if (!document.getElementById("paintWindow")?.classList.contains("hidden")) {
      resizeCanvas();
    }
  }).observe(canvas.parentElement);

  document.querySelectorAll("[data-app='paint']").forEach(b => {
    b.addEventListener("click", () => setTimeout(resizeCanvas, 60));
  });

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - rect.left,
      y: (e.clientY ?? e.touches?.[0]?.clientY ?? 0) - rect.top
    };
  }

  canvas.addEventListener("mousedown", e => {
    painting = true;
    const { x, y } = getPos(e);
    lastX = x; lastY = y;
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? "white" : document.getElementById("paintColor").value;
    ctx.fill();
  });

  canvas.addEventListener("mousemove", e => {
    if (!painting) return;
    const { x, y } = getPos(e);
    ctx.lineWidth   = document.getElementById("paintSize").value;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.strokeStyle = isEraser ? "white" : document.getElementById("paintColor").value;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x; lastY = y;
  });

  const endPaint = () => {
    if (painting) { painting = false; ctx.beginPath(); saveState(); }
  };

  canvas.addEventListener("mouseup",    endPaint);
  canvas.addEventListener("mouseleave", endPaint);

  document.getElementById("paintBrushBtn")?.addEventListener("click", () => {
    isEraser = false;
    document.getElementById("paintBrushBtn").classList.add("active");
    document.getElementById("paintEraserBtn").classList.remove("active");
  });

  document.getElementById("paintEraserBtn")?.addEventListener("click", () => {
    isEraser = true;
    document.getElementById("paintEraserBtn").classList.add("active");
    document.getElementById("paintBrushBtn").classList.remove("active");
  });

  document.getElementById("paintUndoBtn")?.addEventListener("click", () => {
    if (histStep > 0) { histStep--; restoreState(); }
  });

  document.getElementById("paintRedoBtn")?.addEventListener("click", () => {
    if (histStep < history.length - 1) { histStep++; restoreState(); }
  });

  document.getElementById("paintClear")?.addEventListener("click", () => {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  });

  document.getElementById("paintSave")?.addEventListener("click", () => {
    const fname = prompt("Save image as:", "painting.png");
    if (!fname) return;
    const dataUrl = canvas.toDataURL("image/png");
    window.saveVfsImage?.(fname, dataUrl);
    alert("Saved to Pictures!");
  });
})();

/* ══════════════════════════════════════════════════
   NOTEPAD
   ══════════════════════════════════════════════════ */
(function initNotepad() {
  const textarea  = document.getElementById("notepadText");
  const titleEl   = document.getElementById("notepadTitle");
  const saveBtn   = document.getElementById("notepadSave");

  let currentFile = null;

  window.openNotepad = (filename, content) => {
    currentFile      = filename || null;
    textarea.value   = content || "";
    titleEl.textContent = "Notepad — " + (filename || "Untitled");
    openApp("notepad");
    setTimeout(() => textarea.focus(), 100);
  };

  saveBtn?.addEventListener("click", () => {
    const fname = currentFile || prompt("Save as:", "note.txt");
    if (!fname) return;
    const vfs = loadVFS();
    vfs.Documents       = vfs.Documents || {};
    vfs.Documents[fname] = { type:"text", content: textarea.value };
    saveVFS(vfs);
    currentFile          = fname;
    titleEl.textContent  = "Notepad — " + fname;
    alert("Saved to Documents!");
    window.refreshFiles?.();
  });
})();

/* ══════════════════════════════════════════════════
   TERMINAL
   ══════════════════════════════════════════════════ */
(function initTerminal() {
  const input  = document.getElementById("terminalInput");
  const output = document.getElementById("terminalOutput");
  if (!input || !output) return;

  let currentPath = "Home";
  let cmdHistory  = [];
  let histIdx     = -1;

  const print = (text, color = "#00ff41") => {
    const line = document.createElement("div");
    line.style.color = color;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  };

  print("Cloud OS Terminal v2.0");
  print("Type 'help' for commands.");
  print("");

  input.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") {
      if (histIdx < cmdHistory.length - 1) histIdx++;
      input.value = cmdHistory[cmdHistory.length - 1 - histIdx] || "";
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (histIdx > -1) histIdx--;
      input.value = histIdx >= 0 ? (cmdHistory[cmdHistory.length - 1 - histIdx] || "") : "";
      e.preventDefault();
    }
  });

  input.addEventListener("keypress", e => {
    if (e.key !== "Enter") return;

    const line = input.value.trim();
    input.value = "";
    histIdx     = -1;

    if (!line) return;
    cmdHistory.push(line);

    print(`user@cloud-os:~/${currentPath}$ ${line}`, "#ffffff");

    const [cmd, ...rest] = line.split(" ");
    const param = rest.join(" ");
    const vfs   = loadVFS();

    switch(cmd.toLowerCase()) {
      case "help":
        print("Commands: help, ls, ll, cd, cat, touch, rm, clear, whoami, date, echo, pwd, neofetch");
        break;
      case "ls":
      case "ll": {
        const folder = vfs[currentPath] || {};
        const files  = Object.keys(folder);
        if (!files.length) { print("(empty)"); break; }
        files.forEach(f => print(f));
        break;
      }
      case "pwd":
        print("/" + currentPath);
        break;
      case "cd":
        if (!param || param === "~" || param === "/") {
          currentPath = "Home";
        } else if (vfs[param]) {
          currentPath = param;
        } else {
          print("cd: no such directory: " + param, "#ff5555");
        }
        break;
      case "cat":
        if (!param) { print("cat: missing operand", "#ff5555"); break; }
        const f = vfs[currentPath]?.[param];
        if (f?.type === "text") { print(f.content); }
        else if (f?.type === "image") { print("[binary image data]", "#888"); }
        else { print("cat: " + param + ": no such file", "#ff5555"); }
        break;
      case "touch": {
        if (!param) { print("touch: missing operand", "#ff5555"); break; }
        const vf = loadVFS();
        vf[currentPath]       = vf[currentPath] || {};
        vf[currentPath][param] = { type:"text", content:"" };
        saveVFS(vf);
        print("Created: " + param);
        window.refreshFiles?.();
        break;
      }
      case "rm": {
        if (!param) { print("rm: missing operand", "#ff5555"); break; }
        const vr = loadVFS();
        if (!vr[currentPath]?.[param]) { print("rm: " + param + ": no such file", "#ff5555"); break; }
        delete vr[currentPath][param];
        saveVFS(vr);
        print("Deleted: " + param);
        window.refreshFiles?.();
        break;
      }
      case "echo":
        print(param);
        break;
      case "clear":
        output.innerHTML = "";
        break;
      case "whoami":
        print("user");
        break;
      case "date":
        print(new Date().toString());
        break;
      case "neofetch":
        print("         ████        user@cloud-os", "#4facfe");
        print("        ██████       ─────────────");
        print("       ████████      OS: Cloud OS v2");
        print("      ██  ██  ██     Kernel: Web 1.0");
        print("     ██████████      Shell: CloudShell");
        print("    ████████████     Terminal: CloudTerm");
        print("   ██████████████    Theme: Glass Dark");
        print("  ████████████████   Icons: Stroke v1");
        break;
      default:
        print(`${cmd}: command not found`, "#ff5555");
    }
  });
})();

/* ══════════════════════════════════════════════════
   START MENU SEARCH
   ══════════════════════════════════════════════════ */
(function initSearch() {
  const searchInput = document.getElementById("startSearch");
  const resultsEl   = document.getElementById("searchResults");
  const appGrid     = document.querySelector(".start-menu .app-grid");
  const appNames    = ["Calculator","Files","Browser","Settings","Terminal","Notepad","Paint"];

  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();

    if (!q) {
      resultsEl.classList.add("hidden");
      appGrid.style.display = "";
      return;
    }

    resultsEl.innerHTML = "";
    resultsEl.classList.remove("hidden");
    appGrid.style.display = "none";

    // Search apps
    appNames.filter(n => n.toLowerCase().includes(q)).forEach(name => {
      const div  = document.createElement("div");
      div.className   = "search-item";
      div.innerHTML   = `<span>🚀</span><span>${name}</span>`;
      div.addEventListener("click", () => {
        openApp(name.toLowerCase());
        startMenu.classList.add("hidden");
      });
      resultsEl.appendChild(div);
    });

    // Search files
    const vfs = loadVFS();
    for (const folder in vfs) {
      for (const fname in vfs[folder]) {
        if (fname.toLowerCase().includes(q)) {
          const div = document.createElement("div");
          div.className = "search-item";
          div.innerHTML = `<span>📄</span><span>${fname}</span><small style="opacity:0.5;margin-left:auto;">${folder}</small>`;
          div.addEventListener("click", () => {
            const fd = vfs[folder][fname];
            if (fd.type === "text") window.openNotepad?.(fname, fd.content);
            else openApp("paint");
            startMenu.classList.add("hidden");
          });
          resultsEl.appendChild(div);
        }
      }
    }

    if (!resultsEl.children.length) {
      const div = document.createElement("div");
      div.className   = "search-item";
      div.style.opacity = "0.5";
      div.textContent = "No results for \"" + q + "\"";
      resultsEl.appendChild(div);
    }
  });
})();