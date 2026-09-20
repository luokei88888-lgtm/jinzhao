import { parseThemeMode, type ThemeMode } from "./theme";

export const THEME_CACHE_KEY = "jinzhao.theme";

type Readable = Pick<Storage, "getItem">;
type Writable = Pick<Storage, "setItem">;

function resolveStore<T>(provided: T | undefined): T | undefined {
  if (provided) return provided;
  return globalThis.localStorage as unknown as T | undefined;
}

/// 启动时用来在首屏渲染前定主题。任何读取失败都退回「跟随系统」，
/// 与配置默认值一致，所以最坏情况只是启动瞬间用系统偏好。
export function readCachedMode(storage?: Readable): ThemeMode {
  try {
    const store = resolveStore(storage);
    if (!store) return "system";
    return parseThemeMode(store.getItem(THEME_CACHE_KEY));
  } catch {
    return "system";
  }
}

/// 写入失败不影响使用，只是下次启动会退回系统偏好。
export function writeCachedMode(mode: ThemeMode, storage?: Writable): void {
  try {
    const store = resolveStore(storage);
    if (!store) return;
    store.setItem(THEME_CACHE_KEY, mode);
  } catch {
    /* 存储不可用时忽略 */
  }
}
