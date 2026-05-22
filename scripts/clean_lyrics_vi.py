#!/usr/bin/env python
from __future__ import annotations

import json
import re
from pathlib import Path


FILES = [
    ("tvchh", Path("src/data/song-data.json")),
    ("hosanna", Path("src/data/song2-data.json")),
]

EMPTY_LYRIC_VALUES = {"", "Không rõ", "KhÃ´ng rÃµ", None}
CHORD_RE = re.compile(r"\[[^\]]+\]")

FOREIGN_LINE_MARKERS = [
    "jesus we enthrone you",
    "scripture in song",
    "thankyou music",
    "sing unto",
    "sing un to",
    "he is lord",
    "god is great",
    "wir ",
    " dank ",
    " herr",
    "du bist",
    "voll ehr",
    "for ",
]

INLINE_FOREIGN_MARKERS = [
    " sing ",
    " sing-",
    " sing un",
    " wir ",
    " god is ",
    " je sus, wir ",
    " du bist ",
    " dank sei ",
    " he is lord",
    " i lay ",
]

METADATA_PATTERNS = [
    r"#\s*page\s*\d+",
    r"^\s*text\s*&",
    r"^\s*musik:",
    r"^\s*copyright",
    r"^\s*thi-thi[êe]n",
    r"^\s*r[ôo]-ma",
    r"^\s*e-?ph[êe]-?s",
    r"^\s*ph[úu]c-?truy",
]

TVCHH_TOKEN_FIXES = {
    "Nguyn": "Nguyễn",
    "Húu": "Hữu",
}

HOSANNA_TOKEN_FIXES = {
    "Aba": "A-ba",
    "trén": "trên",
    "yeu": "yêu",
    "Ton": "Tôn",
    "tren": "trên",
    "Nguyn": "Nguyện",
    "vuong": "vương",
    "quóc": "quốc",
    "cua": "của",
    "den": "đến",
    "tiéng": "tiếng",
    "ton": "tôn",
    "la": "là",
    "Toàn": "Toàn",
    "nng": "năng",
    "thay": "thay",
    "Dáng": "Đấng",
    "dâ": "đã",
    "hin": "hiện",
    "ciru": "cửu",
    "Chua": "Chúa",
    "Dang": "Đấng",
    "vinl": "vinh",
    "cai": "cai",
    "tri": "trị",
    "Chien": "Chiên",
    "Duc": "Đức",
    "Ngai": "Ngài",
    "Hy": "Hãy",
    "cöi": "cõi",
    "ngqi": "ngợi",
    "Cúu": "Cứu",
    "lón": "lớn",
    "mt": "một",
    "mói": "mới",
    "dang": "dâng",
    "lén": "lên",
    "ting": "tiếng",
    "Cât": "Cất",
    "hỡi": "hỡi",
    "muón": "muôn",
    "Thò": "Thờ",
    "phuong": "phượng",
    "dén": "đến",
    "ngu": "ngự",
    "chinh": "chính",
    "lòng": "lòng",
}

VN_HINTS = {
    "chúa", "ngài", "con", "cha", "lòng", "xin", "yêu", "vinh", "tôn", "đến", "trong", "cùng",
    "muôn", "chúc", "ban", "nguyện", "hiển", "diện", "thần", "linh", "nước", "sống", "giê-xu",
    "hãy", "thờ", "phượng", "tình", "ngợi", "khen", "đời", "thánh", "ca", "bài", "hát", "vua",
    "quốc", "danh", "toàn", "năng", "cửu", "vương", "trị", "hoàng", "thân", "dâng", "tiếng",
    "bản", "nhạc", "tâm", "hồn", "khúc", "cứu", "thuộc", "diệu", "ơn", "thay", "cõi",
    "chua", "ngai", "cong", "tac", "ton", "vinh", "nguyen", "vuong", "quoc", "danh", "yeu",
    "toan", "nang", "cuu", "doi", "tho", "phuong", "tieng", "dan", "mot", "moi",
}

INVALID_BRACKET_PREFIXES = ("text:", "musik:", "lv:", "verse", "chorus")


def load_json(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, payload: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=4)


def restore_from_backup(path: Path) -> None:
    backup_path = path.with_suffix(path.suffix + ".preclean.bak")
    if backup_path.exists():
        path.write_text(backup_path.read_text(encoding="utf-8"), encoding="utf-8")


def parse_lyric(value: str) -> list[str]:
    if not isinstance(value, str):
        return []
    text = value.strip()
    if not text:
        return []
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


def serialize_lyric(lines: list[str]) -> str:
    if not lines:
        return "Không rõ"
    escaped = [line.replace("'", "\\'") for line in lines]
    return "[" + ", ".join(f"'{line}'" for line in escaped) + "]"


