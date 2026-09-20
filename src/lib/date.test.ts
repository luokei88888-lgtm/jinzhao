import { describe, expect, it } from "vitest";
import { addDays, formatCn, todayIso, weekdayCn } from "./date";

describe("date utils", () => {
  it("todayIso 用本地时区而不是 UTC", () => {
    const d = new Date(2026, 8, 20, 23, 30);
    expect(todayIso(d)).toBe("2026-09-20");
  });

  it("addDays 跨月", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });

  it("addDays 跨年", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("addDays 处理闰年 2 月", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("formatCn 与 weekdayCn", () => {
    expect(formatCn("2026-09-20")).toBe("2026年9月20日");
    expect(weekdayCn("2026-09-20")).toBe("周日");
    expect(weekdayCn("2026-09-21")).toBe("周一");
  });
});
