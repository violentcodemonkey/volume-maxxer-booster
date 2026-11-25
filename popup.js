const enabled = document.querySelector('#enabled');
const volume = document.querySelector('#volume');
const readout = document.querySelector('#readout');
const reset = document.querySelector('#reset');
const status = document.querySelector('#status');

function setStatus(message) {
  status.textContent = message;
}

async function refresh() {
  const state = await chrome.runtime.sendMessage({ type: 'getState' });
  enabled.checked = Boolean(state?.enabled);
  volume.value = String(state?.volume ?? 100);
  readout.textContent = `${volume.value}%`;
  setStatus(state?.status || (enabled.checked ? 'Active.' : 'Off.'));
}

enabled.addEventListener('change', async () => {
  setStatus(enabled.checked ? 'Starting audio capture…' : 'Turning off…');
  const response = await chrome.runtime.sendMessage({
    type: enabled.checked ? 'enable' : 'disable',
    volume: Number(volume.value)
  });
  if (response?.error) setStatus(response.error);
  await refresh();
});

volume.addEventListener('input', async () => {
  const value = Math.max(0, Math.min(200, Number(volume.value)));
  volume.value = String(value);
  readout.textContent = `${value}%`;
  await chrome.runtime.sendMessage({ type: 'setVolume', volume: value });
});

reset.addEventListener('click', async () => {
  volume.value = '100';
  readout.textContent = '100%';
  await chrome.runtime.sendMessage({ type: 'setVolume', volume: 100 });
  setStatus('Reset to 100%.');
});

refresh().catch(() => setStatus('Unable to read extension status.'));
