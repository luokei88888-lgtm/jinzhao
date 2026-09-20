export type Tier = { min: number; label: string };

export const TIERS: Tier[] = [
  { min: 28, label: "短袖短装" },
  { min: 24, label: "短袖" },
  { min: 20, label: "长袖" },
  { min: 16, label: "薄外套" },
  { min: 11, label: "夹克或风衣" },
  { min: 5, label: "毛衣加外套" },
  { min: 0, label: "厚外套" },
  { min: -Infinity, label: "羽绒加保暖内层" },
];

export const THRESHOLDS = { rain: 50, uv: 6, spread: 10, wind: 30 };

export type DressInput = {
  feelsMax: number;
  feelsMin: number;
  precipProb: number;
  uvMax: number;
  windMax: number;
};

export type DressResult = {
  dayLabel: string;
  nightLabel: string;
  sentence: string;
  tips: string[];
};

export function tierOf(feels: number): string {
  for (const tier of TIERS) {
    if (feels >= tier.min) return tier.label;
  }
  return TIERS[TIERS.length - 1].label;
}

export function advise(input: DressInput): DressResult {
  const dayLabel = tierOf(input.feelsMax);
  const nightLabel = tierOf(input.feelsMin);
  const sentence =
    dayLabel === nightLabel ? dayLabel + "就可以" : "白天" + dayLabel + "，早晚" + nightLabel;

  const tips: string[] = [];
  if (input.precipProb >= THRESHOLDS.rain) tips.push("记得带伞");
  if (input.uvMax >= THRESHOLDS.uv) tips.push("注意防晒");
  if (input.feelsMax - input.feelsMin >= THRESHOLDS.spread) tips.push("昼夜温差大，早晚注意加衣");
  if (input.windMax >= THRESHOLDS.wind) tips.push("风大，注意防风");

  return { dayLabel, nightLabel, sentence, tips };
}
