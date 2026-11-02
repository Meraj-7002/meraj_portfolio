// ───────── Your details ─────────
const CONFIG = {
  email: "your-email@example.com",                    // TODO
  linkedin: "https://www.linkedin.com/in/your-handle", // TODO
  github: "https://github.com/Meraj-7002",
  resume: "resume.pdf",                                // TODO: add resume.pdf to this folder
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ist = (opts) => new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false, ...opts });

function pushLine(list, html, max) {
  const li = document.createElement("li");
  li.innerHTML = html;
  list.appendChild(li);
  while (list.children.length > max) list.firstChild.remove();
}

// Runs only while the element is actually visible (a collapsed panel counts as hidden)
function whileVisible(el, start, stop) {
  new IntersectionObserver(([e]) => (e.intersectionRatio > 0 ? start() : stop()), { threshold: [0, 0.01] }).observe(el);
}
function onceVisible(el, fn) {
  let done = false;
  whileVisible(el, () => { if (!done) { done = true; fn(); } }, () => {});
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

// ───────── Links ─────────
$("#emailLink").textContent = CONFIG.email;
$("#emailLink").href = `mailto:${CONFIG.email}`;
$("#githubLink").href = CONFIG.github;
$("#linkedinLink").href = CONFIG.linkedin;
$("#resumeLink").href = $("#resumeLink2").href = CONFIG.resume;
$("#year").textContent = new Date().getFullYear();

function copyEmail() {
  navigator.clipboard?.writeText(CONFIG.email).then(() => toast("Email copied"), () => toast(CONFIG.email));
}
$("#copyBtn").addEventListener("click", copyEmail);

// ───────── Theme / nav / clock ─────────
function toggleTheme() {
  const root = document.documentElement;
  const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.dataset.theme = current === "dark" ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
}
$("#themeBtn").addEventListener("click", toggleTheme);

const nav = $("#nav");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const tickClock = () => ($("#clock").textContent = ist({ hour: "2-digit", minute: "2-digit" }));
tickClock();
setInterval(tickClock, 30000);

// ───────── Hero log ─────────
const LOG = [
  () => `<span class="c-acc">lease</span>   scrape:coupons#${Math.floor(rand(1000, 9999))} → worker-0${Math.ceil(rand(0, 3))}`,
  () => `<span class="c-warn">proxy</span>   429 from upstream · rotating exit · retry ${Math.ceil(rand(1, 4))}s`,
  () => `<span class="c-ok">verify</span>  shopify · ${pick(["SAVE20", "WELCOME10", "FREESHIP", "FLASH15"])} · valid`,
  () => `<span class="c-bad">verify</span>  woocommerce · EXPIRED24 · rejected`,
  () => `<span class="c-warn">serp</span>    provider-${pick(["b", "c", "d"])} slow · failover → provider-${pick(["a", "e", "f"])}`,
  () => `<span class="c-acc">trace</span>   hop ${Math.ceil(rand(2, 5))}/5 · affiliate id matched`,
  () => `<span class="c-ok">backup</span>  mongodump · sha256 ok · rotated`,
  () => `<span class="c-ok">llm</span>     grounded in ${Math.ceil(rand(2, 6))} sources · 0 unsupported`,
  () => `<span class="c-acc">webhook</span> paddle · signature ok · duplicate skipped`,
  () => `<span class="c-ok">sync</span>    affiliate networks 26/26`,
  () => `<span class="c-warn">lease</span>   worker-02 missed heartbeat · job requeued`,
  () => `<span class="c-acc">outbox</span>  offer:${Math.floor(rand(2000, 3999))} v${Math.ceil(rand(2, 9))} → socket.io · delivered`,
  () => `<span class="c-warn">sync</span>    offer:2291 v3 arrived late · stale, rejected`,
  () => `<span class="c-ok">restore</span> staged preview · 0 drift · safety copy taken`,
  () => `<span class="c-bad">auth</span>    5 failed logins · locked 15m`,
];
const log = $("#log");
const logTick = () => pushLine(log, `<span class="ts">${ist()}</span>${pick(LOG)()}`, 14);
for (let i = 0; i < 9; i++) logTick();
let logTimer;
whileVisible(log,
  () => { if (!logTimer) logTimer = setInterval(logTick, reduceMotion ? 3000 : 1200); },
  () => { clearInterval(logTimer); logTimer = null; });

// ───────── Project accordion ─────────
$$(".proj-row").forEach((row) => {
  row.addEventListener("click", () => {
    const proj = row.closest(".proj");
    const open = !proj.classList.contains("open");
    proj.classList.toggle("open", open);
    row.setAttribute("aria-expanded", open);
  });
});

// ───────── Lab: SERP router ─────────
(() => {
  const providers = [
    ["serp-a", 30, 0.0012], ["serp-b", 22, 0.0009], ["serp-c", 18, 0.0015],
    ["serp-d", 12, 0.0007], ["serp-e", 10, 0.002], ["serp-f", 8, 0.0011],
  ].map(([id, weight, cost]) => ({ id, weight, cost, up: true, count: 0 }));
  const logEl = $("#serpLog");
  let total = 0, retries = 0, spend = 0, timer;
  const say = (html) => pushLine(logEl, `<span class="ts">${ist()}</span>${html}`, 5);
  const healthy = () => providers.filter((p) => p.up);

  providers.forEach((p) => {
    p.el = document.createElement("button");
    p.el.className = "prov";
    p.el.setAttribute("aria-label", `Toggle ${p.id}`);
    p.el.innerHTML = `<span class="prov-top">${p.id}<span class="prov-state"></span></span>
      <span class="prov-bar"><i></i></span><span class="prov-sub">w${p.weight} · <b>0</b></span>`;
    p.el.addEventListener("click", () => {
      if (p.up && healthy().length === 1) return say(`<span class="t-bad">refused</span> · last healthy provider`);
      p.up = !p.up;
      p.el.classList.toggle("down", !p.up);
      say(p.up
        ? `<span class="t-ok">${p.id} back</span> · rejoined rotation`
        : `<span class="t-bad">${p.id} down</span> · traffic split across ${healthy().length}`);
    });
    $("#serpProviders").appendChild(p.el);
  });

  function choose(exclude) {
    const pool = healthy().filter((p) => p !== exclude);
    let r = Math.random() * pool.reduce((s, p) => s + p.weight, 0);
    for (const p of pool) if ((r -= p.weight) <= 0) return p;
    return pool[pool.length - 1];
  }

  function tick() {
    let p = choose();
    if (Math.random() < 0.06 && healthy().length > 1) {
      const next = choose(p);
      retries++;
      say(`<span class="t-warn">${p.id} timeout</span> → retried on ${next.id}`);
      p = next;
    }
    total++; p.count++; spend += p.cost;
    providers.forEach((x) => {
      x.el.classList.toggle("hit", x === p);
      x.el.querySelector(".prov-bar i").style.width = `${(x.count / total) * 100}%`;
      x.el.querySelector(".prov-sub b").textContent = x.count;
    });
    $("#serpTotal").textContent = total;
    $("#serpRetries").textContent = retries;
    $("#serpCost").textContent = `$${(spend / total).toFixed(4)}`;
  }

  say("6 providers · weighted routing");
  whileVisible($("#serpLab"),
    () => { if (!timer) timer = setInterval(tick, 400); },
    () => { clearInterval(timer); timer = null; });
})();

// ───────── Lab: lease-based queue ─────────
(() => {
  const LEASE = 3000, STEP = 100;
  const logEl = $("#queueLog");
  const queue = [];
  let nextId = 4800, done = 0, reclaimed = 0, timer;
  const say = (html) => pushLine(logEl, `<span class="ts">${ist()}</span>${html}`, 5);
  const refill = () => { while (queue.length < 6) queue.push({ id: `#${nextId++}`, requeued: false }); };

  const workers = [1, 2, 3].map((n) => {
    const w = { id: `worker-0${n}`, alive: true, job: null, progress: 0, lease: 0 };
    w.el = document.createElement("div");
    w.el.className = "worker";
    w.el.innerHTML = `<div class="w-top"><span>${w.id}</span><span class="w-state">idle</span></div>
      <span class="w-job">—</span>
      <span class="meter"><i></i></span>
      <span class="w-label">lease</span>
      <span class="meter lease"><i></i></span>
      <button>Kill</button>`;
    w.el.querySelector("button").addEventListener("click", () => {
      w.alive = !w.alive;
      say(w.alive ? `<span class="t-ok">${w.id} restarted</span>`
        : `<span class="t-bad">${w.id} killed</span>${w.job ? ` · holding ${w.job.id}` : ""}`);
      render();
    });
    $("#workers").appendChild(w.el);
    return w;
  });

  function tick() {
    workers.forEach((w) => {
      if (w.alive) {
        if (!w.job && queue.length) {
          w.job = queue.shift(); w.progress = 0;
          say(`<span class="t-acc">lease</span> ${w.job.id} → ${w.id}${w.job.requeued ? " · reclaimed" : ""}`);
        }
        if (w.job) {
          w.lease = LEASE; // heartbeat
          w.progress += rand(1.5, 4.5);
          if (w.progress >= 100) { done++; say(`<span class="t-ok">done</span> ${w.job.id}`); w.job = null; }
        }
      } else if (w.job && (w.lease -= STEP) <= 0) {
        w.job.requeued = true;
        queue.unshift(w.job);
        reclaimed++;
        say(`<span class="t-warn">lease expired</span> ${w.job.id} · back in queue`);
        w.job = null;
      }
    });
    refill();
    render();
  }

  function render() {
    $("#queue").innerHTML = queue.map((j) => `<span class="job${j.requeued ? " requeued" : ""}">${j.id}</span>`).join("");
    workers.forEach((w) => {
      w.el.classList.toggle("dead", !w.alive);
      w.el.querySelector(".w-state").textContent = !w.alive ? "dead" : w.job ? "working" : "idle";
      w.el.querySelector(".w-job").textContent = w.job ? `job ${w.job.id}` : "—";
      w.el.querySelector(".meter i").style.width = `${w.job ? Math.min(w.progress, 100) : 0}%`;
      w.el.querySelector(".meter.lease i").style.width = `${w.job ? (w.lease / LEASE) * 100 : 0}%`;
      w.el.querySelector("button").textContent = w.alive ? "Kill" : "Restart";
    });
    $("#qDone").textContent = done;
    $("#qReclaimed").textContent = reclaimed;
  }

  refill(); render();
  say("lease 3s · heartbeat renews");
  whileVisible($("#queueLab"),
    () => { if (!timer) timer = setInterval(tick, STEP); },
    () => { clearInterval(timer); timer = null; });
})();

// ───────── Lab: backup run ─────────
(() => {
  const term = $("#backupTerm");
  const LINES = [
    ["cmd", "$ backupper run prod-01 --all"],
    ["", "cgroup limits applied: CPUQuota=40% MemoryMax=1G"],
    ["", "mongodump  1.84 GB"],
    ["", "mysqldump  612 MB"],
    ["", "files      3.1 GB"],
    ["t-warn", "sftp → backup-02 · connection reset · retry 1/3 in 2s"],
    ["", "sftp → backup-02 · transferred"],
    ["t-ok", "✓ sha256 match · no truncation"],
    ["", "retention: 14 daily · 4 weekly · pruned 2"],
    ["t-ok", "✓ done in 4m 12s"],
  ];
  let timers = [];
  function play() {
    timers.forEach(clearTimeout); timers = [];
    term.innerHTML = "";
    LINES.forEach(([cls, text], i) => timers.push(setTimeout(() => {
      const li = document.createElement("li");
      li.className = cls;
      li.textContent = text;
      term.appendChild(li);
    }, i * 380)));
  }
  $("#backupBtn").addEventListener("click", play);
  onceVisible(term, play);
})();

// ───────── Lab: grounded answer ─────────
(() => {
  const lines = $$("#groundLab .g-line");
  let timers = [];
  function play() {
    timers.forEach(clearTimeout); timers = [];
    lines.forEach((l) => l.classList.remove("on", "struck"));
    lines.forEach((l, i) => timers.push(setTimeout(() => l.classList.add("on"), 250 + i * 650)));
    timers.push(setTimeout(() => $("#groundLab .g-line.bad").classList.add("struck"), 250 + lines.length * 650 + 400));
  }
  $("#groundBtn").addEventListener("click", play);
  onceVisible($("#groundLab"), play);
})();

// ───────── Lab: sync stream ─────────
(() => {
  const events = $$("#syncEvents li");
  let timers = [];
  function play() {
    timers.forEach(clearTimeout); timers = [];
    events.forEach((e) => e.classList.remove("on"));
    events.forEach((e, i) => timers.push(setTimeout(() => e.classList.add("on"), 250 + i * 600)));
  }
  $("#syncBtn").addEventListener("click", play);
  onceVisible($("#syncLab"), play);
})();

// ───────── Contact: POST /api/hire → mailto ─────────
(() => {
  const form = $("#hireForm");
  const resp = $("#apiResp");
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const json = (obj) => "{\n" + Object.entries(obj)
    .map(([k, v]) => `  <span class="k">"${k}"</span>: ${typeof v === "string" ? `"${esc(v)}"` : esc(JSON.stringify(v))}`)
    .join(",\n") + "\n}";

  form.addEventListener("input", (e) => e.target.closest(".api-field")?.classList.remove("invalid"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const missing = $$("input, textarea", form).filter((el) => !el.checkValidity());
    missing.forEach((el) => el.closest(".api-field").classList.add("invalid"));
    if (missing.length) {
      resp.innerHTML = `<span class="status-bad">422 Unprocessable Entity</span>\n` +
        json({ error: "validation_failed", fields: missing.map((el) => el.name) });
      missing[0].focus();
      return;
    }
    const f = Object.fromEntries(new FormData(form));
    resp.innerHTML = `<span class="status-ok">202 Accepted</span>\n` +
      json({ status: "queued", from: f.name, reply_within: "24h", next: "opening your mail app" });
    const subject = `[${f.type}] from ${f.name}`;
    const body = `${f.message}\n\n— ${f.name} <${f.email}>`;
    setTimeout(() => {
      window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }, 600);
  });
})();

// ───────── Command menu ─────────
(() => {
  const palette = $("#palette"), input = $("#paletteInput"), list = $("#paletteList");
  const goTo = (id) => () => document.getElementById(id).scrollIntoView();
  const openProj = (n) => () => {
    const proj = $$(".proj")[n];
    if (!proj.classList.contains("open")) proj.querySelector(".proj-row").click();
    proj.scrollIntoView();
  };
  const COMMANDS = [
    ["Work", "section", goTo("work")],
    ["BrandSecurer", "project", openProj(0)],
    ["Deal Engine", "project", openProj(1)],
    ["Deal Platform", "project", openProj(2)],
    ["Backupper", "project", openProj(3)],
    ["AI in production", "project", openProj(4)],
    ["Experience", "section", goTo("experience")],
    ["Send a request", "contact", goTo("contact")],
    ["Copy email", "action", copyEmail],
    ["Open GitHub", "link", () => window.open(CONFIG.github, "_blank", "noopener")],
    ["Download résumé", "file", () => $("#resumeLink").click()],
    ["Toggle theme", "T", toggleTheme],
  ];
  let shown = COMMANDS, sel = 0, lastFocus;

  function render() {
    const q = input.value.trim().toLowerCase();
    shown = COMMANDS.filter(([label]) => label.toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(shown.length - 1, 0));
    list.innerHTML = shown.length
      ? shown.map(([label, hint], i) => `<li class="${i === sel ? "sel" : ""}" data-i="${i}">${label}<span>${hint}</span></li>`).join("")
      : `<li>No results</li>`;
  }
  function open() { lastFocus = document.activeElement; palette.hidden = false; input.value = ""; sel = 0; render(); input.focus(); }
  function close() { palette.hidden = true; lastFocus?.focus?.(); }
  function run(i) { const c = shown[i]; if (c) { close(); c[2](); } }

  $("#paletteBtn").addEventListener("click", open);
  palette.addEventListener("click", (e) => { if (e.target === palette) close(); });
  list.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) run(+li.dataset.i); });
  list.addEventListener("mousemove", (e) => {
    const li = e.target.closest("li[data-i]");
    if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; render(); }
  });
  input.addEventListener("input", () => { sel = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (!shown.length && e.key !== "Escape") return;
    if (e.key === "ArrowDown") { sel = (sel + 1) % shown.length; render(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { sel = (sel - 1 + shown.length) % shown.length; render(); e.preventDefault(); }
    else if (e.key === "Enter") run(sel);
    else if (e.key === "Escape") close();
  });
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.hidden ? open() : close(); }
    else if (!typing && palette.hidden && e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !e.altKey) toggleTheme();
  });
})();
