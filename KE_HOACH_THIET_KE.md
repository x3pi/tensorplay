# 📋 Kế Hoạch Triển Khai: TensorPlay
### *Nền Tảng Tương Tác Trực Quan Hóa Toán Học & Kỹ Nghệ Hệ Thống AI (DLSys Visual Lab)*

---

## 🎯 I. Mục Tiêu & Triết Lý Thiết Kế

1. **Giải quyết triệt để vấn đề "Toán dễ nhưng khó tưởng tượng":**
   - Biến các khái niệm ma trận trừu tượng thành các thực thể vật lý trực quan (khuôn mẫu dập ảnh, van một chiều cơ học, bảng điểm thời gian thực).
   - Phản hồi tức thì (**Instant Feedback Loop**): Click/kéo chuột ở đâu thì đồ thị và công thức toán nhảy số tương ứng ngay lập tức.
2. **Nguyên tắc "Hạt nhân Khái niệm Độc Lập" (Atomic Concept Sandbox):**
   - Mỗi bài tập chỉ tập trung giải quyết triệt để **đúng một 'Aha! Moment'** (một nút thắt tư duy duy nhất), không nhồi nhét.
   - **Không có phụ thuộc cứng (Zero Hard Dependencies):** Người học có thể mở thẳng file HTML của bất kỳ bài nào mà không bắt buộc phải hoàn thành các bài trước, không cần "khởi động" một app shell.
   - **Tự cấp dữ liệu mồi (Self-contained Presets):** Mỗi bài đi kèm sẵn các nút bấm thử nghiệm (vd: *Ảnh chuẩn*, *Ảnh dính bụi*, *Đèn pha*) để tương tác ngay lập tức.
   - **URL thật, không cần router ảo:** Mỗi bài là 1 file `.html` thật, nhận tham số qua query string (`?step=4&preset=headlight_glare`) để dễ chia sẻ, bookmark, nhúng vào tài liệu lý thuyết — không cần một SPA router đứng giữa.
3. **Thư viện Component Tái Sử Dụng (Shared Component Library), không phải Core Engine SPA:**
   - Mỗi bài học là **1 trang HTML tĩnh độc lập** (3 file: `.html` + `.logic.js` + `.logic.test.js`), tự chạy, tự chứa kịch bản dẫn dắt.
   - Toàn bộ phần "nhìn giống nhau, dùng lại được" (lưới tương tác, slider, thanh điểm số, khối công thức...) sống trong `shared/components/` — mỗi bài **import** những gì cần, không kế thừa một bộ khung ứng dụng nào cả. Thêm bài mới không đụng tới bài cũ, không cần sửa router/registry.
4. **Thẩm mỹ cao cấp (Modern Developer Experience):**
   - Dark mode chuẩn công nghệ (Deep Slate / Obsidian glassmorphism), màu sắc neon phân biệt rõ ràng (Xanh lục = Trọng số dương / Thưởng, Đỏ cam = Trọng số âm / Phạt, Tím cyan = Tensor Logits).
   - Mở trực tiếp bằng trình duyệt (`file://` hoặc `npm run dev`), không phụ thuộc cồng kềnh, không cần "biên dịch" để xem thử một bài.

---

## 🏗️ II. Cấu Trúc Thư Mục Tổng Thể (Directory Architecture)

