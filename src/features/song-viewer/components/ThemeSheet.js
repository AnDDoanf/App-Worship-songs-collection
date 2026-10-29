export default function ThemeSheet({ source, label, className = '' }) {
  return (
    <div
      className={`theme-sheet-image ${className}`}
      role="img"
      aria-label={label}
      style={{ maskImage: `url("${source}")`, WebkitMaskImage: `url("${source}")` }}
    />
  );
}
