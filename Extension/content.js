window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "RAVEN_TOKEN") return;
  chrome.runtime.sendMessage({ type: "RAVEN_SET_TOKEN", token: event.data.token });
});
