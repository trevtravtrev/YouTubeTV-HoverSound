// popup.js
document.addEventListener('DOMContentLoaded', function() {
    var toggleSwitch = document.getElementById('toggleExtension');
  
    // Load saved state
    chrome.storage.sync.get('isEnabled', function(data) {
      toggleSwitch.checked = data.isEnabled !== false;
    });
  
    toggleSwitch.addEventListener('change', function() {
      var isEnabled = this.checked;
      chrome.storage.sync.set({isEnabled: isEnabled});
      
      // Send message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleExtension", isEnabled: isEnabled});
      });
    });
  });