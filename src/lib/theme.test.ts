import { describe, expect, it } from "vitest";
import { applyThemeTo, modeHint, modeLabel, nextMode, parseThemeMode, resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("浅色模式直接给出浅色", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("深色模式直接给出深色", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("跟随系统时看系统偏好", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("nextMode", () => {
  it("按 浅色 到 深色 到 自动 循环", () => {
    expect(nextMode("light")).toBe("dark");
    expect(nextMode("dark")).toBe("system");
    expect(nextMode("system")).toBe("light");
  });

  it("循环三次回到原点", () => {
    expect(nextMode(nextMode(nextMode("light")))).toBe("light");
  });
});

describe("modeLabel", () => {
  it("三种模式各有对应文案", () => {
    expect(modeLabel("light")).toBe("浅色");
    expect(modeLabel("dark")).toBe("深色");
    expect(modeLabel("system")).toBe("自动");
  });
});

describe("modeHint", () => {
  it("说明当前模式与下一个模式", () => {
    expect(modeHint("light")).toBe("当前浅色，点击切换到深色");
    expect(modeHint("dark")).toBe("当前深色，点击切换到自动");
    expect(modeHint("system")).toBe("当前自动，点击切换到浅色");
  });
});

describe("parseThemeMode", () => {
  it("接受三个合法取值", () => {
    expect(parseThemeMode("light")).toBe("light");
    expect(parseThemeMode("dark")).toBe("dark");
    expect(parseThemeMode("system")).toBe("system");
  });

  it("缺失或非法取值回落到自动", () => {
    expect(parseThemeMode(undefined)).toBe("system");
    expect(parseThemeMode(null)).toBe("system");
    expect(parseThemeMode("")).toBe("system");
    expect(parseThemeMode("DARK")).toBe("system");
    expect(parseThemeMode("darkk")).toBe("system");
    expect(parseThemeMode(42)).toBe("system");
  });
});

describe("applyThemeTo", () => {
  it("把生效主题写到 data-theme，system 也会落到具体值", () => {
    const root = { dataset: {} as DOMStringMap };
    expect(applyThemeTo(root, "light", true)).toBe("light");
    expect(root.dataset.theme).toBe("light");
    expect(applyThemeTo(root, "system", true)).toBe("dark");
    expect(root.dataset.theme).toBe("dark");
    expect(applyThemeTo(root, "dark", false)).toBe("dark");
    expect(root.dataset.theme).toBe("dark");
  });
});
