export function parseSongCodes(value) {
  return value
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);
}
