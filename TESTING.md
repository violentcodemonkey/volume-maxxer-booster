# Manual test suite

1. Fresh install: open the popup and verify the switch is off and volume is 100%.
2. New tab: verify no audio capture or gain processing starts automatically.
3. Slider lower bound: set 0%, verify the readout and gain clamp at 0.
4. Slider upper bound: set 200%, verify the readout and gain clamp at 200.
5. Keyboard: tab to switch, slider, and reset; use Space and arrow keys as appropriate.
6. Capture: play audio on a regular webpage, enable, and verify audible output changes gradually.
7. Permission denial: deny or cancel capture and verify a clear error and switch-off state.
8. Unsupported page: try a protected browser page and verify an unsupported-page message.
9. Missing audio: try a silent tab and verify that capture failures are explained helpfully.
10. Reset: while active or off, reset to 100% and verify the readout.
11. Disable: turn off and verify playback resumes at the normal tab level and tracks/AudioContext stop.
12. Tab close/navigation: close or navigate the captured tab and verify cleanup/no stale active state.
