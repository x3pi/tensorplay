# 📋 Kế Hoạch Triển Khai: TensorPlay
### *Nền Tảng Tương Tác Trực Quan Hóa Toán Học & Kỹ Nghệ Hệ Thống AI (DLSys Visual Lab)*

> 💡 **Cập nhật Kiến trúc**: Kế hoạch tái cấu trúc thư viện bài học tự quản và lộ trình linh hoạt (`lessons/<slug>/`, `curriculum/paths/`, cross-refs `[[lesson:slug]]`) được đặc tả chi tiết tại [KE_HOACH_CAU_TRUC_LINH_HOAT.md](KE_HOACH_CAU_TRUC_LINH_HOAT.md).

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
├── KE_HOACH_THIET_KE.md             # Tài liệu kiến trúc này
├── KE_HOACH_CAU_TRUC_LINH_HOAT.md   # Kế hoạch & lý do của cấu trúc "kho bài + lộ trình"
├── index.html                       # Trang DANH MỤC: chọn lộ trình, lọc chủ đề, tìm kiếm; đọc catalog sinh tự động
├── package.json                     # Scripts: dev / build / test / check / verify / catalog / new-lesson
├── vite.config.js                   # Multi-page build: quét lessons/**/index.html làm entry point
│
├── lessons/                         # 📦 KHO BÀI HỌC — MỖI BÀI = 1 THƯ MỤC TỰ ĐỦ, KHÔNG SỐ TRONG TÊN
│   └── <slug>/
│       ├── index.html               # Trang bài (URL: /lessons/<slug>/)
│       ├── logic.js                 # LessonLogic + PRESETS (chạy được trong Node)
│       ├── logic.test.js            # Vitest kiểm chứng logic
│       ├── kiem_tra.py              # Kiểm chứng số học độc lập bằng numpy (AGENTS.md)
│       ├── lesson.json              # Metadata: id, title, summary, topic, tags, prerequisites, aliases...
│       └── assets/                  # (tùy chọn) SVG/ảnh riêng
│
├── curriculum/                      # THỨ TỰ & NHÓM — chỗ DUY NHẤT chứa thứ tự bài
│   ├── topics.json                  # Danh mục chủ đề (nhãn, màu)
│   ├── paths/*.json                 # Các lộ trình (main, llm-systems, cpp-memory, cmu-10414...)
│   └── legacy-map.json              # URL/id cũ → slug mới (tương thích ngược)
│
├── public/curriculum/catalog.json   # SINH TỰ ĐỘNG từ lessons/*/lesson.json + curriculum/** (commit vào git)
│
├── shared/                          # 🧩 THƯ VIỆN DÙNG CHUNG
│   ├── curriculum.js                # Nạp catalog, tra bài theo slug, lộ trình, prev/next, resolveRefs()
│   ├── lesson-context.js            # getLessonSlug() — slug của trang hiện tại
│   ├── progress.js                  # Tiến độ học (có tra alias id cũ)
│   ├── math.js, katex-render.js     # Hàm toán thuần, render KaTeX
│   ├── *.test.js                    # math, katex-lint, curriculum-consistency, progress...
│   ├── styles/                      # tokens.css, layout.css, components.css
│   └── components/                  # StepWizard, ValueGrid, LiveSlider, MemoryTape, ScoreBar,
│                                    # PresetPicker, CommentSection, LessonNav, AiTutor, LayoutResizer
│
├── templates/lesson/                # Mẫu để `npm run new-lesson` sao chép
└── tools/                           # build-catalog.mjs, new-lesson.mjs, run_checks.py, generate_legacy_redirects.mjs
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

Mỗi bài trong `lessons/<slug>/` gồm các file bắt buộc `index.html`, `logic.js`, `logic.test.js`, `kiem_tra.py`, `lesson.json` (+ `assets/` nếu cần). Các mục dưới đây mô tả nội dung từng file (tên cũ `<ten_bai>.logic.js` nay là `logic.js`):

### 1. File Thuật Toán (`logic.js`)
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

### 2. File Kiểm Chứng (`logic.test.js`)
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

### 3. File Trang (`index.html`)
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
- `lessons/robot_vision/?step=4&preset=headlight_glare` (thêm `&path=llm-systems` để chọn lộ trình điều hướng)
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

## 🗺️ IX. Lộ Trình & Chủ Đề (Curriculum — thay cho "track theo homework")

Thứ tự bài **không còn nằm trong tên file hay tiêu đề**. Nó được khai báo trong `curriculum/paths/*.json`; chủ đề nằm trong `curriculum/topics.json`; danh sách bài thực tế là các thư mục trong `lessons/` (xem `public/curriculum/catalog.json` hoặc trang chủ).

- **Lộ trình:** `main` (đầy đủ), `llm-systems` (đường nhanh tới LLM), `cpp-memory` (bộ nhớ & C++/CUDA), `cmu-10414` (đang `planned`, chỉ lập khi đối chiếu được đề bài CMU thật).
- **Chủ đề:** foundations, memory-systems, autograd, training-stability, cnn-data, gpu, transformer, llm-serving.
- **Tiên quyết:** khai báo mềm trong `lesson.json` (`prerequisites`), được test chặn chu trình và kiểm tra xuất hiện trước trong `main`.
- **Tham chiếu chéo trong văn bản:** dùng `[[lesson:<slug>]]`, không bao giờ dùng "Bài NN".
- **Số hiển thị** ("Bài 7/34") được tính lúc chạy theo lộ trình đang chọn.

### Backlog ý tưởng bài mới (chưa làm)
Đã có bài cho: overfitting & validation, LR schedule, tokenization & embedding, roofline, data parallel & all-reduce, ZeRO/FSDP, khối Transformer (đếm tham số), sampling/decoding, quantization, gradient accumulation & clipping, GQA/MQA, RoPE, LoRA, Mixture-of-Experts, và bài tổng hợp mini-GPT. Còn thiếu (theo mức ưu tiên):
- Tensor Parallelism và Pipeline Parallelism (cắt ma trận và cắt theo tầng, bong bóng pipeline).
- Continuous batching và PagedAttention (quản lý KV-Cache như bộ nhớ ảo).
- Speculative decoding (mô hình nháp + mô hình kiểm).
- Kernel fusion (gộp phép tính để giảm băng thông, nối tiếp bài Roofline).
- RLHF / DPO ở mức toán tối thiểu (hàm mất mát so sánh ưa thích).
- Đánh giá mô hình: perplexity và cách đo (nối tiếp cross-entropy).

Thêm/sửa/đổi thứ tự/đổi tên/xóa bài: xem Mục XII.

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

1. **Kiểm thử logic số học từng bài** (`lessons/<slug>/logic.test.js`):
   - Khớp 100% giá trị kỳ vọng ở các preset/bước quan trọng.
   - Bao phủ trường hợp biên: Bài 01 `pixels=[1,1,1,1]` → `score=0` (đèn pha triệt tiêu); Bài 02 `logits=[1000,1000]` → Safe Softmax phải ra `[0.5,0.5]` không `NaN`; Bài 06 trọng số = 0 → gradient bằng nhau mọi hidden unit; Bài 14 KV-Cache chỉ thêm đúng 1 slot mỗi token mới.
2. **`shared/math.test.js`:** kiểm `dot()`, `safeSoftmax()`, `relu()`, `offset2D()` — vì các hàm này được tái dùng ở nhiều bài, lỗi ở đây ảnh hưởng dây chuyền.
3. **`shared/katex-lint.test.js`:** quét toàn bộ `lessons/**/*.{html,js}`, chặn `_` trần trong `$...$`/`bmatrix` hoặc `\text{___}`.
4. **Cổng chất lượng:** `npm test` phải xanh 100% trước khi một bài được thêm vào lộ trình (`npm run check` = kiểm tra catalog + Vitest; `npm run verify` thêm bộ kiểm chứng Python).

---

## 📝 XII. Hướng Dẫn Thêm / Sửa Bài Học (Contributor Checklist)

**Thêm bài:** `npm run new-lesson -- <slug> --topic <chu_de> --path main --after <slug_khac>` rồi:
1. Viết `logic.js` (`LessonLogic`: `reset/applyPreset/onUserUpdate/calculate` + export `PRESETS`) và `logic.test.js` bao phủ mốc giá trị + trường hợp biên.
2. Viết `index.html` từ mẫu `templates/lesson/` (STEPS Socratic, `STEP_COMMENTS`, tham chiếu bài khác bằng `[[lesson:<slug>]]`).
3. Viết `kiem_tra.py` kiểm chứng độc lập bằng numpy; điền `lesson.json` (summary, tags, prerequisites...).
4. `npm run verify` xanh; kiểm tay: desktop 3 cột, mobile tab (<900px), điều hướng bằng bàn phím.

| Muốn | Làm |
|---|---|
| Đổi thứ tự | Sửa `curriculum/paths/<id>.json`, không sửa file bài |
| Tạo lộ trình mới | Thêm `curriculum/paths/<id>.json` |
| Đổi tên hiển thị | Sửa `title` trong `lesson.json` |
| Đổi slug | `git mv` thư mục, đổi `id`, thêm slug cũ vào `aliases`, cập nhật `legacy-map.json` và các `[[lesson:…]]` (test chỉ ra chỗ sót) |
| Xóa bài | Xóa thư mục và slug khỏi lộ trình (test chỉ ra tham chiếu thừa) |

---

## 🚀 XIII. Lộ Trình Triển Khai Ban Đầu (Execution Roadmap — LỊCH SỬ)

> Mục này ghi lại kế hoạch dựng dự án ban đầu theo track `hw0…hw4`; cấu trúc hiện hành là `lessons/` + `curriculum/` (Mục II, IX, XII). Giữ lại để tham khảo lịch sử.

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
- [ ] `npm test` xanh 100% cho toàn bộ 31 bài + `shared/`.
- [ ] Kiểm tra breakpoint <900px và điều hướng bàn phím trên cả 15 trang.
- [ ] `npm run build`, deploy static bundle (GitHub Pages/Cloudflare Pages) — không cần cấu hình fallback route.
