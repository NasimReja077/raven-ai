// ─── Extension popup.js (complete rewrite) ───────────────────────────────────

const DEFAULT_API = "http://localhost:5000/api";

function getApiUrl() {
  return localStorage.getItem("raven-api-url") || DEFAULT_API;
}

const $ = (id) => document.getElementById(id);
const show = (el) => { if (el) el.style.display = "block"; };
const hide = (el) => { if (el) el.style.display = "none"; };

async function storedToken() {
  return new Promise((res) =>
    chrome.storage.local.get(["accessToken", "apiUrl"], (r) => {
      if (r.apiUrl) window.__ravenApiUrl = r.apiUrl;
      res(r.accessToken ?? null);
    })
  );
}

function apiUrl() {
  return window.__ravenApiUrl || DEFAULT_API;
}

async function doRefresh() {
  try {
    const r = await fetch(`${apiUrl()}/auth/refresh-token`, {
      method: "POST", credentials: "include",
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.accessToken) {
      chrome.storage.local.set({ accessToken: d.accessToken });
      return d.accessToken;
    }
  } catch {}
  return null;
}

async function getUser(token) {
  try {
    const r = await fetch(`${apiUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.data?.user ?? null;
  } catch { return null; }
}

async function savePage(url, note, token) {
  const r = await fetch(`${apiUrl()}/saves`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    credentials: "include",
    body: JSON.stringify({ url, userNote: note }),
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.message || "Save failed"); }
  return r.json();
}

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const titleEl = $("page-title");
  const urlEl   = $("page-url");
  if (titleEl) titleEl.textContent = tab.title || tab.url;
  if (urlEl)   urlEl.textContent = tab.url;

  let token = await storedToken();
  if (!token) token = await doRefresh();
  if (!token) {
    show($("login-state"));
    const badge = $("user-badge");
    if (badge) badge.textContent = "Not logged in";
    return;
  }

  let user = await getUser(token);
  if (!user) {
    token = await doRefresh();
    if (token) user = await getUser(token);
  }
  if (!user) {
    show($("login-state"));
    return;
  }

  const badge = $("user-badge");
  if (badge) badge.textContent = user.username ?? "Logged in";
  show($("save-state"));

  const btn    = $("save-btn");
  const errEl  = $("error-msg");
  const noteEl = $("note");

  if (btn) btn.addEventListener("click", async () => {
    const note = noteEl?.value?.trim() ?? "";
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving…';
    if (errEl) errEl.style.display = "none";
    try {
      await savePage(tab.url, note, token);
      hide($("save-state"));
      show($("success-state"));
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.style.display = "block"; }
      btn.disabled = false;
      btn.textContent = "Save to Raven";
    }
  });
})();