```text
tensorplay/
├── KE_HOACH_THIET_KE.md             # Tài liệu kiến trúc & kế hoạch này
├── index.html                       # Trang DANH MỤC: thẻ liên kết tới 15 ví dụ theo track, đọc catalog.json
├── package.json                     # Scripts: dev / build / test (Vite + Vitest, chỉ devDependencies)
├── vite.config.js                   # Multi-page build: quét toàn bộ examples/**/*.html làm entry point
│
├── shared/                          # 🧩 THƯ VIỆN COMPONENT TÁI SỬ DỤNG (dùng chung MỌI ví dụ)
│   ├── styles/
│   │   ├── tokens.css               # Design tokens: màu, font, hiệu ứng glass (Mục VI)
│   │   ├── layout.css               # .lab-grid 3 cột + breakpoint <900px → tab, THUẦN CSS không cần JS
│   │   └── components.css           # Style cho mọi widget bên dưới
│   ├── math.js                      # Hàm toán thuần dùng ≥2 bài: dot(), safeSoftmax(), relu(), clamp(), offset2D()
│   ├── math.test.js                 # Vitest kiểm chứng math.js (chạy độc lập, không cần DOM)
│   ├── katex-render.js              # renderMath(el, latex) — nạp KaTeX từ CDN một lần, cache instance
│   ├── katex-lint.test.js           # Vitest quét toàn bộ examples/**/*.{html,js} chặn `\text{___}` / `_` trần
│   └── components/                  # 🔧 7 COMPONENT NỀN TẢNG — xem Hợp Đồng ở Mục III
│       ├── StepWizard.js            # Khung dẫn dắt Socratic (Cột 1): problem→challenge→takeaway, phím ←/→
│       ├── ValueGrid.js             # Lưới ô N×N click/kéo đổi giá trị (pixel, ma trận, chỉ số thread...)
│       ├── LiveSlider.js            # Thanh trượt số liên kết trực tiếp 1 giá trị trong state
│       ├── MemoryTape.js            # Dải ô nhớ 1D, highlight offset con trỏ, báo lỗi out-of-bound
│       ├── ScoreBar.js              # Thanh đo % / điểm số, màu theo token ngữ nghĩa (reward/penalty)
│       ├── PresetPicker.js          # Dãy nút bấm thử nhanh dữ liệu mồi
│       └── CommentSection.js        # Hệ thống chú giải chuyên gia (Toán/C++/Gotchas) + ghi chú học tập per-step
│
└── examples/                        # 📦 MỖI VÍ DỤ = 3 FILE TĨNH, KHÔNG QUA ROUTER/ENGINE NÀO CẢ
    ├── catalog.json                 # Metadata của 15 ví dụ để index.html render thẻ — KHÔNG dùng để load logic
    │
    ├── hw0_tensor_memory/           # === TRACK 0 (xem Mục IX) ===
    │   ├── bai_01_robot_vision.html
    │   ├── bai_01_robot_vision.logic.js
    │   ├── bai_01_robot_vision.logic.test.js
    │   ├── bai_02_softmax_loss.html
    │   ├── bai_02_softmax_loss.logic.js
    │   ├── bai_02_softmax_loss.logic.test.js
    │   ├── bai_03_cache_locality.html
    │   ├── bai_03_cache_locality.logic.js
    │   ├── bai_03_cache_locality.logic.test.js
    │   └── assets/                  # SVG riêng của track (robot_camera.svg, sun_glare.svg, ...)
    │
    ├── hw1_autograd_engine/         # === TRACK 1: bài 04–06 (cùng mẫu 3 file) ===
    ├── hw2_modules_conv/            # === TRACK 2: bài 07–09 ===
    ├── hw3_cuda_architecture/       # === TRACK 3: bài 10–12 ===
    └── hw4_transformer_llm/         # === TRACK 4: bài 13–15 ===
```

> **So với bản kế hoạch trước:** bỏ `core/engine.js` (state machine toàn app), `core/router.js` (hash router), và `lessons/registry.json` (sổ đăng ký bắt buộc để engine nạp bài). Lý do: với 15 bài độc lập theo triết lý "Atomic Concept Sandbox" ở Mục I.2, một app shell đứng giữa chỉ thêm tầng gián tiếp mà không giải quyết vấn đề học — mở thẳng file HTML quan trọng hơn.

---

## 🧩 III. Hợp Đồng Component Tái Sử Dụng (Shared Component Contract)

### 1. Quy Ước Chung (bắt buộc cho mọi component trong `shared/components/`)
Mọi component là một **factory function thuần**, không class, không framework, nhận `container` (1 phần tử DOM đã có sẵn trong trang) và `options`:

```javascript
export function createX(container, options) {
  // 1. Render DOM ban đầu vào container dựa trên options.initial
  // 2. Gắn event listener (click/drag/input) → gọi options.onChange(newValue) khi người dùng tương tác
  // 3. Trả về handle điều khiển từ bên ngoài (ví dụ khi LessonLogic.applyPreset() cần đồng bộ lại UI)
  return {
    setState(partial) { /* cập nhật DOM để khớp state mới, không re-render toàn bộ */ },
    getState() { /* trả state hiện tại */ },
    destroy() { /* gỡ listener — dùng khi cần dọn dẹp, hiếm khi cần với trang tĩnh 1 lần */ }
  };
}
```
Quy ước này giống nhau cho cả 6 component nền tảng lẫn bất kỳ component mới thêm sau này (Mục III.3) — một khi đã học cách dùng 1 component, dùng component khác không cần học lại pattern.

### 2. Bảy Component Nền Tảng (Foundational Seven)

