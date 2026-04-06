const API = "http://localhost:5000/api";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "raven-save",
    title: "Save to Raven AI 🐦",
    contexts: ["page", "link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "raven-save") return;
  const url = info.linkUrl || tab?.url;
  if (!url) return;
  const { accessToken } = await chrome.storage.local.get("accessToken");
  if (!accessToken) { chrome.tabs.create({ url: "http://localhost:5173/login" }); return; }
  try {
    const r = await fetch(`${API}/saves`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      credentials: "include",
      body: JSON.stringify({ url }),
    });
    if (r.ok) {
      chrome.action.setBadgeText({ text: "✓", tabId: tab?.id });
      chrome.action.setBadgeBackgroundColor({ color: "#16a34a" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
    }
  } catch {}
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "RAVEN_SET_TOKEN" && msg.token) {
    chrome.storage.local.set({ accessToken: msg.token });
  }
});
