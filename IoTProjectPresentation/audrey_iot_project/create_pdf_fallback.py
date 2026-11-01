from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "ESP_Control_Room_Presentation.pdf"
SHOT = ROOT / "artifacts" / "website-overview.png"
W, H = 1600, 900


def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(f"/usr/share/fonts/truetype/dejavu/{name}", size)


def slide():
    return Image.new("RGB", (W, H), "#f7f1e3")


pages = []
p = slide(); d = ImageDraw.Draw(p)
d.text((70, 55), "ESP CONTROL ROOM  /  WEBSITE OVERVIEW", font=font(20, True), fill="#53695e")
d.line((70, 95, 1530, 95), fill="#c6d3c1", width=2)
d.text((75, 135), "One control room for\nthree ESP32 boards.", font=font(52, True), fill="#19372d", spacing=4)
d.text((78, 290), "Monitor each device, open a component, and make changes\nfrom a single browser dashboard.", font=font(24), fill="#53695e", spacing=8)
shot = Image.open(SHOT).convert("RGB").resize((835, 580))
p.paste(shot, (690, 150))
for y, title, body in [
    (440, "1  At-a-glance status", "Connectivity, climate, and headline readings"),
    (545, "2  Direct component access", "Open LEDs, climate, and board-specific tools"),
    (650, "3  Local-network control", "Configure addresses and send Wi-Fi commands"),
]:
    d.text((80, y), title, font=font(23, True), fill="#19372d")
    d.text((110, y + 40), body, font=font(18), fill="#53695e")
pages.append(p)

p = slide(); d = ImageDraw.Draw(p)
d.text((70, 55), "ESP CONTROL ROOM  /  CORE CAPABILITIES", font=font(20, True), fill="#53695e")
d.line((70, 95, 1530, 95), fill="#c6d3c1", width=2)
d.text((75, 135), "Each board adds a focused interaction.", font=font(46, True), fill="#19372d")
d.text((78, 205), "Shared climate monitoring and four-color LED controls stay consistent.", font=font(23), fill="#53695e")
cards = [
    (75, "ESP32 — 01", "SOUND + COMPOSITION", "#77e5aa", ["Build melodies on a C3–B5 piano", "Set note lengths, dotted notes and ties", "Play, edit, copy and save tunes"]),
    (570, "ESP32 — 02", "MOTION + DISTANCE", "#efb84d", ["Read ultrasonic distance", "Move the servo from 0° to 180°", "Release the servo from the UI"]),
    (1065, "ESP32 — 03", "INPUT MONITORING", "#63bddd", ["Show the currently held key", "Remember the latest keypad input", "Refresh readings every five seconds"]),
]
for x, title, sub, color, bullets in cards:
    d.rounded_rectangle((x, 295, x + 450, 720), radius=28, fill="#fffaf1", outline="#c6d3c1", width=2)
    d.rounded_rectangle((x + 30, 330, x + 90, 390), radius=14, fill=color)
    d.text((x + 115, 325), title, font=font(27, True), fill="#19372d")
    d.text((x + 115, 365), sub, font=font(16, True), fill="#53695e")
    by = 455
    for item in bullets:
        d.ellipse((x + 38, by + 7, x + 53, by + 22), fill=color)
        d.multiline_text((x + 72, by), item, font=font(19), fill="#19372d", spacing=5)
        by += 83
d.text((75, 795), "SEE STATUS  →  SELECT COMPONENT  →  CONTROL OR READ", font=font(23, True), fill="#234f3f")
pages.append(p)

for index, page in enumerate(pages, 1):
    page.save(ROOT / f"ESP_Control_Room_Slide_{index}.png")
pages[0].save(OUT, save_all=True, append_images=pages[1:], resolution=144)
print(OUT)
