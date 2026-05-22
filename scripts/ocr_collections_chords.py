#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from paddleocr import PaddleOCR


CHORD_RE = re.compile(
    r"^(?:[A-G](?:#|b)?(?:m|maj|min|sus|dim|aug|add)?\d*(?:/[A-G](?:#|b)?)?"
    r"|N\.C\.|NC)$",
    re.IGNORECASE,
)
CHORD_MARK_RE = re.compile(r"\[([^\]]+)\]")
EMPTY_LYRIC_VALUES = {"", "Không rõ", "KhÃ´ng rÃµ", None}

PROFILE_CONFIG = {
    "hosanna": {
        "input_json": Path("src/data/song2-data.json"),
        "collection": "Hosanna Việt Nam",
        "image_dirs": [Path("src/data/HosannaVietNam1"), Path("src/data/HosannaVietNam2")],
        "mode": "ocr_full_if_missing",
    },
    "tvchh": {
        "input_json": Path("src/data/song-data.json"),
        "collection": "Tôn vinh Chúa Hằng Hữu",
        "image_dirs": [Path("src/data/TVCHH1"), Path("src/data/TVCHH2")],
        "mode": "add_chords_to_existing_lyric",
    },
}


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
    parser = argparse.ArgumentParser(description="OCR chords/lyrics from Hosanna and TVCHH sheet images.")
    parser.add_argument(
        "--profile",
        choices=["hosanna", "tvchh", "all"],
        default="all",
        help="Which collection profile to process.",
    )
    parser.add_argument("--lang", default="en")
    parser.add_argument("--min-score", type=float, default=0.35)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--song-ids", default="", help="Comma-separated ids, e.g. H1,H2,T1")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--write-in-place", action="store_true")
    parser.add_argument("--save-every", type=int, default=1)
    parser.add_argument("--backup-suffix", default=".bak")
    return parser.parse_args()


def load_json(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=4)


def ensure_backup_if_needed(path: Path, suffix: str) -> None:
    backup_path = path.with_suffix(path.suffix + suffix)
    if not backup_path.exists():
        backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")


def build_image_index(image_dirs: Iterable[Path]) -> dict[str, Path]:
    index: dict[str, Path] = {}
    for directory in image_dirs:
        if not directory.exists():
            continue
        for image_path in directory.glob("*.jpg"):
            index[image_path.stem] = image_path
    return index


def normalize_token(text: str) -> str:
    token = text.strip()
    replacements = {
        "â€™": "'",
        "â€œ": '"',
        "â€": '"',
        "ï¬": "fi",
        "ï¬‚": "fl",
    }
    for source, target in replacements.items():
        token = token.replace(source, target)
    return token


def is_chord_token(text: str) -> bool:
    token = normalize_token(text)
    if not token:
        return False
    if token in {"C", "D", "E", "F", "G", "A", "B", "Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm"}:
        return True
    return bool(CHORD_RE.fullmatch(token))


def should_skip_text(text: str) -> bool:
    token = normalize_token(text)
    if not token:
        return True
    if token.isdigit():
        return True
    lowered = token.lower()
    if any(lowered.startswith(prefix) for prefix in ("rô-ma", "e-phê-sô", "musik", "scripture", "bob fitts")):
        return True
    if token in {"©", "(", ")", ",", ".", ":", ";", "!", "?", "-"}:
        return True
    return False


