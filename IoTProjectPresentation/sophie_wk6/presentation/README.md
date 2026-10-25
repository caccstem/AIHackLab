# Luma — three-slide introduction

Open `index.html` directly in Safari or Chrome. This presentation is standalone and works offline; the Python server and boards are not needed. The app server only serves app files, so open this presentation directly from Finder (or via Live Server).

Click **Present** for one slide at a time. Use the arrow buttons or keyboard arrows to navigate, Escape to return to all slides, and **Print / PDF** to export. In the print dialog, choose landscape, turn on background graphics if available, and turn off browser headers and footers.

The pictures are SVG illustrations recreated from the current dashboard layout, not screenshots or live readings. Their numbers match the labels on slide 2. No ultrasonic sensor, fan, speaker or keypad functionality is claimed: those are not integrated in the current app.

## Suggested speaking notes

1. **Meet Luma:** “My project brings three ESP32 boards into one dashboard. I can monitor temperature and humidity and control four colored lights on each board, instead of opening individual API links.”
2. **Interface tour:** “The overview summarizes responding boards. Each sensor card shows readings and a temperature history. In Lights, I choose a board and use the same four color tiles. There is also one button to turn off lights on every board.”
3. **How it works:** “My laptop connects to the same Wi-Fi as the boards. A small Python server passes requests between the page and the devices. Sensor readings refresh automatically, and light commands are sent when I click. The interface reports failures, and its light indicators track accepted commands rather than actual measured light status.”
