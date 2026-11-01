from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "ESP_Control_Room_Presentation.pptx"
SCREENSHOT = ROOT / "artifacts" / "website-overview.png"

GREEN = RGBColor(25, 55, 45)
DEEP = RGBColor(35, 79, 63)
MINT = RGBColor(119, 229, 170)
CREAM = RGBColor(247, 241, 227)
PAPER = RGBColor(255, 252, 244)
PALE = RGBColor(231, 237, 222)
LINE = RGBColor(198, 211, 193)
MUTED = RGBColor(83, 105, 94)
WHITE = RGBColor(255, 255, 255)
AMBER = RGBColor(239, 184, 77)
CYAN = RGBColor(99, 189, 221)
RED = RGBColor(237, 106, 97)


def box(slide, x, y, w, h, fill=PAPER, line=LINE, radius=True):
    kind = MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE if radius else MSO_AUTO_SHAPE_TYPE.RECTANGLE
    shape = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = line
    shape.line.width = Pt(0.8)
    return shape


def text(slide, value, x, y, w, h, size=18, color=GREEN, bold=False,
         font="Aptos", align=PP_ALIGN.LEFT, margin=0, valign=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.clear()
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = valign
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = value
    r.font.name = font
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    return tb


def pill(slide, value, x, y, w, color=MINT):
    p = box(slide, x, y, w, 0.32, fill=color, line=color)
    p.adjustments[0] = 0.5
    text(slide, value, x, y + 0.01, w, 0.26, size=10, color=GREEN, bold=True,
         align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)


def add_header(slide, number, kicker):
    text(slide, f"0{number}", 0.55, 0.35, 0.45, 0.3, size=11, color=DEEP, bold=True)
    text(slide, kicker.upper(), 1.02, 0.35, 4.5, 0.3, size=10, color=MUTED, bold=True)
    line = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0.55), Inches(0.76), Inches(12.25), Inches(0.012))
    line.fill.solid(); line.fill.fore_color.rgb = LINE; line.line.fill.background()


def slide_one(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid(); slide.background.fill.fore_color.rgb = CREAM
    add_header(slide, 1, "Website overview")
    text(slide, "One control room for\nthree ESP32 boards.", 0.62, 1.02, 4.55, 1.35, size=30, bold=True)
    text(slide, "Monitor each device, open a component, and make changes from a single browser dashboard.",
         0.65, 2.48, 4.2, 0.85, size=15, color=MUTED)
    pill(slide, "LIVE + DEMO MODES", 0.65, 3.48, 1.63)

    callouts = [
        ("At-a-glance status", "Connectivity, temperature and each board’s headline reading."),
        ("Direct component access", "Select LED, climate, or a board-specific module without hunting through menus."),
        ("Local-network control", "Configure board addresses and send commands over the same Wi-Fi network."),
    ]
    y = 4.08
    for i, (title, body) in enumerate(callouts):
        text(slide, str(i + 1), 0.68, y, 0.3, 0.35, size=11, color=WHITE, bold=True,
             align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)
        circ = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL, Inches(0.64), Inches(y - 0.01), Inches(0.34), Inches(0.34))
        circ.fill.solid(); circ.fill.fore_color.rgb = DEEP; circ.line.fill.background()
        circ.text_frame.text = str(i + 1)
        cp = circ.text_frame.paragraphs[0]; cp.alignment = PP_ALIGN.CENTER
        cr = cp.runs[0]; cr.font.name = "Aptos"; cr.font.size = Pt(10); cr.font.bold = True; cr.font.color.rgb = WHITE
        text(slide, title, 1.08, y - 0.03, 3.6, 0.28, size=13, bold=True)
        text(slide, body, 1.08, y + 0.25, 3.85, 0.58, size=10.5, color=MUTED)
        y += 0.92

    frame = box(slide, 5.25, 1.08, 7.45, 5.9, fill=WHITE, line=LINE)
    frame.shadow.inherit = False
    slide.shapes.add_picture(str(SCREENSHOT), Inches(5.42), Inches(1.25), width=Inches(7.12), height=Inches(4.94))
    text(slide, "System overview — three connected boards", 5.58, 6.39, 4.3, 0.3, size=11, color=GREEN, bold=True)
    text(slide, "Actual dashboard view", 10.62, 6.39, 1.7, 0.3, size=10, color=MUTED, align=PP_ALIGN.RIGHT)
    return slide


def feature_card(slide, x, title, subtitle, color, items):
    box(slide, x, 2.27, 3.86, 3.93, fill=PAPER, line=LINE)
    accent = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x + 0.25), Inches(2.55), Inches(0.54), Inches(0.54))
    accent.fill.solid(); accent.fill.fore_color.rgb = color; accent.line.fill.background()
    text(slide, title, x + 0.96, 2.52, 2.55, 0.38, size=17, bold=True)
    text(slide, subtitle, x + 0.96, 2.92, 2.55, 0.32, size=10, color=MUTED, bold=True)
    y = 3.52
    for item in items:
        dot = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL, Inches(x + 0.32), Inches(y + 0.05), Inches(0.11), Inches(0.11))
        dot.fill.solid(); dot.fill.fore_color.rgb = color; dot.line.fill.background()
        text(slide, item, x + 0.55, y - 0.02, 2.95, 0.56, size=11.5, color=GREEN)
        y += 0.72


def slide_two(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid(); slide.background.fill.fore_color.rgb = CREAM
    add_header(slide, 2, "Core capabilities")
    text(slide, "Each board adds a focused interaction.", 0.65, 1.02, 8.0, 0.58, size=28, bold=True)
    text(slide, "Shared monitoring and LED controls stay consistent across all three devices.",
         0.67, 1.65, 7.2, 0.38, size=13, color=MUTED)
    pill(slide, "SHARED: CLIMATE + 4-COLOR LED ARRAY", 9.35, 1.35, 3.17, color=PALE)

    feature_card(slide, 0.62, "ESP32 — 01", "SOUND + COMPOSITION", MINT, [
        "Build melodies on a C3–B5 piano",
        "Set note length, dotted notes and ties",
        "Play, pause, edit, copy and save tunes",
    ])
    feature_card(slide, 4.74, "ESP32 — 02", "MOTION + DISTANCE", AMBER, [
        "Read ultrasonic distance in centimeters",
        "Move the servo from 0° to 180°",
        "Release the servo directly from the UI",
    ])
    feature_card(slide, 8.86, "ESP32 — 03", "INPUT MONITORING", CYAN, [
        "Show the key currently being held",
        "Remember the most recent keypad input",
        "Refresh live readings every five seconds",
    ])
    text(slide, "From observation to action", 0.65, 6.53, 2.25, 0.28, size=11, color=MUTED, bold=True)
    steps = [("1", "See status"), ("2", "Select component"), ("3", "Control or read")]
    x = 3.1
    for idx, (num, label) in enumerate(steps):
        box(slide, x, 6.42, 2.55, 0.48, fill=DEEP if idx == 2 else PALE, line=DEEP if idx == 2 else LINE)
        text(slide, f"{num}  {label}", x, 6.48, 2.55, 0.26, size=11,
             color=WHITE if idx == 2 else GREEN, bold=True, align=PP_ALIGN.CENTER)
        x += 2.78
    return slide


def main():
    OUT.parent.mkdir(exist_ok=True)
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    prs.core_properties.title = "ESP Control Room — Website Functions"
    prs.core_properties.subject = "Brief overview of the ESP32 control website"
    prs.core_properties.author = "OpenAI"
    slide_one(prs)
    slide_two(prs)
    prs.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
