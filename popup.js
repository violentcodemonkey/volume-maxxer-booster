const enabled = document.querySelector('#enabled');
const volume = document.querySelector('#volume');
const readout = document.querySelector('#readout');
const reset = document.querySelector('#reset');
const status = document.querySelector('#status');

function setStatus(message) {
  status.textContent = message;
}

async function sendMessage(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.error(`[Volume Maxer] Could not send ${message.type} message:`, error);
    setStatus('Could not communicate with the extension. Try reloading it.');
    return null;
  }
}

async function refresh() {
  const state = await sendMessage({ type: 'getState' });
  if (!state) return;
  enabled.checked = Boolean(state.enabled);
  volume.value = String(state.volume ?? 100);
  readout.textContent = `${volume.value}%`;
  setStatus(state.status || (enabled.checked ? 'Active.' : 'Off.'));
}

enabled.addEventListener('change', async () => {
  setStatus(enabled.checked ? 'Starting audio capture…' : 'Turning off…');
  const response = await sendMessage({
    type: enabled.checked ? 'enable' : 'disable',
    volume: Number(volume.value)
  });
  if (!response) return;
  if (response.error) setStatus(response.error);
  await refresh();
});

volume.addEventListener('input', async () => {
  const value = Math.max(0, Math.min(200, Number(volume.value)));
  volume.value = String(value);
  readout.textContent = `${value}%`;
  const response = await sendMessage({ type: 'setVolume', volume: value });
  if (response?.error) setStatus(response.error);
});

reset.addEventListener('click', async () => {
  volume.value = '100';
  readout.textContent = '100%';
  const response = await sendMessage({ type: 'setVolume', volume: 100 });
  if (!response) return;
  if (response.error) setStatus(response.error);
  else setStatus('Reset to 100%.');
});

refresh();
