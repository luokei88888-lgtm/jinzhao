const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

export function todayIso(now: Date = new Date()): string {
  return toIso(now);
}

export function addDays(iso: string, delta: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + delta);
  return toIso(d);
}

export function formatCn(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return y + "年" + m + "月" + d + "日";
}

export function weekdayCn(iso: string): string {
  return WEEKDAYS[parse(iso).getDay()];
}
