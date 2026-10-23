# Icône : médiator crème sur bois, avec une rosace
from PIL import Image, ImageDraw, ImageFilter
import math, os
def make(size, pad=0.0):
    S = size * 4
    im = Image.new("RGBA", (S, S))
    d = ImageDraw.Draw(im)
    # fond bois en dégradé
    for y in range(S):
        t = y / S
        c = (int(70 - 22 * t), int(42 - 14 * t), int(30 - 10 * t))
        d.line([(0, y), (S, y)], fill=c + (255,))
    # veines
    veins = Image.new("RGBA", (S, S)); dv = ImageDraw.Draw(veins)
    for i in range(14):
        y0 = S * (i / 14) + 6 * math.sin(i)
        dv.arc([-S * 0.4, y0 - S * 0.3, S * 1.4, y0 + S * 0.3], 200, 340, fill=(255, 220, 180, 22), width=max(2, S // 160))
    im.alpha_composite(veins)
    # médiator
    cx, cy, w = S / 2, S / 2 + S * 0.02, S * (0.62 - pad)
    pts = []
    for k in range(240):
        a = 2 * math.pi * k / 240
        r = 1 + 0.18 * math.cos(a)  # plus large en haut
        x = cx + (w / 2) * math.sin(a) * (1.0 - 0.18 * (1 - math.cos(a)) / 2)
        y = cy + (w / 2) * math.cos(a) * 1.08 * (0.85 if math.cos(a) > 0 else 1.0)
        pts.append((x, y))
    shadow = Image.new("RGBA", (S, S)); ImageDraw.Draw(shadow).polygon([(x, y + S * 0.02) for x, y in pts], fill=(0, 0, 0, 110))
    im.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(S * 0.02)))
    d = ImageDraw.Draw(im)
    d.polygon(pts, fill=(240, 224, 190, 255))
    # rosace + cordes
    r = w * 0.17
    d.ellipse([cx - r, cy - r * 0.9 - r, cx + r, cy - r * 0.9 + r], fill=(58, 34, 24, 255))
    d.ellipse([cx - r * 1.35, cy - r * 0.9 - r * 1.35, cx + r * 1.35, cy - r * 0.9 + r * 1.35], outline=(184, 55, 43, 255), width=max(3, S // 90))
    for i in range(6):
        x = cx - r * 0.9 + i * (r * 1.8 / 5)
        d.line([(x, cy - w * 0.44), (x, cy + w * 0.30)], fill=(140, 94, 22, 230), width=max(2, S // 220))
    return im.resize((size, size), Image.LANCZOS)
os.makedirs("icons", exist_ok=True)
make(192).save("icons/icon-192.png"); make(512).save("icons/icon-512.png")
make(512, pad=0.12).save("icons/icon-maskable-512.png"); make(180).convert("RGB").save("icons/apple-touch-icon.png")
print("ok")