| Component | Vai trò | Options chính | Dùng đầu tiên ở |
|---|---|---|---|
| **StepWizard** | Cột 1 — khung Socratic: hiển thị `badge "Bước N/M"`, `problem`, `challenge`, `takeaway`; nút Trước/Sau + phím `←`/`→`; đọc `?step=` từ URL khi tải trang | `{ steps: [{heading,problem,challenge,takeaway}], initialStep, onStepChange }` | Bài 01 |
| **ValueGrid** | Lưới N×N ô số, click để toggle hoặc kéo để "vẽ" giá trị liên tục | `{ rows, cols, initial, mode: 'toggle'\|'drag', onChange }` | Bài 01 (pixel 2×2), tái dùng ở Bài 08/10/13 |
| **LiveSlider** | 1 thanh trượt số, hiển thị giá trị hiện tại cạnh thanh | `{ min, max, step, initial, label, onChange }` | Bài 02 (logits), tái dùng Bài 09 |
| **MemoryTape** | Dải ô nhớ 1D ngang, highlight ô theo `offset`, đỏ nếu offset vượt biên | `{ length, values, highlightIndex, onOutOfBounds }` | Bài 01 (RAM C++), tái dùng Bài 11/12 |
| **ScoreBar** | Thanh ngang đo giá trị 0–1 hoặc điểm số, đổi màu theo ngữ nghĩa reward/penalty | `{ value, min, max, variant: 'reward'\|'penalty'\|'neutral', label }` | Bài 01 (điểm số), tái dùng Bài 02/09/14 |
| **PresetPicker** | Dãy nút bấm thử nhanh, mỗi nút gọi `logic.applyPreset(preset.state)` | `{ presets: [{id,label,state}], onPick }` | Mọi bài có `presets` |
| **CommentSection** | Cột 1 — Chú giải kiến thức chuyên gia (Toán, C++, Gotchas) per-step + Ghi chú học tập cá nhân lưu `localStorage` | `{ lessonId, initialStep, curatedComments, allowUserNotes }` | Mọi bài học |

### 3. Backlog Component (chưa thiết kế vội — chỉ thiết kế khi chạm tới track tương ứng)
Không thiết kế trước cho bài chưa làm tới — tránh đoán sai nhu cầu. Dự kiến cần thêm khi tới:
- **FlowGraph** (Bài 04 đồ thị tính toán, có thể tái dùng ý tưởng ở Bài 13 attention flow).
- **ValveGate** (Bài 06 van ReLU).
- **BatchConveyor** (Bài 07 mini-batch, ý tưởng tile hoá có thể tái dùng ở Bài 11).
- **Timeline/Scrubber** (Bài 14 sinh token từng bước — token-by-token playback).
Mỗi component mới vẫn phải tuân Hợp Đồng ở Mục III.1.

---

## 📐 IV. Chuẩn Hóa Gói Ví Dụ (Example Page Contract)

Mỗi ví dụ trong `examples/<track>/` chỉ gồm **đúng 3 file bắt buộc** (+ `assets/` nếu cần):

### 1. File Thuật Toán (`<ten_bai>.logic.js`)
Chạy được cả trong browser và Node (headless, không đụng DOM) — để test độc lập với UI:
```javascript
export class LessonLogic {
  constructor() { this.reset(); }

  reset() {
    this.state = { pixels: [1, 1, 0, 0], weights: [1, 1, -1, -1] };
    return this.calculate();
  }

  applyPreset(presetState) {
    this.state = { ...this.state, ...presetState };
    return this.calculate();
  }

  onUserUpdate(partialState) {
    this.state = { ...this.state, ...partialState };
    return this.calculate();
  }

  calculate() {
    const { pixels, weights } = this.state;
    const dotProduct = pixels.reduce((sum, p, i) => sum + p * weights[i], 0);
    return {
      score: dotProduct,
      formulaKaTeX: `Z = \\sum_{i=1}^{4} x_i w_i = ${dotProduct.toFixed(1)}`,
      cppOffset: 3,
      cppValue: dotProduct
    };
  }
}

export const PRESETS = [
  { id: "horizontal_sign", label: "Ảnh Chuẩn (Gạch Ngang)", state: { pixels: [1, 1, 0, 0] } },
  { id: "dusty_sign", label: "Ảnh Dính Bụi", state: { pixels: [1, 1, 0.5, 0] } },
  { id: "headlight_glare", label: "Đèn Pha Chói Lóa", state: { pixels: [1, 1, 1, 1] } }
];
```

### 2. File Kiểm Chứng (`<ten_bai>.logic.test.js`)
```javascript
import { describe, it, expect } from "vitest";
import { LessonLogic } from "./bai_01_robot_vision.logic.js";

describe("bai_01_robot_vision", () => {
  it("đèn pha chói lóa bị trọng số âm triệt tiêu hoàn toàn", () => {
    const logic = new LessonLogic();
    const result = logic.applyPreset({ pixels: [1, 1, 1, 1] });
    expect(result.score).toBe(0);
  });
});
```

### 3. File Trang (`<ten_bai>.html`)
Chứa: `<link>` tới `shared/styles/*.css` + KaTeX CDN, khung layout 3 cột (Mục V), và 1 `<script type="module">` import `shared/components/*` + `.logic.js` cùng tên, khai báo mảng `STEPS` (nội dung Socratic) trực tiếp trong script — không cần file JSON riêng vì không có engine nào khác đọc nó.

