let activeTabId = null;
let volume = 100;
let enabled = false;
let status = 'Off. Click the switch to enable.';

async function restoreState() {
  try {
    const saved = await chrome.storage.session.get(['activeTabId', 'volume', 'enabled', 'status']);
    activeTabId = Number.isInteger(saved.activeTabId) ? saved.activeTabId : null;
    volume = Number.isFinite(saved.volume) ? Math.max(0, Math.min(200, saved.volume)) : 100;
    enabled = Boolean(saved.enabled);
    status = saved.status || (enabled ? 'Active on the current tab.' : 'Off. Click the switch to enable.');
  } catch (error) {
    console.error('[Volume Maxer] Could not restore session state:', error);
  }
}

const stateReady = restoreState();

async function persistState() {
  try {
    await chrome.storage.session.set({ activeTabId, volume, enabled, status });
  } catch (error) {
    console.error('[Volume Maxer] Could not persist session state:', error);
  }
}

async function getOffscreenContexts() {
  return chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });
}

async function ensureOffscreen() {
  const contexts = await getOffscreenContexts();
  if (contexts.length) return;

  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Process the active tab audio with a Web Audio gain node.'
    });
  } catch (error) {
    // Another start request may have created the document in the meantime.
    if (!(await getOffscreenContexts()).length) throw error;
  }
}

async function sendToOffscreen(message) {
  const contexts = await getOffscreenContexts();
  if (!contexts.length) {
    throw new Error('The audio processing document is not running. Turn audio boost off and on to reconnect.');
  }

  try {
    const response = await chrome.runtime.sendMessage(message);
    if (!response) throw new Error('The audio processing document did not respond.');
    return response;
  } catch (error) {
    console.error(`[Volume Maxer] Offscreen message failed (${message.type}):`, error);
    throw error;
  }
}

async function closeOffscreen() {
  // Discover the document every time; worker-local flags are lost on suspension.
  const contexts = await getOffscreenContexts();
  if (!contexts.length) return;

  try {
    await chrome.offscreen.closeDocument();
  } catch (error) {
    console.error('[Volume Maxer] Could not close the audio processing document:', error);
  }
}

async function stopCapture() {
  enabled = false;
  try {
    if ((await getOffscreenContexts()).length) {
      await sendToOffscreen({ type: 'stopCapture' });
    }
  } catch (error) {
    console.error('[Volume Maxer] Error stopping audio capture:', error);
  }
  await closeOffscreen();
  activeTabId = null;
}

function describeCaptureError(error) {
  const message = String(error?.message || error || 'Unknown error');
  if (/permission|denied/i.test(message)) {
    return 'Capture permission was denied. Allow the browser prompt and try again.';
  }
  if (/no tab audio|no audio|not playing|audio track/i.test(message)) {
    return 'No audible playback was found. Start or unmute audio on this page, then try again.';
  }
  if (/not running|did not respond|receiving end/i.test(message)) {
    return 'The audio processor is not responding. Turn Audio boost off and on to reconnect.';
  }
  return `Could not start audio capture: ${message}`;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !['getState', 'setVolume', 'disable', 'enable'].includes(message.type)) return false;

  (async () => {
    await stateReady;
    try {
      if (message.type === 'getState') {
        sendResponse({ enabled, volume, status });
        return;
      }

      if (message.type === 'setVolume') {
        volume = Math.max(0, Math.min(200, Number(message.volume) || 0));
        if (enabled) {
          const response = await sendToOffscreen({ type: 'setVolume', volume });
          if (!response.ok) throw new Error(response.error || 'The audio processor rejected the volume change.');
        }
        await persistState();
        sendResponse({ ok: true });
        return;
      }

      if (message.type === 'disable') {
        await stopCapture();
        status = 'Off. Audio capture stopped.';
        await persistState();
        sendResponse({ ok: true });
        return;
      }

      if (message.type === 'enable') {
        await stopCapture();
        volume = Math.max(0, Math.min(200, Number(message.volume) || 100));

        let tabs;
        try {
          tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        } catch (error) {
          console.error('[Volume Maxer] Could not query the active tab:', error);
          status = 'Unable to access the active tab. Check the browser extension permissions and try again.';
          await persistState();
          sendResponse({ error: status });
          return;
        }

        const tab = tabs[0];
        if (!tab || tab.id == null) {
          status = 'No active tab was found. Open a webpage and try again.';
          await persistState();
          sendResponse({ error: status });
          return;
        }
        if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('edge://')) {
          status = 'This browser page cannot be captured. Open a regular webpage and try again.';
          await persistState();
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

          const response = await sendToOffscreen({ type: 'startCapture', streamId, volume });
          if (!response.ok) throw new Error(response.error || 'The audio processor could not start capture.');
          enabled = true;
          status = 'Active on the current tab.';
          await persistState();
          sendResponse({ ok: true });
        } catch (error) {
          console.error('[Volume Maxer] Audio capture startup failed:', error);
          await stopCapture();
          status = describeCaptureError(error);
          await persistState();
          sendResponse({ error: status });
        }
      }
    } catch (error) {
      console.error(`[Volume Maxer] Request failed (${message.type}):`, error);
      status = message.type === 'setVolume'
        ? 'Could not apply the volume change. The audio processor may have disconnected; turn Audio boost off and on to reconnect.'
        : 'The extension encountered an error. Check the extension service-worker console for details.';
      await persistState();
      sendResponse({ error: status });
    }
  })();

  return true;
});

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId !== activeTabId) return;
  stopCapture()
    .then(async () => {
      status = 'Off. The tab closed and capture stopped.';
      await persistState();
    })
    .catch(error => console.error('[Volume Maxer] Cleanup after tab close failed:', error));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Ignore title, favicon, loading, and other updates; only navigation changes stop capture.
  if (tabId !== activeTabId || typeof changeInfo.url !== 'string') return;
  stopCapture()
    .then(async () => {
      status = 'Off. Audio capture stopped because the tab navigated.';
      await persistState();
    })
    .catch(error => console.error('[Volume Maxer] Cleanup after tab navigation failed:', error));
});
