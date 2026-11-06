// Your details. Anything left empty is hidden from the page.
const CONFIG = {
  email: "",    // TODO: the address the contact form sends to
  linkedin: "", // TODO: https://www.linkedin.com/in/your-handle
  github: "https://github.com/Meraj-7002",
  resume: "",   // TODO: add the PDF to this folder, then set "resume.pdf"
};

const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Links
$$("[data-link]").forEach((a) => {
  const url = CONFIG[a.dataset.link];
  if (url) a.href = url;
  else a.hidden = true;
});

const emailLink = document.getElementById("emailLink");
const copyBtn = document.getElementById("copyBtn");
if (CONFIG.email) {
  emailLink.textContent = CONFIG.email;
  emailLink.href = `mailto:${CONFIG.email}`;
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(CONFIG.email);
      copyBtn.textContent = "Copied";
    } catch {
      copyBtn.textContent = "Couldn't copy";
    }
    setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
  });
} else {
  $$('[data-needs="email"]').forEach((el) => (el.hidden = true));
}

// Contact: POST /api/hire/meraj, delivered through the visitor's mail app
const form = document.getElementById("hireForm");
const resp = document.getElementById("apiResp");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const json = (obj) => "{\n" + Object.entries(obj)
  .map(([k, v]) => `  <span class="k">"${k}"</span>: ${typeof v === "string" ? `"${esc(v)}"` : esc(JSON.stringify(v))}`)
  .join(",\n") + "\n}";

form.addEventListener("input", (e) => e.target.closest(".api-field")?.classList.remove("invalid"));

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const invalid = $$("input, textarea", form).filter((el) => !el.checkValidity());
  $$(".api-field", form).forEach((f) => f.classList.remove("invalid"));
  invalid.forEach((el) => el.closest(".api-field").classList.add("invalid"));
  if (invalid.length) {
    resp.innerHTML = `<span class="bad">422 Unprocessable Entity</span>\n` +
      json({ error: "validation_failed", fields: invalid.map((el) => el.name) });
    invalid[0].focus();
    return;
  }
  if (!CONFIG.email) {
    resp.innerHTML = `<span class="bad">503 Service Unavailable</span>\n` + json({ error: "inbox_not_configured" });
    return;
  }
  const f = Object.fromEntries(new FormData(form));
  resp.innerHTML = `<span class="ok">202 Accepted</span>\n` +
    json({ status: "draft_ready", to: CONFIG.email, next: "opening your mail app" });
  const subject = `[${f.type}] from ${f.name}`;
  const body = `${f.message}\n\n${f.name} <${f.email}>`;
  setTimeout(() => {
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, 600);
});