### 4. Quy Tắc Nội Dung KaTeX An Toàn
Mọi chuỗi KaTeX trong `STEPS`/`formulaKaTeX` **phải** dùng `?` cho ô trống trong `bmatrix` (không dùng `\text{___}` — gây `ParseError`); ô trống trong văn bản thường dùng code span `` `______` ``. Được quét tự động bởi `shared/katex-lint.test.js`.

---

## 🖥️ V. Thiết Kế Bố Cục Giao Diện "3 Cột Vàng" & Co Dãn Linh Hoạt (The Resizable 3-Zone Workspace)

Layout mặc định là **thuần CSS Grid** (`shared/styles/layout.css`, class `.lab-grid`), được nâng cấp tự động với khả năng **kéo thả co dãn (drag & resize) linh hoạt** qua `LayoutResizer.js` (tích hợp sẵn trong `LessonNav.js` — không đòi hỏi viết code layout thủ công trong từng trang `.html`):

```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] AI SYSTEMS VISUAL LAB    [← Về Danh Mục]    [⎚ Đặt lại cột]     [Phím tắt: ?] [Dark Mode]         |
+---------------------------------+---+---------------------------------+---+-----------------------------+
|  CỘT 1: CÂU CHUYỆN & DẪN DẮT    | ⁞ |  CỘT 2: SÂN CHƠI TƯƠNG TÁC      | ⁞ | CỘT 3: LIVE MATH & TELEMETRY|
|  (Tùy biến: 32% ~ 15%..55%)     | S |  (Tự động lấp đầy phần còn lại) | S | (Tùy biến: 24% ~ 15%..55%)  |
|                                 | P |                                 | P |                             |
|  📌 BƯỚC 4: VŨ KHÍ TRỌNG SỐ ÂM  | L |  [ KHU VỰC THAO TÁC TRỰC QUAN ] | L | 📐 CÔNG THỨC TOÁN SỐNG:     |
|  ❓ Vấn Đề: Đèn pha xe đối diện  | I |   Ảnh đầu vào X (ValueGrid):    | I | Z = X · W                   |
|  làm sáng cả 4 ô pixel...       | T |   +---+---+                     | T | Z = 1 + 1 - 1 - 1 = 0.0     |
|  🔧 Thử Thách: chỉnh trọng số ở | T |   | 1 | 1 | (Sáng)              | T | 📊 ScoreBar: [ 0.0 ] ░░      |
|  2 ô dưới thành số âm           | E |   +---+---+                     | E | 💾 MemoryTape (Row-major):  |
|  🔎 Đúc Kết: trọng số âm là      | R |   | 1 | 1 | (Sáng)              | R | [ 0.0, 0.0, 0.0, 0.0 ]      |
|  "bằng chứng bác bỏ"            | 0 |   +---+---+                     | 1 | Offset: r*N + c = index [3] |
|  [◀ Bước trước]   [Bước sau ▶]  |   |   [ PresetPicker: Reset | Đèn ] |   |                             |
+---------------------------------+---+---------------------------------+---+-----------------------------+
```

### Tính Năng Kéo Co Dãn Cột:
- **Thanh chia thông minh (Splitters):** Nằm giữa Cột 1-2 và Cột 2-3, thiết kế dải laser Dark OLED với grip handle 3 chấm và vùng chạm rộng (16px) bắt chuột/cảm ứng cực nhạy.
- **Badge phần trăm thời gian thực:** Khi đang kéo, tooltip nổi hiển thị trực tiếp tỉ lệ cột (ví dụ: `40% | 36% | 24%`).
- **Nhấp đúp hoặc bấm nút Reset:** Nhấp đúp vào thanh chia hoặc bấm `[⎚ Đặt lại cột]` trên Header để khôi phục tỉ lệ chuẩn (`32% - 44% - 24%`).
- **Phím tắt điều hướng:** Focus thanh chia và dùng phím mũi tên `←`/`→` để tinh chỉnh từng bước 1% (giữ `Shift` để nhảy 4%), phím `Home`/`Enter`/`r` để reset.
- **Ghi nhớ LocalStorage:** Tỉ lệ ưa thích của người dùng được tự động lưu vào khóa `tensorplay:layout:column-widths` và áp dụng xuyên suốt tất cả các bài học.
- **Tương thích Docked AI Tutor:** Khi AI Tutor mở dạng split-screen, layout tự động tính toán lại mượt mà không gây vỡ giao diện.

---

## 🎨 VI. Hệ Thống Thẩm Mỹ & Phong Cách Đồ Họa (Visual Aesthetics)

