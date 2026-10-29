#!/usr/bin/env python3
"""Convert sheet scans to compact cropped transparent WebP masks.

Requires Pillow: py -m pip install Pillow

By default, reads src/assets/images/sheets and writes masks to
src/assets/images/sheet-masks so source files remain untouched.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import sys

from PIL import Image, ImageOps


RASTER_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}


def create_mask(source: Path, destination: Path, threshold: int, max_dimension: int) -> None:
    """Create a cropped transparent WebP mask for fast theme-colored rendering."""
    image = ImageOps.grayscale(Image.open(source)).convert("L")
    image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    mask = image.point(lambda pixel: 255 if pixel < threshold else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError("image contains no pixels darker than the threshold")

    # Remove blank page margins but leave a small safety border around ink.
    padding = 20
    left, top, right, bottom = bounds
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    crop_width, crop_height = right - left, bottom - top

    # Precompute dark ink as a transparent WebP mask to avoid runtime SVG filters.
    gray_crop = image.crop((left, top, right, bottom))
    alpha = ImageOps.invert(gray_crop)
    mask_image = Image.new("RGBA", (crop_width, crop_height), (0, 0, 0, 0))
    mask_image.putalpha(alpha)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        destination.unlink()
    mask_image.save(destination, format="WEBP", quality=85, method=4)


def convert_one(task: tuple[str, str, int, int]) -> tuple[str, str]:
    source, destination, threshold, max_dimension = task
    create_mask(Path(source), Path(destination), threshold, max_dimension)
    return source, destination


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=Path("src/assets/images/sheets"))
    parser.add_argument("--output", type=Path, default=Path("src/assets/images/sheet-masks"))
    parser.add_argument("--threshold", type=int, default=245,
                        help="grayscale threshold from 0 to 255; brighter pixels become white/transparent")
    parser.add_argument("--max-dimension", type=int, default=1800,
                        help="maximum output width or height in pixels; 1800 is suitable for screen display")
    parser.add_argument("--workers", type=int, default=4,
                        help="number of images to convert in parallel")
    parser.add_argument("--limit", type=int, default=None,
                        help="convert at most this many images (useful for previews)")
    args = parser.parse_args()
    if not 0 <= args.threshold <= 255:
        parser.error("--threshold must be between 0 and 255")

    root = args.input.resolve()
    output = args.output.resolve()
    sources = [root] if root.is_file() else root.rglob("*")
    tasks = []
    for source in sources:
        if not source.is_file() or source.suffix.lower() not in RASTER_EXTENSIONS:
            continue
        relative = Path(source.name) if root.is_file() else source.relative_to(root)
        destination = output / relative.with_suffix(".webp")
        tasks.append((str(source), str(destination), args.threshold, args.max_dimension))
        if args.limit is not None and len(tasks) >= args.limit:
            break

    count = 0
    failures = 0
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {pool.submit(convert_one, task): task[0] for task in tasks}
        for future in futures:
            try:
                source, destination = future.result()
                count += 1
                if count % 50 == 0 or count == len(tasks):
                    print(f"Converted {count}/{len(tasks)}: {source} -> {destination}", flush=True)
            except Exception as error:
                failures += 1
                print(f"ERROR {futures[future]}: {error}", file=sys.stderr, flush=True)
    print(f"Converted {count} image(s); {failures} failure(s). Output: {output}", flush=True)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
