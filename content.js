// content.js
(() => {
  let isHovered = false;
  let isEnabled = true;
  const ENFORCE_INTERVAL = 50; // ms

  const audioContexts = new WeakMap();

  function createAudioContext(mediaElement) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(mediaElement);
    const gain = audioCtx.createGain();
    source.connect(gain);
    gain.connect(audioCtx.destination);
    return { audioCtx, gain };
  }

  function forceMuteState(video) {
    if (!isEnabled) return;

    if (!audioContexts.has(video)) {
      audioContexts.set(video, createAudioContext(video));
    }
    const { gain } = audioContexts.get(video);
    
    if (isHovered) {
      gain.gain.setValueAtTime(1, gain.context.currentTime);
      video.muted = false;
    } else {
      gain.gain.setValueAtTime(0, gain.context.currentTime);
      video.muted = true;
    }
  }

  function updateMuteState() {
    document.querySelectorAll('video').forEach(video => {
      if (isEnabled) {
        forceMuteState(video);
      } else {
        // When disabled, reset to original state
        if (audioContexts.has(video)) {
          const { gain } = audioContexts.get(video);
          gain.gain.setValueAtTime(1, gain.context.currentTime);
          video.muted = false;  // Unmute the video when disabled
        }
      }
    });
  }

  function handleMouseEnter() {
    isHovered = true;
    if (isEnabled) {
      updateMuteState();
    }
  }

  function handleMouseLeave() {
    isHovered = false;
    if (isEnabled) {
      updateMuteState();
    }
  }

  document.addEventListener('mouseenter', handleMouseEnter);
  document.addEventListener('mouseleave', handleMouseLeave);

  // Continuously enforce mute state
  setInterval(updateMuteState, ENFORCE_INTERVAL);

  // Intercept video element creation
  const originalCreateElement = document.createElement;
  document.createElement = function() {
    const element = originalCreateElement.apply(this, arguments);
    if (arguments[0].toLowerCase() === 'video') {
      element.addEventListener('loadedmetadata', () => forceMuteState(element), { once: true });
    }
    return element;
  };

  // Catch play events
  document.addEventListener('play', function(e) {
    if (e.target instanceof HTMLVideoElement) {
      forceMuteState(e.target);
    }
  }, true);

  // Override volume and muted setters
  const originalVolumeSetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume').set;
  const originalMutedSetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'muted').set;

  Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
    set: function(value) {
      originalVolumeSetter.call(this, value);
      if (isEnabled && !isHovered) {
        forceMuteState(this);
      }
    }
  });

  Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
    set: function(value) {
      if (isEnabled && !isHovered) {
        originalMutedSetter.call(this, true);
      } else {
        originalMutedSetter.call(this, value);
      }
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "toggleExtension") {
      isEnabled = request.isEnabled;
      updateMuteState();
    }
  });

  // Initial setup
  updateMuteState();
})();