- **Màu nền chủ đạo:** Dark OLED slate (`#0B0F17`, `#121824`, `#1A2234`).
- **Màu ngữ nghĩa (Semantic Palette):**
  - **Dương tính / Phần thưởng (Reward):** Xanh ngọc lục bảo `#10B981` (Emerald).
  - **Âm tính / Phạt trừ (Penalty):** Đỏ san hô `#EF4444` (Coral Red).
  - **Dữ liệu thô / Pixel sáng (Active Input):** Vàng nắng `#F59E0B` hoặc Trắng ngọc `#F8FAFC`.
  - **Xác suất / Logits (Outputs):** Xanh Cyan `#06B6D4` và Tím Điện `#8B5CF6`.
- **Hiệu ứng trực quan:**
  - Glassmorphism (khung mờ với viền phát sáng nhẹ `border: 1px solid rgba(255,255,255,0.08)`).
  - Đèn pixel phát sáng (Glow effect: `box-shadow: 0 0 15px rgba(16, 185, 129, 0.4)`).
- **Typography:**
  - Tiêu đề & Văn bản: `Outfit` hoặc `Inter` (hiện đại, sáng sủa).
  - Công thức & Số liệu RAM: `Fira Code` / `JetBrains Mono` (font đơn khoảng cách cố định).

---

## 📱 VII. Khả Năng Tiếp Cận & Responsive Fallback (Accessibility & Breakpoints)

1. **Breakpoint < 900px (tablet/mobile):** `.lab-grid` tự gập 3 cột thành **thanh tab dưới cùng** (Câu Chuyện / Sân Chơi / Toán Học) bằng thuần CSS `@media (max-width: 900px)` — không cần JS điều phối.
2. **Không phụ thuộc hoàn toàn vào màu sắc:** Mọi cặp ngữ nghĩa Xanh (Thưởng) / Đỏ (Phạt) đều đi kèm **ký hiệu hình học dự phòng** (`+` / `−`, hoặc icon ✓ / ✕).
3. **Tương phản & kích thước chữ:** Văn bản chính tối thiểu đạt tỉ lệ tương phản WCAG AA trên nền Dark OLED; công thức KaTeX không nhỏ hơn 16px.
4. **Điều hướng bàn phím:** `StepWizard` tự xử lý `←`/`→`; `?` mở panel trợ giúp phím tắt; `Esc` đóng overlay — không bắt buộc dùng chuột để hoàn thành bất kỳ bài nào.

---

## 🔗 VIII. Điều Hướng & Lưu Tiến Độ (Navigation & Progress — không cần Router)

### 1. URL Thật Thay Cho Hash Router
Không có `router.js`. Mỗi bài tự đọc tham số của chính nó khi tải trang:
- `examples/hw0_tensor_memory/bai_01_robot_vision.html?step=4&preset=headlight_glare`
- `StepWizard` đọc `?step=` để nhảy thẳng bước N; `PresetPicker`/`LessonLogic` đọc `?preset=` để áp dụng ngay — đọc một lần bằng `new URLSearchParams(location.search)`, không cần thư viện routing.
- Khi người dùng đổi bước/preset, cập nhật URL bằng `history.replaceState` (tùy chọn, không bắt buộc vì trang đã hoạt động đúng dù không có query string).

### 2. Lưu Tiến Độ Học (`shared/progress.js`, tiện ích nhỏ — không phải "engine")
- Lưu vào `localStorage` khóa `tensorplay:progress`, dạng `{ "bai_01_robot_vision": { "lastStep": 4, "completed": false } }`.
- `index.html` (trang danh mục) đọc key này để hiện dấu ✓ trên thẻ ví dụ đã hoàn thành — chỉ là hiển thị phụ trợ, không khoá quyền truy cập bài nào cả (đúng triết lý Zero Hard Dependencies ở Mục I.2).

### 3. Bảng Phím Tắt (được `StepWizard` đăng ký cục bộ trên mỗi trang)
| Phím | Hành động |
|---|---|
| `←` / `→` | Lùi / Tiến một bước |
| `R` | Reset trạng thái Canvas về mặc định |
| `?` | Mở/đóng panel trợ giúp phím tắt |
| `Esc` | Đóng overlay đang mở |

---

## 🗺️ IX. Lộ Trình Hệ Thống Học Sâu (Deep Learning Systems Mapping)

Dự án TensorPlay xoay quanh 5 track kinh điển của Deep Learning Systems, mỗi track bóc tách thành các ví dụ độc lập trong `examples/<track>/`:

