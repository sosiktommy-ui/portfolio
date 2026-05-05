from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parent
SRC = ROOT.parent / "skrin"
OUT = ROOT / "assets" / "screens"
OUT.mkdir(parents=True, exist_ok=True)

TARGETS = {
    "photo_2026-05-03_19-49-38.jpg": {
        "target": "ticketing-analytics-overview.jpg",
        "regions": [
            (0.16, 0.08, 0.80, 0.16, "strong"),
            (0.16, 0.20, 0.98, 0.46, "strong"),
            (0.16, 0.72, 0.98, 0.98, "soft"),
        ],
    },
    "photo_2026-05-03_19-50-02.jpg": {
        "target": "ticketing-dashboard.jpg",
        "regions": [
            (0.16, 0.08, 0.80, 0.16, "strong"),
            (0.16, 0.42, 0.98, 0.58, "strong"),
            (0.16, 0.60, 0.98, 0.98, "strong"),
        ],
    },
    "photo_2026-05-03_19-50-42.jpg": {
        "target": "ticketing-search.jpg",
        "regions": [
            (0.16, 0.08, 0.86, 0.22, "strong"),
            (0.19, 0.39, 0.98, 0.98, "strong"),
        ],
    },
    "photo_2026-05-03_19-51-04.jpg": {
        "target": "ticketing-charts.jpg",
        "regions": [
            (0.16, 0.08, 0.80, 0.16, "strong"),
            (0.18, 0.12, 0.98, 0.39, "soft"),
            (0.25, 0.44, 0.57, 0.98, "soft"),
            (0.61, 0.44, 0.98, 0.98, "soft"),
        ],
    },
    "photo_2026-05-03_19-51-43.jpg": {
        "target": "ticketing-segmentation.jpg",
        "regions": [
            (0.00, 0.03, 0.84, 0.16, "strong"),
            (0.02, 0.18, 0.24, 0.98, "strong"),
            (0.26, 0.18, 0.98, 0.98, "soft"),
        ],
    },
    "photo_2026-05-03_19-52-08.jpg": {
        "target": "ticketing-map.jpg",
        "regions": [
            (0.14, 0.06, 0.99, 0.18, "strong"),
            (0.00, 0.18, 1.00, 1.00, "soft"),
        ],
    },
    "photo_2026-05-03_20-07-13.jpg": {
        "target": "task-control-events-board.jpg",
        "regions": [
            (0.19, 0.20, 0.98, 0.31, "strong"),
            (0.22, 0.50, 0.98, 0.98, "strong"),
        ],
    },
    "photo_2026-05-03_20-07-20.jpg": {
        "target": "task-control-tasks.jpg",
        "regions": [
            (0.19, 0.18, 0.57, 0.31, "strong"),
            (0.18, 0.48, 0.98, 0.86, "strong"),
        ],
    },
    "photo_2026-05-03_20-07-30.jpg": {
        "target": "task-control-events-list.jpg",
        "regions": [
            (0.19, 0.20, 0.98, 0.31, "strong"),
            (0.18, 0.33, 0.98, 0.98, "strong"),
        ],
    },
    "photo_2026-05-03_20-07-46.jpg": {
        "target": "task-control-users.jpg",
        "regions": [
            (0.19, 0.20, 0.98, 0.31, "strong"),
            (0.18, 0.31, 0.98, 0.98, "strong"),
        ],
    },
    "photo_2026-05-03_20-08-00.jpg": {
        "target": "task-control-dashboard.jpg",
        "regions": [
            (0.19, 0.20, 0.98, 0.31, "strong"),
            (0.22, 0.49, 0.98, 0.98, "strong"),
        ],
    },
    "photo_2026-05-03_20-08-09.jpg": {
        "target": "task-control-bot-settings.jpg",
        "regions": [
            (0.21, 0.20, 0.98, 0.40, "strong"),
            (0.21, 0.48, 0.36, 0.98, "strong"),
        ],
    },
    "photo_2026-05-03_20-08-20.jpg": {
        "target": "task-control-archive.jpg",
        "regions": [
            (0.18, 0.30, 0.98, 0.98, "strong"),
        ],
    },
}


def strong_mask(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    left, top, right, bottom = box
    region = image.crop(box)
    down_w = max(24, region.width // 20)
    down_h = max(18, region.height // 20)
    region = region.resize((down_w, down_h), Image.Resampling.BILINEAR)
    region = region.resize((right - left, bottom - top), Image.Resampling.NEAREST)
    region = region.filter(ImageFilter.GaussianBlur(5))
    return region



def soft_mask(image: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    left, top, right, bottom = box
    region = image.crop(box)
    down_w = max(60, region.width // 10)
    down_h = max(40, region.height // 10)
    region = region.resize((down_w, down_h), Image.Resampling.BILINEAR)
    region = region.resize((right - left, bottom - top), Image.Resampling.BICUBIC)
    region = region.filter(ImageFilter.GaussianBlur(8))
    region = ImageEnhance.Contrast(region).enhance(0.96)
    return region


MASKERS = {
    "strong": strong_mask,
    "soft": soft_mask,
}


for source_name, spec in TARGETS.items():
    image = Image.open(SRC / source_name).convert("RGB")
    width, height = image.size

    for left, top, right, bottom, mode in spec["regions"]:
        box = (
            int(width * left),
            int(height * top),
            int(width * right),
            int(height * bottom),
        )
        masked = MASKERS[mode](image, box)
        image.paste(masked, box[:2])

    image = ImageEnhance.Contrast(image).enhance(0.99)
    image = ImageEnhance.Sharpness(image).enhance(0.96)
    image.save(OUT / spec["target"], quality=94)

print(f"Updated {len(TARGETS)} screenshot assets in {OUT}")
