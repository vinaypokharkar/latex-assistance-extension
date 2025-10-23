// Background service worker to enable opening the side panel on action click
// Must be a user gesture to open the panel; clicking the action icon qualifies.

// On install, configure action click to toggle the side panel entry
chrome.runtime.onInstalled.addListener(() => {
  // Ensure clicking the toolbar icon shows the extension in the side panel
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((e) => {
      // swallow in dev if API not available
      console.warn("sidePanel.setPanelBehavior failed", e)
    })
  }
})

// Fallback: if we want to programmatically open the side panel when the
// user clicks the action icon, respond to the click and call sidePanel.open.
chrome.action.onClicked.addListener(async (tab) => {
  // Try to open a tab-specific side panel first; fall back to window
  try {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      if (tab && tab.id) {
        await chrome.sidePanel.open({ tabId: tab.id })
      } else if (tab && tab.windowId) {
        await chrome.sidePanel.open({ windowId: tab.windowId })
      } else {
        // Last resort: open for the current window
        const win = await chrome.windows.getCurrent()
        await chrome.sidePanel.open({ windowId: win.id })
      }
    }
  } catch (err) {
    console.warn("Unable to open side panel programmatically", err)
  }
})