### Track 0 — `hw0_tensor_memory/`: Nền Tảng Tensor & Kỹ Nghệ Bộ Nhớ C++ (8 Bài)
*Trọng tâm: Chuyển dịch tư duy từ vòng lặp toán học sang layout bộ nhớ máy tính thực tế.*
- **Bài 01 — Robot Vision & Vector Dot Product:** Nhận diện biển báo gạch ngang $2\times2$. Trọng số âm là "bằng chứng bác bỏ" triệt tiêu đèn pha chói lóa. Trải phẳng 2D→1D, `offset = r*N + c`.
- **Bài 02 — Softmax & Cơn Ác Mộng Lóa Sáng:** Logits $\to +1000 \to e^{1000} \to$ `Infinity`/`NaN`. "Safe Softmax": trừ $\max(z)$ trước khi `exp`.
- **Bài 03 — Chu Trình Softmax Regression (Ma trận):** Forward $Z = X\theta \to$ Softmax $P \to$ Loss $\to$ Gradient $\nabla_\theta = X^T G \to$ Cập nhật SGD.
- **Bài 04 — Mạng Nơ-ron 2 Tầng & Lan Truyền Ngược ReLU:** Van một chiều ReLU chặn dòng gradient ở nơ-ron âm ($Z_1 \le 0$). Đạo hàm dội ngược qua tầng ẩn.
- **Bài 05 — Xử Lý Mini-batch $B=2$ & Phép Chuyển Vị $X^T$:** Mini-batch song song, trực giác hình học nhân ma trận $X^T G$ gom gradient.
- **Bài 06 — Dò Tay Vòng Lặp Nhân Ma Trận C++:** Dò từng bước 3 vòng lặp `for (i, j, k)`, offset 1D `A[i * K + k]` và `B[k * N + j]`.
- **Bài 07 — Robot Chết Đuối Vì Memory Leak:** Quên `free(grad)` hoặc `delete[]`, RAM tràn và OOM Killer tiêu diệt tiến trình.
- **Bài 08 — Row-Major vs Col-Major Cache Locality:** CPU Cache L1/L2. Đọc theo dòng (Row-Major) Cache Hit vs quét cột Cache Miss chậm ~10 lần.

### Track 1 — `hw1_autograd_engine/`: Động Cơ Tự Động Tính Đạo Hàm (5 Bài)
*Trọng tâm: Đồ thị tính toán (DAG), quy tắc chuỗi, và kiểm tra tính đúng đắn của đạo hàm.*
- **Bài 09 — Đồ Thị Tính Toán DAG & Sóng Dội Ngược:** Node phép tính; Topological Sort định đoạt trình tự tính đạo hàm dội ngược.
- **Bài 10 — Reverse-mode vs Forward-mode AD:** 1 triệu input, 1 output Loss — Reverse-mode chỉ tốn 1 lượt dội ngược.
- **Bài 11 — Gradient Của Broadcast (Cộng dồn):** Bias broadcast cho cả batch thì gradient phải cộng dồn theo trục batch. Bắt bug gán đè `=` và quên sum.
- **Bài 12 — Kiểm Tra Gradient Bằng Số (Gradient Check):** Sai phân hữu hạn, đồ thị sai số chữ V, chọn $\varepsilon$, và bẫy float32 gây báo động giả.
- **Bài 13 — Van Kích Hoạt & Lời Nguyền Trọng Số 0:** Van ReLU khóa gradient âm; khởi tạo trọng số = 0 → tê liệt đối xứng toàn tầng ẩn.

### Track 2 — `hw2_modules_conv/`: Thư Viện Nơ-ron & Phép Chập Tối Ưu (6 Bài)
*Trọng tâm: Module, khởi tạo, regularization, optimizer và phép biến đổi GEMM.*
- **Bài 14 — Băng Chuyền Mini-Batching Assembly Line:** Dataloader đa tiến trình: Cân đối giữa Worker CPU và GPU, hiện tượng Starvation.
- **Bài 15 — Khởi Tạo Kaiming — Giữ Tín Hiệu Qua Mạng Sâu:** Hệ số $g = n \sigma^2 k$. Vì sao Kaiming chọn phương sai $2/n$ cho mạng ReLU để ngăn bùng nổ / tiêu biến qua 20 tầng.
- **Bài 16 — Dropout — Phá Vỡ Co-Adaptation & Kỹ Thuật Inverted Scaling:** Tắt nơ-ron ép học độc lập; Train vs Eval, bẫy quên chia $1-p$.
- **Bài 17 — Động Học Các Bộ Tối Ưu (SGD vs Momentum vs Adam):** Chạy đua trên hẻm núi dẹt (ill-conditioned); Momentum vượt rãnh, Adam tự cân bằng bước nhảy và Bias Correction.
- **Bài 18 — Ổn Định Nội Bộ Với BatchNorm:** Chuẩn hóa batch mean 0/var 1; Training stats vs Inference running stats.
- **Bài 19 — Conv2D & Thần Chú Im2col:** Mở cuộn vùng trượt thành cột ma trận, biến tích chập thành GEMM tối ưu trên phần cứng.

