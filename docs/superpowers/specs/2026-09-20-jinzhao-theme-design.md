# 今朝 · 主题切换设计

- 日期：2026-09-20
- 状态：待用户审阅
- 范围：给现有应用加一套可切换的主题机制，含两套外观与一个跟随系统选项

## 1. 目标

当前的界面只有一套写死的浅色样式。本次把它换成两套外观——宣纸墨迹与深空夜色——并支持三态切换：浅色、深色、跟随系统。选择持久化，重启后保持。

## 2. 范围

做：

- 把写死的颜色、圆角、阴影、字体抽成 CSS 变量
- 两套主题的取值：宣纸墨迹（浅）、深空夜色（深）
- 配置新增主题字段，三态取值，默认跟随系统
- 日期栏右侧一个切换按钮，点击循环切换
- 深色模式下同时切换 `color-scheme`，让滚动条与原生控件跟着变深
- 原生标题栏跟随：浅色与深色模式下强制窗口主题，跟随系统模式下交还系统

不做：

- 不加设置页面。为一个开关单开页面不划算
- 不做按时间自动切换（如日落后切深色）
- 不做更多主题。用户已从四套里选定两套
- 不做主题编辑器或自定义配色

## 3. 主题机制

CSS 变量定义在 `:root`，深色主题用 `[data-theme="dark"]` 覆盖同名变量。组件样式只引用变量，不含具体色值。切换时只改 `document.documentElement` 的 `data-theme`，不重挂组件。

变量清单（两套主题都要给出全部值，缺一个就会串色）：

| 变量 | 用途 |
| --- | --- |
| `--bg` | 页面底色 |
| `--bg-image` | 页面底纹，浅色为空，深色为渐变 |
| `--surface` | 卡片底色 |
| `--border` | 卡片描边 |
| `--text` | 主文字 |
| `--muted` | 次要文字与时间戳 |
| `--yi` | 宜的字色 |
| `--ji` | 忌的字色 |
| `--accent` | 温度数字色 |
| `--badge-text` / `--badge-border` | 休班角标的字色与描边 |
| `--dress-bg` / `--dress-text` | 穿衣建议条的底色与字色 |
| `--radius-card` / `--radius-chip` | 卡片与胶囊的圆角 |
| `--shadow-card` | 卡片阴影 |
| `--font-ui` / `--font-display` | 正文与农历标题字体 |
| `--temp-weight` | 温度数字字重 |
| `--card-topline` | 卡片顶部高光，浅色为空 |

取值：

| 变量 | 宣纸墨迹 | 深空夜色 |
| --- | --- | --- |
| `--bg` | `#f7f2e8` | `#0d1520` |
| `--bg-image` | `none` | `linear-gradient(160deg, #101b28, #0b131d 60%)` |
| `--surface` | `#fffdf6` | `rgba(255, 255, 255, 0.045)` |
| `--border` | `rgba(80, 60, 40, 0.16)` | `rgba(255, 255, 255, 0.09)` |
| `--text` | `#2b241c` | `#e6ecf3` |
| `--muted` | `#8a7a64` | `#8b9aab` |
| `--yi` | `#2f5d50` | `#4ecfb8` |
| `--ji` | `#b23a2f` | `#e0796a` |
| `--accent` | `#2b241c` | `#f2f6fa` |
| `--badge-text` | `#b23a2f` | `#d8b866` |
| `--badge-border` | `rgba(178, 58, 47, 0.45)` | `rgba(216, 184, 102, 0.4)` |
| `--dress-bg` | `#f1ead9` | `rgba(78, 207, 184, 0.12)` |
| `--dress-text` | `#57493a` | `#a8e6db` |
| `--radius-card` | `2px` | `12px` |
| `--radius-chip` | `2px` | `999px` |
| `--shadow-card` | `none` | `none` |
| `--font-ui` | `"Songti SC", Georgia, serif` | `system-ui, "Microsoft YaHei", sans-serif` |
| `--font-display` | `"Songti SC", Georgia, serif` | `system-ui, "Microsoft YaHei", sans-serif` |
| `--temp-weight` | `600` | `300` |
| `--card-topline` | `none` | `linear-gradient(90deg, transparent, rgba(78, 207, 184, 0.5), transparent)` |

## 4. 数据与持久化

配置结构新增字段 `theme`，取值 `light`、`dark`、`system`，默认 `system`。写入现有的 `config.json`，与城市字段走同一套读写与容错：字段缺失或取值非法时回落到 `system`。

新增 Tauri 命令 `set_theme_mode(mode)`。命令名不叫 `set_theme`，因为 Tauri 的窗口对象本身有同名方法，分开命名免得后来的人看混：

1. 校验取值，非法则返回错误
2. 写入配置
3. 应用窗口主题：`light` 传 `Some(Light)`，`dark` 传 `Some(Dark)`，`system` 传 `None`

启动时 `run()` 读取已保存的主题并应用一次窗口主题，避免标题栏与内容不同步。

## 5. 跟随系统

跟随系统时不依赖自定义事件，直接用 webview 的 `window.matchMedia("(prefers-color-scheme: dark)")` 读取系统偏好，并监听它的 `change` 事件。理由是这套 API 在 WebView2 里直接可用，改动面比把 Rust 的窗口事件转发到前端更小。

解析逻辑集中在一个函数里：`system` 模式看 media query 的结果，`light` 与 `dark` 模式直接用自身取值。生效结果写到 `data-theme`，只允许 `light` 与 `dark` 两个值落到 DOM 上。

手动选择浅色或深色后不再跟随系统；切回 `system` 才恢复跟随。

## 6. 界面

切换按钮放在日期栏最右侧，显示当前模式的两个字：`浅色`、`深色`、`自动`。点击按 浅色 → 深色 → 自动 → 浅色 循环。按钮带 `aria-label` 说明当前模式与下一个模式，便于键盘与读屏使用。

按钮用 `--surface` 作底、`--border` 描边、`--muted` 作字色，两套主题下都保持可见。日期栏在窄窗口下允许按钮换行，不挤压日期文本。

## 7. 错误处理

- 配置里的主题值非法或缺失：回落到 `system`，不报错
- 写入配置失败：界面仍然立即切换，只记录错误，不打断使用
- `matchMedia` 不可用：`system` 模式退化为浅色
- 切换按钮点击出错：不影响已渲染的界面

## 8. 测试

纯函数部分用 vitest 覆盖，逻辑抽到独立模块便于测试：

- 三种模式各自解析出的实际主题：`light` → `light`，`dark` → `dark`，`system` 在系统深色时 → `dark`，系统浅色时 → `light`
- 循环顺序：`light` → `dark` → `system` → `light`
- 按钮文案：三种模式分别显示 `浅色`、`深色`、`自动`
- 配置解析：主题字段缺失或取值非法时回落到 `system`

Rust 侧新增校验函数并写单元测试：合法取值通过，非法取值被拒。

需要人工确认（无法自动执行）：

- Windows 切到深色模式时，`自动` 状态下界面跟着变深
- 手动选浅色后，系统切深色界面保持不变
- 重启应用后主题仍是上次选的
- 深色模式下滑动区域的滚动条也是深色

## 9. 实施顺序

1. 抽出 CSS 变量，用现有外观作为默认值，确认界面不变
2. 加入两套主题取值与 `[data-theme]` 覆盖
3. 主题逻辑模块与单元测试
4. 配置字段与 Rust 命令，含校验测试
5. 切换按钮接入，完成三态循环
6. 启动时应用已保存主题
7. 人工确认四条，更新 README
