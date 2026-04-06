// extension/background.js
const DEFAULT_API = "http://localhost:5000/api";

async function getApiUrl() {
  const { apiUrl } = await chrome.storage.local.get("apiUrl");
  return apiUrl || DEFAULT_API;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "raven-save-page",
    title: "Save page to Raven AI 🐦",
    contexts: ["page"],
  });
  chrome.contextMenus.create({
    id: "raven-save-link",
    title: "Save link to Raven AI 🐦",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!["raven-save-page", "raven-save-link"].includes(info.menuItemId)) return;
  const url = info.linkUrl || tab?.url;
  if (!url) return;

  const { accessToken } = await chrome.storage.local.get("accessToken");
  const API = await getApiUrl();

  if (!accessToken) {
    // Open login page
    const { appUrl } = await chrome.storage.local.get("appUrl");
    chrome.tabs.create({ url: `${appUrl || "http://localhost:5173"}/login` });
    return;
  }

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
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
    } else {
      chrome.action.setBadgeText({ text: "✗", tabId: tab?.id });
      chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
    }
  } catch (err) {
    console.error("Raven save error:", err);
  }
});

// Token bridge: receives token from the web app
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "RAVEN_SET_TOKEN") {
    chrome.storage.local.set({
      accessToken: msg.token,
      apiUrl: msg.apiUrl || DEFAULT_API,
      appUrl: msg.appUrl || "http://localhost:5173",
    });
    sendResponse({ ok: true });
  }
  return true;
});
