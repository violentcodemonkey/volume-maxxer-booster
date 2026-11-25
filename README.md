# Volume Maxer & Booster

A plain HTML, CSS, and JavaScript Chromium extension that adjusts audio from the active tab after you explicitly turn it on.

<p align="center">
  <a href="https://github.com/violentcodemonkey/volume-maxxer-booster/archive/refs/heads/main.zip"><strong>⬇ Download the extension ZIP</strong></a>
</p>

## Install in Chromium

1. Click **Download the extension ZIP** above and extract the archive to a folder.
2. Open `chrome://extensions` in a Chromium browser and enable **Developer mode**.
3. Click **Load unpacked** and select the extracted `volume-maxxer-booster-main` folder (the folder containing `manifest.json`).
4. Pin **Volume Maxer & Booster** from the extensions menu if desired.
5. Open a regular webpage with audio, click the extension, then explicitly enable **Audio boost**.

The ZIP link downloads GitHub's source archive of the `main` branch, not a store-installed package. No browser compatibility is claimed; behavior has not been tested across Chromium versions.

## Use

The slider ranges from `0%` to `200%`. `100%` is the original tab audio level. **Reset to 100%** returns the slider to normal. Boosting starts off and is never enabled automatically after installation or on a new tab.

## Permissions

- `tabCapture`: captures audio from the active tab after an explicit user action.
- `offscreen`: hosts the Web Audio processing page needed to handle capture outside the popup.

The extension does not request microphone access, host permissions, or browsing-history access. Audio is processed locally and is not recorded or sent anywhere.

## Limitations

Protected browser pages, extension pages, DRM content, some embedded media, silent tabs, and unsupported browser builds may not be capturable. Capture stops when disabled or when the captured tab closes or navigates. This extension cannot bypass operating-system, browser, device, or speaker volume limits.

## Hearing safety

**Louder playback can damage hearing or speakers.** Start at 100%, increase gradually, keep system volume at a safe level, and stop if sound is uncomfortable or distorted. The 200% limit is a hard ceiling, not a recommended listening level.

## Testing

Follow the [manual test checklist](TESTING.md) to verify install defaults, slider bounds, keyboard access, reset, capture errors, and cleanup. Testing must be performed in the target Chromium build before claiming compatibility.
