# Manual test suite

1. Fresh install: open the popup and verify that the switch is off and volume is 100%.
2. New tab: verify no audio capture indicator or gain processing starts.
3. Slider lower bound: set 0%, verify readout and gain clamp at 0.
4. Slider upper bound: set 200%, verify readout and gain clamp at 200.
5. Keyboard: tab to switch, slider, and reset; press Space/arrow keys as appropriate.
6. Capture: play audio on a regular webpage, enable, and verify audible output changes gradually.
7. Permission denial: deny or cancel browser capture and verify a clear error and switch-off state.
8. Unsupported page: try a Chrome protected page and verify a clear unsupported-page message.
9. Missing audio: open a silent tab and enable; verify a helpful missing-audio message.
10. Reset: while active or off, reset to 100% and verify readout.
11. Disable: turn off and verify the original playback level resumes and tracks/AudioContext stop.
12. Tab close/navigation: close or navigate away and verify cleanup/no stale active state.
