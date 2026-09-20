import { describe, expect, it } from "vitest";
import { readCachedMode, THEME_CACHE_KEY, writeCachedMode } from "./themeCache";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe("readCachedMode", () => {
  it("读到合法值时直接返回", () => {
    expect(readCachedMode(fakeStorage({ [THEME_CACHE_KEY]: "dark" }))).toBe("dark");
    expect(readCachedMode(fakeStorage({ [THEME_CACHE_KEY]: "light" }))).toBe("light");
  });

  it("没有缓存时退回跟随系统", () => {
    expect(readCachedMode(fakeStorage())).toBe("system");
  });

  it("缓存值是垃圾时退回跟随系统", () => {
    expect(readCachedMode(fakeStorage({ [THEME_CACHE_KEY]: "blue" }))).toBe("system");
  });

  it("读取抛异常时不崩", () => {
    const broken = {
      getItem: () => {
        throw new Error("storage disabled");
      },
    };
    expect(readCachedMode(broken)).toBe("system");
  });
});

describe("writeCachedMode", () => {
  it("把模式写进去", () => {
    const store = fakeStorage();
    writeCachedMode("dark", store);
    expect(store.data[THEME_CACHE_KEY]).toBe("dark");
  });

  it("写入抛异常时不崩", () => {
    const broken = {
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };
    expect(() => writeCachedMode("dark", broken)).not.toThrow();
  });
});
