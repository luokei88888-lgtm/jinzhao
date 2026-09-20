import { modeHint, modeLabel, type ThemeMode } from "../../lib/theme";

export function ThemeToggle({ mode, onToggle }: { mode: ThemeMode; onToggle: () => void }) {
  const hint = modeHint(mode);
  return (
    <button type="button" className="theme-btn" onClick={onToggle} aria-label={hint} title={hint}>
      {modeLabel(mode)}
    </button>
  );
}
