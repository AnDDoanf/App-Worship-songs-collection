#!/usr/bin/env python
"""
Batch OCR Hosanna sheet images and write draft chorded lyrics into song2-data.json.

This script is intentionally heuristic. It is designed to generate a working draft
from sheet images, not a publication-quality final output.

Example:
    python scripts/ocr_hosanna_chords.py --dry-run --limit 3
    python scripts/ocr_hosanna_chords.py --song-ids H1,H2,H3
    python scripts/ocr_hosanna_chords.py --write-in-place
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from paddleocr import PaddleOCR


DEFAULT_JSON_PATH = Path("src/data/song2-data.json")
DEFAULT_IMAGE_DIRS = [Path("src/data/HosannaVietNam1"), Path("src/data/HosannaVietNam2")]
CHORD_RE = re.compile(
    r"^(?:[A-G](?:#|b)?(?:m|maj|min|sus|dim|aug|add)?\d*(?:/[A-G](?:#|b)?)?"
    r"|N\.C\.|NC)$",
    re.IGNORECASE,
)
SKIP_TEXT_RE = re.compile(
    r"^(?:\d+|Rô-ma|E-phê-sô|Musik|Scripture|Bob Fitts|©|\(|\)|,|\.|:|;|!|\?|\-)+$",
    re.IGNORECASE,
)


@dataclass
class OcrBox:
    text: str
    left: float
    top: float
    right: float
    bottom: float
    score: float

    @property
    def cx(self) -> float:
        return (self.left + self.right) / 2

    @property
    def cy(self) -> float:
        return (self.top + self.bottom) / 2

    @property
    def width(self) -> float:
        return self.right - self.left

    @property
    def height(self) -> float:
        return self.bottom - self.top


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate draft chorded lyrics from Hosanna sheet images.")
    parser.add_argument("--input-json", type=Path, default=DEFAULT_JSON_PATH)
    parser.add_argument("--output-json", type=Path, default=None)
    parser.add_argument("--image-dirs", nargs="*", type=Path, default=DEFAULT_IMAGE_DIRS)
    parser.add_argument("--lang", default="en", help="PaddleOCR recognition language. Use cached models when possible.")
    parser.add_argument("--limit", type=int, default=0, help="Only process the first N matching songs.")
    parser.add_argument("--song-ids", default="", help="Comma-separated song ids to process, e.g. H1,H2,H3")
    parser.add_argument("--min-score", type=float, default=0.35)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--write-in-place", action="store_true")
    parser.add_argument("--backup-suffix", default=".bak")
    parser.add_argument(
        "--save-every",
        type=int,
        default=1,
        help="Write progress to output file every N processed songs. Default: 1",
    )
    return parser.parse_args()


def load_json(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=4)


def resolve_output_path(args: argparse.Namespace) -> Path:
    if args.write_in_place:
        return args.input_json
    return args.output_json or args.input_json.with_name(f"{args.input_json.stem}.ocr-draft.json")


def ensure_backup_if_needed(input_path: Path, output_path: Path, backup_suffix: str) -> None:
    if output_path != input_path:
        return
    backup_path = input_path.with_suffix(input_path.suffix + backup_suffix)
    if not backup_path.exists():
        backup_path.write_text(input_path.read_text(encoding="utf-8"), encoding="utf-8")


def build_image_index(image_dirs: Iterable[Path]) -> dict[str, Path]:
    index: dict[str, Path] = {}
    for directory in image_dirs:
        if not directory.exists():
            continue
        for image_path in directory.glob("*.jpg"):
            index[image_path.stem] = image_path
    return index


def is_chord_token(text: str) -> bool:
    token = normalize_token(text)
    if not token:
        return False
    if token in {"C", "D", "E", "F", "G", "A", "B", "Am", "Dm", "Em", "Bm"}:
        return True
    return bool(CHORD_RE.fullmatch(token))


def normalize_token(text: str) -> str:
    token = text.strip()
    token = token.replace("’", "'").replace("“", '"').replace("”", '"')
    token = token.replace("ﬁ", "fi").replace("ﬂ", "fl")
    return token


def should_skip_text(text: str) -> bool:
    token = normalize_token(text)
    if not token:
        return True
    if token.isdigit():
        return True
    if SKIP_TEXT_RE.fullmatch(token):
        return True
    return False


def polygon_bounds(points: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return min(xs), min(ys), max(xs), max(ys)


def unwrap_paddle_result(page_result) -> list[OcrBox]:
    boxes: list[OcrBox] = []

    if isinstance(page_result, dict):
      # paddlex Result object often stringifies like a dict.
        for key in ("rec_polys", "rec_texts", "rec_scores"):
            if key not in page_result:
                break
        else:
            polys = page_result["rec_polys"]
            texts = page_result["rec_texts"]
            scores = page_result["rec_scores"]
            for poly, text, score in zip(polys, texts, scores):
                left, top, right, bottom = polygon_bounds(poly)
                boxes.append(OcrBox(str(text), left, top, right, bottom, float(score)))
            return boxes

    if hasattr(page_result, "keys"):
        as_dict = dict(page_result)
        return unwrap_paddle_result(as_dict)

    if isinstance(page_result, list):
        for item in page_result:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                points = item[0]
                rec = item[1]
                text = rec[0] if isinstance(rec, (list, tuple)) and rec else rec
                score = rec[1] if isinstance(rec, (list, tuple)) and len(rec) > 1 else 1.0
                if isinstance(points, (list, tuple)) and len(points) >= 4:
                    left, top, right, bottom = polygon_bounds(points)
                    boxes.append(OcrBox(str(text), left, top, right, bottom, float(score)))
        if boxes:
            return boxes

    raise RuntimeError(f"Unsupported PaddleOCR result format: {type(page_result)!r}")


def cluster_rows(boxes: list[OcrBox]) -> list[list[OcrBox]]:
    rows: list[list[OcrBox]] = []
    for box in sorted(boxes, key=lambda item: (item.cy, item.left)):
        placed = False
        for row in rows:
            avg_y = sum(item.cy for item in row) / len(row)
            avg_h = sum(item.height for item in row) / len(row)
            threshold = max(16.0, avg_h * 0.75)
            if abs(box.cy - avg_y) <= threshold:
                row.append(box)
                placed = True
                break
        if not placed:
            rows.append([box])

    for row in rows:
        row.sort(key=lambda item: item.left)
    rows.sort(key=lambda row: min(item.cy for item in row))
    return rows


def classify_rows(rows: list[list[OcrBox]]) -> list[dict]:
    classified: list[dict] = []
    for row in rows:
        filtered = [box for box in row if not should_skip_text(box.text)]
        if not filtered:
            continue
        chord_count = sum(1 for box in filtered if is_chord_token(box.text))
        row_type = "chord" if chord_count >= max(1, math.ceil(len(filtered) * 0.6)) else "lyric"
        classified.append({"type": row_type, "boxes": filtered})
    return classified


def attach_chords_to_lyric_row(lyric_boxes: list[OcrBox], chord_boxes: list[OcrBox]) -> str:
    parts: list[str] = []
    used = [False] * len(chord_boxes)
    lyric_boxes = sorted(lyric_boxes, key=lambda item: item.left)
    chord_boxes = sorted(chord_boxes, key=lambda item: item.left)

    for lyric in lyric_boxes:
        attached: list[str] = []
        for index, chord in enumerate(chord_boxes):
            if used[index]:
                continue
            if chord.left <= lyric.cx + max(12, lyric.width * 0.35):
                attached.append(normalize_token(chord.text))
                used[index] = True
        prefix = "".join(f"[{chord}]" for chord in attached if chord)
        text = normalize_token(lyric.text)
        if text:
            parts.append(f"{prefix}{text}" if prefix else text)

    for index, chord in enumerate(chord_boxes):
        if not used[index]:
            token = normalize_token(chord.text)
            if token:
                parts.append(f"[{token}]")

    return " ".join(parts).strip()


def merge_chords_and_lyrics(rows: list[dict]) -> list[str]:
    merged_lines: list[str] = []
    pending_chords: list[OcrBox] = []

    for row in rows:
        boxes = row["boxes"]
        if row["type"] == "chord":
            pending_chords.extend(boxes)
            continue

        lyric_line = attach_chords_to_lyric_row(boxes, pending_chords)
        pending_chords = []
        if lyric_line:
            merged_lines.append(lyric_line)

    if pending_chords:
        tail = " ".join(f"[{normalize_token(box.text)}]" for box in pending_chords if normalize_token(box.text))
        if tail:
            merged_lines.append(tail)

    return merged_lines


def ocr_page(ocr: PaddleOCR, image_path: Path, min_score: float) -> list[str]:
    result = ocr.predict(str(image_path))
    if not result:
        return []

    page = result[0]
    boxes = [box for box in unwrap_paddle_result(page) if box.score >= min_score]
    rows = cluster_rows(boxes)
    classified = classify_rows(rows)
    return merge_chords_and_lyrics(classified)


def split_image_keys(image_field: str) -> list[str]:
    return [item.strip() for item in str(image_field).split(",") if item.strip()]


def render_draft_lyric(lines_by_page: list[list[str]]) -> str:
    output_lines: list[str] = []
    for page_index, lines in enumerate(lines_by_page, start=1):
        if not lines:
            continue
        if output_lines:
            output_lines.append("")
        output_lines.append(f"# Page {page_index}")
        output_lines.extend(lines)
    return "\n".join(output_lines).strip() or "Không rõ"


def should_process_song(song: dict, wanted_ids: set[str]) -> bool:
    if song.get("collection") != "Hosanna Việt Nam":
        return False
    if wanted_ids and song.get("id", "").upper() not in wanted_ids:
        return False
    return True


def main() -> int:
    args = parse_args()
    wanted_ids = {token.strip().upper() for token in args.song_ids.split(",") if token.strip()}
    image_index = build_image_index(args.image_dirs)
    songs = load_json(args.input_json)
    output_path = resolve_output_path(args)

    ocr = PaddleOCR(
        lang=args.lang,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )

    processed = 0
    updated = 0

    if not args.dry_run:
        ensure_backup_if_needed(args.input_json, output_path, args.backup_suffix)

    for song in songs:
        if not should_process_song(song, wanted_ids):
            continue
        if args.limit and processed >= args.limit:
            break

        image_keys = split_image_keys(song.get("image", ""))
        if not image_keys:
            continue

        page_lines: list[list[str]] = []
        missing_pages: list[str] = []
        for image_key in image_keys:
            image_path = image_index.get(image_key)
            if not image_path:
                missing_pages.append(image_key)
                continue
            try:
                page_lines.append(ocr_page(ocr, image_path, args.min_score))
            except Exception as exc:  # pragma: no cover - runtime fallback
                page_lines.append([f"[OCR_ERROR] {image_key}: {exc}"])

        if missing_pages:
            page_lines.append([f"[MISSING_IMAGE] {', '.join(missing_pages)}"])

        draft = render_draft_lyric(page_lines)
        song["lyric"] = draft
        processed += 1
        updated += 1
        print(f"updated {song.get('id')}: {song.get('songName')}")

        if not args.dry_run and args.save_every > 0 and processed % args.save_every == 0:
            save_json(output_path, songs)
            print(f"checkpoint wrote {processed} songs -> {output_path}")

    if args.dry_run:
        preview = [song for song in songs if should_process_song(song, wanted_ids)]
        for song in preview[: min(3, len(preview))]:
            print("\n---", song["id"], song["songName"], "---")
            print(song["lyric"][:2500])
        print(f"\ndry-run complete: processed={processed}, updated={updated}")
        return 0

    save_json(output_path, songs)
    print(f"wrote {updated} draft lyrics to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
