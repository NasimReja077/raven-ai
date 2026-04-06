// extension/content.js
// Runs on the Raven web app page.
// The web app calls: window.postMessage({ type: 'RAVEN_TOKEN', token, apiUrl, appUrl }, '*')
// This script relays it to the extension background.

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "RAVEN_TOKEN") return;
  chrome.runtime.sendMessage({
    type: "RAVEN_SET_TOKEN",
    token:  event.data.token,
    apiUrl: event.data.apiUrl,
    appUrl: event.data.appUrl,
  }, () => {
    // Ignore "receiving end does not exist" errors
    void chrome.runtime.lastError;
  });
});