def polygon_bounds(points: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return min(xs), min(ys), max(xs), max(ys)


def unwrap_paddle_result(page_result) -> list[OcrBox]:
    boxes: list[OcrBox] = []

    if isinstance(page_result, dict):
        if all(key in page_result for key in ("rec_polys", "rec_texts", "rec_scores")):
            for poly, text, score in zip(
                page_result["rec_polys"],
                page_result["rec_texts"],
                page_result["rec_scores"],
            ):
                left, top, right, bottom = polygon_bounds(poly)
                boxes.append(OcrBox(str(text), left, top, right, bottom, float(score)))
            return boxes

    if hasattr(page_result, "keys"):
        return unwrap_paddle_result(dict(page_result))

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


def ocr_page_lines(ocr: PaddleOCR, image_path: Path, min_score: float) -> list[str]:
    result = ocr.predict(str(image_path))
    if not result:
        return []
    boxes = [box for box in unwrap_paddle_result(result[0]) if box.score >= min_score]
    rows = cluster_rows(boxes)
    classified = classify_rows(rows)
    return merge_chords_and_lyrics(classified)


def split_image_keys(image_field: str) -> list[str]:
    return [item.strip() for item in str(image_field).split(",") if item.strip()]


def parse_lyric_lines(lyric: str) -> list[str]:
    if lyric in EMPTY_LYRIC_VALUES:
        return []
    text = str(lyric).strip()
    if text.startswith("[") and text.endswith("]"):
        inner = text[1:-1].strip()
        if not inner:
            return []
        return [
            item.replace("\\'", "'").strip().strip("'").strip('"')
            for item in re.split(r"',\s*'|\",\s*\"|',\s*\"|\",\s*'", inner)
            if item.strip().strip("'").strip('"')
        ]
    return [line.strip() for line in text.splitlines() if line.strip()]


def render_lyric_list(lines: list[str]) -> str:
    escaped = [line.replace("'", "\\'") for line in lines if line.strip()]
    if not escaped:
        return "Không rõ"
    return "[" + ", ".join(f"'{line}'" for line in escaped) + "]"


def strip_chords(line: str) -> str:
    return CHORD_MARK_RE.sub("", line).strip()


def parse_chorded_tokens(line: str) -> list[tuple[list[str], str]]:
    tokens: list[tuple[list[str], str]] = []
    pending: list[str] = []
    index = 0
    while index < len(line):
        if line[index] == "[":
            match = CHORD_MARK_RE.match(line, index)
            if match:
                pending.append(match.group(1))
                index = match.end()
                continue
        next_space = line.find(" ", index)
        if next_space == -1:
            word = line[index:].strip()
            index = len(line)
        else:
            word = line[index:next_space].strip()
            index = next_space + 1
        if word:
            tokens.append((pending[:], word))
            pending.clear()
    if pending:
        tokens.append((pending[:], ""))
    return tokens


def apply_ocr_chords_to_existing_line(existing_line: str, ocr_line: str) -> str:
    existing_words = existing_line.split()
    ocr_tokens = parse_chorded_tokens(ocr_line)
    if not existing_words or not ocr_tokens:
        return existing_line

    word_tokens = [token for token in ocr_tokens if token[1]]
    tail_tokens = [token for token in ocr_tokens if not token[1]]
    mapped: list[str] = []

    for index, word in enumerate(existing_words):
        if index < len(word_tokens):
            chords = "".join(f"[{chord}]" for chord in word_tokens[index][0])
            mapped.append(f"{chords}{word}" if chords else word)
        else:
            mapped.append(word)

    if tail_tokens:
        tail = "".join(f"[{chord}]" for chord, _ in tail_tokens for chord in chord)
        if tail:
            mapped[-1] = f"{mapped[-1]} {tail}".strip()

    return " ".join(mapped)


def update_hosanna_song(song: dict, ocr: PaddleOCR, image_index: dict[str, Path], min_score: float) -> tuple[bool, list[str]]:
    if str(song.get("lyric", "")).strip() not in EMPTY_LYRIC_VALUES:
        return False, parse_lyric_lines(song.get("lyric", ""))

    page_lines: list[str] = []
    for image_key in split_image_keys(song.get("image", "")):
        image_path = image_index.get(image_key)
        if not image_path:
            continue
        page_lines.extend(ocr_page_lines(ocr, image_path, min_score))

    song["lyric"] = render_lyric_list(page_lines)
    return True, page_lines


def update_tvchh_song(song: dict, ocr: PaddleOCR, image_index: dict[str, Path], min_score: float) -> tuple[bool, list[str]]:
    existing_lines = parse_lyric_lines(song.get("lyric", ""))
    if not existing_lines:
        return False, []

    ocr_lines: list[str] = []
    for image_key in split_image_keys(song.get("image", "")):
        image_path = image_index.get(image_key)
        if not image_path:
            continue
        ocr_lines.extend(ocr_page_lines(ocr, image_path, min_score))

    if not ocr_lines:
        return False, existing_lines

    updated_lines: list[str] = []
    for index, line in enumerate(existing_lines):
        if index < len(ocr_lines):
            updated_lines.append(apply_ocr_chords_to_existing_line(line, ocr_lines[index]))
        else:
            updated_lines.append(line)

    song["lyric"] = render_lyric_list(updated_lines)
    return True, updated_lines


def process_profile(
    profile_name: str,
    cfg: dict,
    ocr: PaddleOCR,
    args: argparse.Namespace,
    wanted_ids: set[str],
) -> None:
    input_json = cfg["input_json"]
    songs = load_json(input_json)
    image_index = build_image_index(cfg["image_dirs"])
    processed = 0
    updated = 0

    if args.write_in_place and not args.dry_run:
        ensure_backup_if_needed(input_json, args.backup_suffix)

    for song in songs:
        if song.get("collection") != cfg["collection"]:
            continue
        if wanted_ids and song.get("id", "").upper() not in wanted_ids:
            continue
        if args.limit and processed >= args.limit:
            break

        processed += 1
        try:
            if cfg["mode"] == "ocr_full_if_missing":
                changed, lines = update_hosanna_song(song, ocr, image_index, args.min_score)
            else:
                changed, lines = update_tvchh_song(song, ocr, image_index, args.min_score)
        except Exception as exc:
            print(f"[{profile_name}] ERROR {song.get('id')}: {exc}")
            continue

        if changed:
            updated += 1
            print(f"[{profile_name}] updated {song.get('id')}: {song.get('songName')}")

        if args.dry_run and processed <= 3:
            print(f"\n--- {profile_name} {song.get('id')} {song.get('songName')} ---")
            print("\n".join(lines[:12]))

        if args.write_in_place and not args.dry_run and args.save_every > 0 and processed % args.save_every == 0:
            save_json(input_json, songs)
            print(f"[{profile_name}] checkpoint wrote {processed} songs -> {input_json}")

    if args.write_in_place and not args.dry_run:
        save_json(input_json, songs)
        print(f"[{profile_name}] wrote {updated} updates to {input_json}")
    else:
        output_path = input_json.with_name(f"{input_json.stem}.{profile_name}.ocr-draft.json")
        save_json(output_path, songs)
        print(f"[{profile_name}] wrote draft {updated} updates to {output_path}")


def main() -> int:
    args = parse_args()
    wanted_ids = {token.strip().upper() for token in args.song_ids.split(",") if token.strip()}
    profiles = list(PROFILE_CONFIG.keys()) if args.profile == "all" else [args.profile]

    ocr = PaddleOCR(
        lang=args.lang,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )

    for profile_name in profiles:
        process_profile(profile_name, PROFILE_CONFIG[profile_name], ocr, args, wanted_ids)
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