### Track 3 — `hw3_cuda_architecture/`: Tăng Tốc Phần Cứng GPU (4 Bài)
*Trọng tâm: Layout NDArray, SIMT và hệ thống phân cấp bộ nhớ GPU.*
- **Bài 20 — Strides & View — Một Vùng Nhớ, Nhiều Cách Nhìn:** Dùng shape, strides, offset để transpose, slice, broadcast mà không tốn 1 byte sao chép; khi nào phải `compact()`.
- **Bài 21 — Phân Cấp Luồng CUDA Grid, Blocks & Threads:** `(blockIdx, threadIdx)` thành tọa độ ma trận toàn cục; Boundary Guard `if (idx < N)`.
- **Bài 22 — Tiled MatMul & Shared Memory:** DRAM xa xôi vs Shared Memory (SRAM) gần; Tiling $2\times2$ + `__syncthreads()`.
- **Bài 23 — Memory Coalescing & Bank Conflicts:** Đọc liền kề gộp 1 giao dịch bus vs đọc nhảy cóc nghẽn bus; 32 banks Shared Memory & padding.

### Track 4 — `hw4_transformer_llm/`: Kiến Trúc Transformer & LLM Systems (4 Bài)
*Trọng tâm: Chuỗi tuần hoàn RNN, Attention, KV-Cache, tối ưu I/O.*
- **Bài 24 — RNN & BPTT — Vì Sao Cần Transformer?:** Lan truyền ngược qua thời gian (BPTT), căn bệnh tiêu biến/bùng nổ gradient, cao tốc LSTM và bước nhảy vọt sang Attention $O(1)$.
- **Bài 25 — Scaled Dot-Product Self-Attention:** Query/Key tạo bảng điểm, chia $\sqrt{d}$; Causal Mask tam giác.
- **Bài 26 — Giải Phẫu KV-Cache Trong LLM Serving:** Giữ $K,V$ cũ, chỉ tính Query mới — $O(N^2) \to O(N)$.
- **Bài 27 — FlashAttention SRAM Tiling & Online Softmax:** Cắt block vào SRAM, Online Softmax, tránh lưu $N\times N$ ra HBM.

---

## 🛠️ X. Ngăn Xếp Công Nghệ & Quy Trình Phát Triển (Tech Stack & Dev Workflow)

