import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { applyThemeTo } from "./lib/theme";
import { readCachedMode } from "./lib/themeCache";

// 在首屏渲染之前先把主题定下来，否则深色用户会先看到一帧浅色。
// 首次启动没有缓存时退回系统偏好，而配置的默认模式本来就是「跟随系统」，
// 所以这种情况也正好对得上。
const systemPrefersDark =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;
applyThemeTo(document.documentElement, readCachedMode(), systemPrefersDark);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
