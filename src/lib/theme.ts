export type ThemeMode = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

const MODES: ThemeMode[] = ["light", "dark", "system"];

const LABELS: Record<ThemeMode, string> = {
  light: "浅色",
  dark: "深色",
  system: "自动",
};

export function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): EffectiveTheme {
  if (mode === "system") return systemPrefersDark ? "dark" : "light";
  return mode;
}

export function nextMode(mode: ThemeMode): ThemeMode {
  const index = MODES.indexOf(mode);
  return MODES[(index + 1) % MODES.length];
}

export function modeLabel(mode: ThemeMode): string {
  return LABELS[mode];
}

export function modeHint(mode: ThemeMode): string {
  return "当前" + LABELS[mode] + "，点击切换到" + LABELS[nextMode(mode)];
}

export function parseThemeMode(value: unknown): ThemeMode {
  return MODES.includes(value as ThemeMode) ? (value as ThemeMode) : "system";
}

/// 把解析结果写到根节点的 data-theme 上。只允许 light 与 dark 落到 DOM，
/// system 会先解析成其中一个。
export function applyThemeTo(
  root: { dataset: DOMStringMap },
  mode: ThemeMode,
  systemPrefersDark: boolean,
): EffectiveTheme {
  const effective = resolveTheme(mode, systemPrefersDark);
  root.dataset.theme = effective;
  return effective;
}
