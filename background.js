let offscreenCreated = false;
let activeTabId = null;
let volume = 100;
let enabled = false;
let status = 'Off. Click the switch to enable.';

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });
  if (contexts.length) {
    offscreenCreated = true;
    return;
  }
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Process the active tab audio with a Web Audio gain node.'
  });
  offscreenCreated = true;
}

async function closeOffscreen() {
  if (!offscreenCreated) return;
  try { await chrome.offscreen.closeDocument(); } catch (_) {}
  offscreenCreated = false;
}

async function stopCapture() {
  enabled = false;
  try { await chrome.runtime.sendMessage({ type: 'stopCapture' }); } catch (_) {}
  await closeOffscreen();
  activeTabId = null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === 'getState') {
      sendResponse({ enabled, volume, status });
      return;
    }

    if (message.type === 'setVolume') {
      volume = Math.max(0, Math.min(200, Number(message.volume) || 0));
      if (enabled) await chrome.runtime.sendMessage({ type: 'setVolume', volume });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'disable') {
      await stopCapture();
      status = 'Off. Audio capture stopped.';
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'enable') {
      await stopCapture();
      volume = Math.max(0, Math.min(200, Number(message.volume) || 100));

      let tabs;
      try {
        tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      } catch (_) {
        status = 'Unable to access the active tab.';
        sendResponse({ error: status });
        return;
      }

      const tab = tabs[0];
      if (!tab || tab.id == null) {
        status = 'No active tab was found.';
        sendResponse({ error: status });
        return;
      }
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://')) {
        status = 'This browser page cannot be captured. Open a regular webpage and try again.';
        sendResponse({ error: status });
        return;
      }

      activeTabId = tab.id;
      try {
        await ensureOffscreen();
        const streamId = await new Promise((resolve, reject) => {
          chrome.tabCapture.getMediaStreamId({ consumerTabId: tab.id, targetTabId: tab.id }, id => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else if (!id) reject(new Error('No capture stream was returned.'));
            else resolve(id);
          });
        });

        const response = await chrome.runtime.sendMessage({ type: 'startCapture', streamId, volume });
        if (!response?.ok) throw new Error(response?.error || 'Audio capture could not start.');
        enabled = true;
        status = 'Active on the current tab.';
        sendResponse({ ok: true });
      } catch (error) {
        await stopCapture();
        const messageText = String(error?.message || '');
        if (/permission|denied/i.test(messageText)) {
          status = 'Capture permission was denied. Allow the prompt and try again.';
        } else if (/No tab audio|no audio|not playing/i.test(messageText)) {
          status = 'No audible playback was found. Start or unmute audio on this page, then try again.';
        } else {
          status = 'Capture error. The page may be unsupported or already inaccessible.';
        }
        sendResponse({ error: status });
      }
    }
  })();
  return true;
});

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === activeTabId) stopCapture().then(() => { status = 'Off. The tab closed and capture stopped.'; });
});

chrome.tabs.onUpdated.addListener(tabId => {
  if (tabId === activeTabId) stopCapture().then(() => { status = 'Off. Audio capture stopped because the tab changed.'; });
});
