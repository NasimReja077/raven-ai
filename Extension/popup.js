const API = "http://localhost:5000/api";
const $ = (id) => document.getElementById(id);
const show = (id) => { $(id).style.display = "block"; };
const hide = (id) => { $(id).style.display = "none"; };

async function getToken() {
  return new Promise((res) => chrome.storage.local.get("accessToken", (r) => res(r.accessToken ?? null)));
}

async function refreshToken() {
  try {
    const r = await fetch(`${API}/auth/refresh-token`, { method: "POST", credentials: "include" });
    if (!r.ok) return null;
    const data = await r.json();
    if (data.accessToken) { chrome.storage.local.set({ accessToken: data.accessToken }); return data.accessToken; }
  } catch {}
  return null;
}

async function getMe(token) {
  try {
    const r = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
    if (!r.ok) return null;
    const data = await r.json();
    return data.data?.user ?? null;
  } catch { return null; }
}

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $("page-title").textContent = tab.title || tab.url;
  $("page-url").textContent = tab.url;

  let token = await getToken();
  if (!token) token = await refreshToken();
  if (!token) { show("login-state"); $("user-badge").textContent = "Not logged in"; return; }

  const user = await getMe(token);
  if (!user) {
    token = await refreshToken();
    if (!token) { show("login-state"); $("user-badge").textContent = "Not logged in"; return; }
  }

  $("user-badge").textContent = user?.username ?? "Logged in";
  show("save-state");

  $("save-btn").addEventListener("click", async () => {
    const btn = $("save-btn");
    const errEl = $("error-msg");
    const note = $("note").value.trim();
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Saving…';
    errEl.style.display = "none";
    try {
      const r = await fetch(`${API}/saves`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ url: tab.url, userNote: note }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message || "Save failed"); }
      hide("save-state");
      show("success-state");
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Save to Raven";
    }
  });
})();