def normalize_spaces(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    return text


def normalize_case_for_match(text: str) -> str:
    return normalize_spaces(CHORD_RE.sub("", text)).lower()


def remove_invalid_bracket_tags(line: str) -> str:
    def repl(match: re.Match[str]) -> str:
        content = match.group(1).strip()
        lowered = content.lower()
        if any(lowered.startswith(prefix) for prefix in INVALID_BRACKET_PREFIXES):
            return ""
        if re.fullmatch(r"[A-G](?:#|b)?(?:m|maj|min|sus|dim|aug|add)?\d*(?:/[A-G](?:#|b)?)?", content, re.I):
            return match.group(0)
        if re.fullmatch(r"[A-G](?:#|b)?(?:sus|dim|maj|m|add)?\d*\s+[A-G](?:#|b)?\d*", content, re.I):
            return match.group(0)
        if re.fullmatch(r"[0-9A-Za-z#()/.\s-]{1,8}", content):
            return match.group(0)
        return ""

    return re.sub(r"\[([^\]]+)\]", repl, line)


def strip_inline_foreign(line: str) -> str:
    lowered = line.lower()
    cut_positions = []
    for marker in INLINE_FOREIGN_MARKERS:
        pos = lowered.find(marker)
        if pos >= 0:
            cut_positions.append(pos)
    if cut_positions:
        line = line[: min(cut_positions)]
    return line


def fix_tokens(line: str, token_fixes: dict[str, str]) -> str:
    tokens = []
    for token in line.split():
        bare = token.strip(".,;:!?_")
        prefix = token[: len(token) - len(token.lstrip("([\"'"))]
        suffix = token[len(prefix) + len(bare):]
        fixed = token_fixes.get(bare, bare)
        tokens.append(prefix + fixed + suffix)
    return " ".join(tokens)


def clean_line(line: str, profile: str) -> str:
    line = line.replace("Ã", "").replace("Â©", "")
    line = remove_invalid_bracket_tags(line)
    line = strip_inline_foreign(line)
    line = normalize_spaces(line)
    if profile == "tvchh":
        line = fix_tokens(line, TVCHH_TOKEN_FIXES)
        line = line.replace("Tình yếu Chúa", "Tình yêu Chúa")
    else:
        line = fix_tokens(line, HOSANNA_TOKEN_FIXES)
        line = (
            line.replace("cà the", "cả thế")
            .replace("ton vinh", "tôn vinh")
            .replace("Toàn nang", "Toàn năng")
            .replace("Chúa chu te", "Chúa chủ tể")
            .replace("Noi ngoi", "Nơi ngôi")
            .replace("chiệnh", "chính")
            .replace("vu tru", "vũ trụ")
            .replace("dang ngy", "đang ngự")
            .replace("thày", "thấy")
            .replace("hy", "hãy")
            .replace("quì", "quỳ")
            .replace("lai", "lại")
            .replace("sóng", "sống")
            .replace("Hãy từng", "Hãy tung")
            .replace("ca từng", "ca tụng")
            .replace("Chúa hi", "Chúa hỡi")
            .replace("mt bài", "một bài")
            .replace("bài mói", "bài mới")
            .replace("chúc tán dang", "chúc tán dâng")
            .replace("đã có, hiện có và còn vinh", "đã có, hiện có và còn vinh")
        )
    return normalize_spaces(line)


def is_foreign_or_metadata(line: str) -> bool:
    lowered = normalize_case_for_match(line)
    if not lowered:
        return True
    if any(re.match(pattern, lowered) for pattern in METADATA_PATTERNS):
        return True
    if any(marker in lowered for marker in FOREIGN_LINE_MARKERS):
        return True
    words = re.findall(r"[A-Za-zÀ-ỹà-ỹĐđ]+", lowered)
    if not words:
        return False
    hint_hits = sum(1 for word in words if word in VN_HINTS)
    if hint_hits == 0 and len(words) >= 3:
        return True
    return False


def is_title_line(line: str, song_name: str) -> bool:
    return normalize_case_for_match(line) == normalize_spaces(song_name).lower()


def clean_song_lines(lines: list[str], song_name: str, profile: str) -> list[str]:
    cleaned: list[str] = []
    for raw in lines:
        line = clean_line(raw, profile)
        if not line:
            continue
        if is_title_line(line, song_name):
            continue
        if is_foreign_or_metadata(line):
            continue
        if line in {"•", "Q", "= ", "="}:
            continue
        cleaned.append(line)

    deduped: list[str] = []
    seen: set[str] = set()
    for line in cleaned:
        key = normalize_case_for_match(line)
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(line)
    return deduped


def process_file(profile: str, path: Path) -> tuple[int, int]:
    payload = load_json(path)
    changed = 0
    nonempty = 0
    for song in payload:
        raw = song.get("lyric", "")
        if str(raw).strip() in EMPTY_LYRIC_VALUES:
            continue
        lines = parse_lyric(raw)
        if lines:
            nonempty += 1
        cleaned = clean_song_lines(lines, song.get("songName", ""), profile)
        serialized = serialize_lyric(cleaned)
        if serialized != raw:
            song["lyric"] = serialized
            changed += 1
    save_json(path, payload)
    return changed, nonempty


def main() -> int:
    for profile, path in FILES:
        restore_from_backup(path)
        changed, nonempty = process_file(profile, path)
        print(f"{path}: changed={changed}, nonempty={nonempty}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
