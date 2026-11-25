# Volume Maxer & Booster

A plain HTML, CSS, and JavaScript Chrome extension that boosts the audio of the active tab with an explicit on/off control.

## Installation

1. Download or clone this repository.
2. Open Chromium in a version that supports `chrome.tabCapture.getMediaStreamId` and offscreen documents.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Choose **Load unpacked** and select this repository folder.
6. Pin **Volume Maxer & Booster** from the extensions menu if desired.

## Use

Open a webpage that is playing audio. Click the extension, turn on **Audio boost**, and move the slider. Boosting remains off until you explicitly enable it and is not retained as automatic behavior across tabs or browser sessions.

The slider ranges from `0%` to `200%`. `100%` is the original tab volume under this extension. Reset restores `100%`.

## Permissions

- `tabCapture`: capture audio only from the active tab after an explicit switch action.
- `offscreen`: host the Web Audio processing document in an extension service-worker environment.
- `storage`: reserved for local extension state. This version does not transmit data or preferences externally.

The extension does not request microphone permission, `tabs`, host permissions, or browsing-history access. It does not collect or send browsing, audio, or account data.

## Limitations

- Browser protected pages, extension pages, some embedded media, DRM pages, silent tabs, and unsupported Chromium builds cannot necessarily be captured.
- Tab capture can stop if playback ends, the tab closes or changes, or the browser revokes capture.
- This extension cannot bypass operating-system, browser, device, or speaker volume limits.
- Compatibility is not guaranteed and is not claimed until tested on a target Chromium build.

## Hearing safety

**Louder playback can damage hearing and speakers.** Start at `100%` and increase gradually. Use a safe listening level, take listening breaks, and stop if audio becomes distorted or uncomfortable. The hard slider limit is `200%`, but lower levels may still be harmful at high system volume.

## Manual test checklist

- [ ] Load the unpacked extension; no capture should start automatically.
- [ ] Open a silent tab and turn it on; a helpful “No audible playback” or unsupported-page message should appear.
- [ ] Open `chrome://extensions`; turning the switch on should show that protected browser pages cannot be captured.
- [ ] Play tab audio and enable the extension; volume should change smoothly.
- [ ] Slider can reach `0%` and `200%`, cannot exceed `200%`, and shows the exact percentage.
- [ ] Reset restores `100%`.
- [ ] Turn off and confirm tab audio continues at normal volume and no capture indicator remains active.
- [ ] Close or navigate the captured tab; capture should stop and status should explain what happened.
- [ ] Keyboard-tab through the switch, slider, and reset button; visible focus and control labels should be available.
- [ ] Test permission denial and confirm the switch turns off with a permission explanation.
