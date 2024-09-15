// background.js
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({isEnabled: true});
  });
  
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com")) {
      chrome.storage.sync.get('isEnabled', function(data) {
        chrome.tabs.sendMessage(tabId, {
          action: "toggleExtension",
          isEnabled: data.isEnabled !== false
        });
      });
    }
  });