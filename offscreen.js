let context = null;
let source = null;
let gain = null;
let stream = null;

async function stopCapture() {
  if (source) { try { source.disconnect(); } catch (_) {} source = null; }
  if (gain) { try { gain.disconnect(); } catch (_) {} gain = null; }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  if (context) {
    try { await context.close(); } catch (_) {}
    context = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === 'startCapture') {
      await stopCapture();
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: message.streamId
            }
          },
          video: false
        });
        if (!stream.getAudioTracks().length) throw new Error('No tab audio track is available.');

        context = new AudioContext();
        gain = context.createGain();
        gain.gain.setValueAtTime(Math.max(0, Math.min(2, Number(message.volume) / 100)), context.currentTime);
        source = context.createMediaStreamSource(stream);
        source.connect(gain).connect(context.destination);
        await context.resume();
        sendResponse({ ok: true });
      } catch (error) {
        await stopCapture();
        sendResponse({ ok: false, error: error.message || 'Unable to start tab audio capture.' });
      }
      return;
    }

    if (message.type === 'setVolume') {
      const value = Math.max(0, Math.min(2, Number(message.volume) / 100));
      if (context && gain) gain.gain.setTargetAtTime(value, context.currentTime, 0.035);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'stopCapture') {
      await stopCapture();
      sendResponse({ ok: true });
    }
  })();
  return true;
});