- **Dev server & build:** [Vite](https://vite.dev) ở **chế độ multi-page** — mở trực tiếp `npm run dev` rồi vào URL của từng file `.html` (Vite tự serve mọi `.html` trong project, không cần khai báo entry cho dev). Build production cần liệt kê entry thủ công vì Rollup không tự quét thư mục:
  ```javascript
  // vite.config.js
  import { defineConfig } from "vite";
  import { readdirSync, statSync } from "node:fs";
  import { join } from "node:path";

  function findHtmlFiles(dir, out = []) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) findHtmlFiles(full, out);
      else if (name.endsWith(".html")) out.push(full);
    }
    return out;
  }

  export default defineConfig({
    build: {
      rollupOptions: {
        input: Object.fromEntries(
          ["index.html", ...findHtmlFiles("examples")].map((f) => [
            f.replace(/[\\/]/g, "_").replace(/\.html$/, ""),
            f
          ])
        )
      }
    }
  });
  ```
- **Không dùng framework UI nặng (React/Vue/Angular)** — mọi component là vanilla JS + DOM API chuẩn (Mục III).
- **KaTeX:** Nạp qua CDN (jsdelivr/cdnjs), pin phiên bản cụ thể (ví dụ `katex@0.16.21`) trong mỗi file `.html`.
- **`package.json`:**
  ```json
  {
    "name": "tensorplay",
    "version": "0.1.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "test": "vitest run"
    },
    "devDependencies": { "vite": "^6.0.0", "vitest": "^3.0.0" }
  }
  ```
- **Không có runtime dependency bên thứ ba ngoài KaTeX (CDN).** Vì không còn SPA router, **deploy cũng đơn giản hơn**: mọi host static (GitHub Pages/Cloudflare Pages) chạy đúng ngay, không cần cấu hình fallback route cho URL ảo.

---

## ✅ XI. Chiến Lược Kiểm Thử & Kiểm Chứng Tự Động (Testing & Verification)

Theo quy chuẩn thiết kế bài tập toán học, **mọi `*.logic.js` bắt buộc có `*.logic.test.js` đi kèm**:

1. **Kiểm thử logic số học từng bài** (`examples/<track>/<ten_bai>.logic.test.js`):
   - Khớp 100% giá trị kỳ vọng ở các preset/bước quan trọng.
   - Bao phủ trường hợp biên: Bài 01 `pixels=[1,1,1,1]` → `score=0` (đèn pha triệt tiêu); Bài 02 `logits=[1000,1000]` → Safe Softmax phải ra `[0.5,0.5]` không `NaN`; Bài 06 trọng số = 0 → gradient bằng nhau mọi hidden unit; Bài 14 KV-Cache chỉ thêm đúng 1 slot mỗi token mới.
2. **`shared/math.test.js`:** kiểm `dot()`, `safeSoftmax()`, `relu()`, `offset2D()` — vì các hàm này được tái dùng ở nhiều bài, lỗi ở đây ảnh hưởng dây chuyền.
3. **`shared/katex-lint.test.js`:** quét toàn bộ `examples/**/*.{html,js}`, chặn `_` trần trong `$...$`/`bmatrix` hoặc `\text{___}`.
4. **Cổng chất lượng:** `npm test` phải xanh 100% trước khi một ví dụ được thêm vào `examples/catalog.json`.

---

## 📝 XII. Hướng Dẫn Thêm Bài Học Mới (Contributor Checklist)

1. Chọn thư mục track `examples/<track>/`, tạo 3 file `<ten_bai>.html` / `.logic.js` / `.logic.test.js` (Mục IV).
2. Viết `.logic.js`: class `LessonLogic` (`reset/applyPreset/onUserUpdate/calculate`) + export `PRESETS`.
3. Viết `.logic.test.js` bao phủ mốc giá trị + trường hợp biên; chạy `npm test` xanh.
4. Dựng `.html`: import CSS dùng chung + KaTeX CDN, chọn component cần từ `shared/components/` (Mục III.2), khai báo `STEPS` Socratic ngay trong script.
5. Thêm `assets/` SVG riêng của track nếu cần.
6. Thêm 1 entry vào `examples/catalog.json` (id, title, track, path, tags, difficulty, estimatedMinutes, summary).
7. Kiểm tra bằng tay: desktop 3 cột, mobile tab (<900px), điều hướng hoàn toàn bằng bàn phím.

---

## 🚀 XIII. Lộ Trình Triển Khai Chi Tiết (Execution Roadmap)

### Giai Đoạn 0: Khởi Tạo Tooling
- [ ] `npm init`, cài `vite` + `vitest` làm devDependencies; viết `vite.config.js` (multi-page, Mục X).
- [ ] Dựng `index.html` (trang danh mục trống) + `examples/catalog.json` rỗng `[]`.
- [ ] Xác nhận `npm run dev` và `npm test` chạy được (dù chưa có nội dung).

### Giai Đoạn 1: Dựng Thư Viện Component Nền Tảng (`shared/`)
- [ ] `shared/styles/` (tokens, layout, components) theo Mục V–VI.
- [ ] `shared/math.js` + `shared/math.test.js`.
- [ ] `shared/katex-render.js` + `shared/katex-lint.test.js`.
- [ ] 6 component nền tảng trong `shared/components/` theo đúng Hợp Đồng Mục III.1 — **chỉ cần đủ cho Bài 01–03**, chưa cần hoàn thiện cho các bài sau.

### Giai Đoạn 2: Triển Khai Track 0 (`hw0_tensor_memory/`)
- [ ] **Bài 01:** ValueGrid pixel $2\times2$, LiveSlider/PresetPicker trọng số, MemoryTape RAM, ScoreBar điểm số.
- [ ] **Bài 02:** LiveSlider logits $0\to1000$, hiện tượng `NaN`, cần gạt Safe Softmax, ScoreBar xác suất.
- [ ] **Bài 03:** ValueGrid mô phỏng Cache Hit/Miss khi quét Row-major vs Col-major.
- [ ] Cập nhật `examples/catalog.json` với 3 entry, kiểm tra `index.html` hiển thị đúng.

### Giai Đoạn 3: Track 1 (`hw1_autograd_engine/`) — Bài 04–06
- [ ] Thiết kế component mới **FlowGraph** (Mục III.3) khi bắt đầu Bài 04.
- [ ] **Bài 04/05/06** theo nội dung Mục IX.

### Giai Đoạn 4: Track 2 (`hw2_modules_conv/`) — Bài 07–09
- [ ] Thiết kế **BatchConveyor** khi bắt đầu Bài 07; tái dùng ValueGrid cho Im2col (Bài 08), LiveSlider+ScoreBar cho BatchNorm (Bài 09).

### Giai Đoạn 5: Track 3 (`hw3_cuda_architecture/`) — Bài 10–12
- [ ] Tái dùng ValueGrid làm lưới thread (Bài 10); MemoryTape mở rộng 2 cấp (DRAM/Shared Memory) cho Bài 11–12.

### Giai Đoạn 6: Track 4 (`hw4_transformer_llm/`) — Bài 13–15
- [ ] Thiết kế **Timeline/Scrubber** cho Bài 14; tái dùng ValueGrid làm ma trận Attention (Bài 13/15).

### Giai Đoạn 7: Hoàn Thiện & Phát Hành
- [ ] `npm test` xanh 100% cho toàn bộ 15 bài + `shared/`.
- [ ] Kiểm tra breakpoint <900px và điều hướng bàn phím trên cả 15 trang.
- [ ] `npm run build`, deploy static bundle (GitHub Pages/Cloudflare Pages) — không cần cấu hình fallback route.
