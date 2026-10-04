# 📋 Kế Hoạch Triển Khai: TensorPlay
### *Nền Tảng Tương Tác Trực Quan Hóa Toán Học & Kỹ Nghệ Hệ Thống AI (DLSys Visual Lab)*

---

## 🎯 I. Mục Tiêu & Triết Lý Thiết Kế

1. **Giải quyết triệt để vấn đề "Toán dễ nhưng khó tưởng tượng":**
   - Biến các khái niệm ma trận trừu tượng thành các thực thể vật lý trực quan (khuôn mẫu dập ảnh, van một chiều cơ học, bảng điểm thời gian thực).
   - Phản hồi tức thì (**Instant Feedback Loop**): Click/kéo chuột ở đâu thì đồ thị và công thức toán nhảy số tương ứng ngay lập tức.
2. **Kiến trúc đóng gói module độc lập (Package-per-Lesson):**
   - Mỗi bài học là một **"gói tự trị" (autonomous package)** chứa đầy đủ logic toán, kịch bản dẫn dắt và **thư mục tài nguyên riêng** (hình ảnh SVG, icon, hiệu ứng âm thanh, mock data).
   - Hệ thống cốt lõi (**Core Engine**) hoàn toàn độc lập với nội dung bài học. Thêm bài mới chỉ việc tạo thêm một thư mục bài học, không cần sửa lại mã nguồn giao diện.
3. **Thẩm mỹ cao cấp (Modern Developer Experience):**
   - Dark mode chuẩn công nghệ (Deep Slate / Obsidian glassmorphism), màu sắc neon phân biệt rõ ràng (Xanh lục = Trọng số dương / Thưởng, Đỏ cam = Trọng số âm / Phạt, Tím cyan = Tensor Logits).
   - Chạy trực tiếp trên trình duyệt hoặc dev server siêu nhẹ, không phụ thuộc cồng kềnh.

---

## 🏗️ II. Cấu Trúc Thư Mục Tổng Thể (Directory Architecture)

```text
tensorplay/
├── KE_HOACH_THIET_KE.md             # Tài liệu kiến trúc & kế hoạch này
├── index.html                       # Trang ứng dụng duy nhất (Application Shell)
├── package.json                     # Scripts: dev / build / test (Vite + Vitest)
├── vite.config.js                   # Cấu hình dev server, build, và test runner (Vitest)
│
├── core/                            # BỘ KHUNG ĐIỀU HÀNH DÙNG CHUNG (CORE ENGINE)
│   ├── engine.js                    # State Machine: Quản lý tiến trình, bước học, event bus
│   ├── layout.js                    # Quản lý bố cục 3 cột ⇄ tab (responsive breakpoint)
│   ├── progress.js                  # Đọc/ghi tiến độ học vào localStorage
│   ├── shortcuts.js                 # Đăng ký phím tắt điều hướng toàn cục
│   ├── styles/                      # Hệ thống Design Tokens & CSS dùng chung
│   │   ├── tokens.css               # Màu sắc, font chữ, hiệu ứng đổ bóng glassmorphism
│   │   ├── layout.css               # Grid 3 cột, splitters, tabs, breakpoint <900px
│   │   └── components.css           # Nút bấm, thanh trượt slider, card thông số
│   └── components/                  # Thư viện UI widgets tái sử dụng
│       ├── KaTeXRenderer.js         # Khối hiển thị công thức toán học động (gọi KaTeX từ CDN)
│       ├── MemoryVisualizer.js      # Khối mô phỏng thanh RAM C++ (1D array & pointer)
│       └── ProbabilityBar.js        # Thanh đo phần trăm Softmax trực quan
│
└── lessons/                         # DANH MỤC CÁC BÀI HỌC (MỖI BÀI MỘT GÓI ĐỘC LẬP)
    ├── registry.json                # Sổ danh bạ đăng ký tất cả bài học
    │
    ├── bai_01_robot_vision/         # === GÓI BÀI TẬP 1 ===
    │   ├── manifest.json            # Cấu hình bài học: Tiêu đề, số bước, câu hỏi
    │   ├── logic.js                 # Thuật toán tính toán riêng của Bài 1
    │   ├── logic.test.js            # ✅ Kiểm chứng tự động (Vitest) cho logic.js
    │   ├── custom_canvas.js         # Giao diện lưới pixel 2x2 & khuôn mẫu dập
    │   └── assets/                  # 🎨 TÀI NGUYÊN RIÊNG CỦA BÀI 1
    │       ├── robot_camera.svg     # Hình minh họa camera robot
    │       ├── sign_horizontal.svg  # Biển báo gạch ngang mẫu
    │       ├── sign_vertical.svg    # Biển báo gạch dọc mẫu
    │       └── dust_particle.svg    # Hạt bụi làm mờ pixel
    │
    ├── bai_02_softmax_loss/         # === GÓI BÀI TẬP 2 ===
    │   ├── manifest.json
    │   ├── logic.js
    │   ├── logic.test.js
    │   ├── custom_canvas.js         # Thanh trượt logits & bộ mô phỏng lóa sáng
    │   └── assets/                  # 🎨 TÀI NGUYÊN RIÊNG CỦA BÀI 2
    │       ├── sun_glare.svg        # Hiệu ứng chói nắng gây tràn số
    │       └── cliff_warning.svg    # Robot lao xuống vực vì đoán sai tự tin
    │
    ├── bai_03_sgd_cycle/            # === GÓI BÀI TẬP 3 ===
    │   ├── manifest.json
    │   ├── logic.js
    │   ├── logic.test.js
    │   └── assets/
    │
    ├── bai_04_nn_relu/              # === GÓI BÀI TẬP 4 ===
    │   ├── manifest.json
    │   ├── logic.js
    │   ├── logic.test.js
    │   └── assets/
    │       └── water_valve_relu.svg # Hình ảnh van đóng/mở ReLU
    │
    ├── bai_05_minibatch/            # === GÓI BÀI TẬP 5 ===
    │   ├── manifest.json
    │   ├── logic.test.js
    │   └── ...
    │
    └── bai_06_cpp_memory/           # === GÓI BÀI TẬP 6 ===
        ├── manifest.json
        ├── logic.test.js
        └── ...
```

> **Lưu ý về `core/lib/`:** Phiên bản trước của kế hoạch có vendor KaTeX cục bộ. Sau khi cân nhắc, dự án chọn **tải KaTeX qua CDN** (jsdelivr/cdnjs, pin version cụ thể trong `<script>`/`<link>` của `index.html`) để giữ repo nhẹ và không cần commit file build của bên thứ ba. Đổi lại, ứng dụng yêu cầu kết nối mạng khi chạy lần đầu (có thể cache qua Service Worker ở giai đoạn sau nếu cần offline).

---

## 📐 III. Chuẩn Hóa Định Dạng Gói Bài Tập (Lesson Package Contract)

Mỗi thư mục bài học trong `lessons/<ten_bai>/` tuân thủ một chuẩn giao tiếp thống nhất:

### 1. File Đặc Tả Bài Học (`manifest.json`)
Chứa toàn bộ kịch bản dẫn dắt (Socratic method):
```json
{
  "id": "bai_01_robot_vision",
  "title": "Bài 1: Tự Chế Tạo 'Mắt' Cho Robot",
  "stage": "04_candle_and_dl_systems",
  "totalSteps": 8,
  "steps": [
    {
      "step": 1,
      "badge": "Bước 1 / 8",
      "heading": "Máy tính đọc ảnh như thế nào?",
      "problem": "Camera chỉ trả về các con số 0 và 1...",
      "challenge": "Hãy click vào 4 ô vuông để vẽ biển báo Gạch Ngang và quan sát vector 1D bên dưới.",
      "takeaway": "Ảnh 2D trong bộ nhớ máy tính luôn được trải phẳng thành 1 hàng số.",
      "assetsUsed": ["robot_camera.svg"]
    },
    {
      "step": 4,
      "badge": "Bước 4 / 8",
      "heading": "Vũ khí bí mật: Trọng số âm",
      "problem": "Đèn pha quá sáng khiến robot bị lừa...",
      "challenge": "Hãy thử gán giá trị -1 vào hai ô bên dưới của khuôn mẫu.",
      "takeaway": "Trọng số dương là bằng chứng ủng hộ, trọng số âm là bằng chứng bác bỏ!"
    }
  ]
}
```

### 2. File Thuật Toán Riêng Của Bài (`logic.js`)
Xuất ra (export) các hàm xử lý trạng thái và tính toán:
```javascript
export class LessonLogic {
  constructor() {
    this.state = {
      pixels: [1, 1, 0, 0],
      weights: [1, 1, -1, -1]
    };
  }

  // Được gọi khi người dùng tương tác trên Canvas
  onUserUpdate(newState) {
    this.state = { ...this.state, ...newState };
    return this.calculate();
  }

  // Tính toán kết quả cho Cột 3 (Toán & Bộ nhớ)
  calculate() {
    const { pixels, weights } = this.state;
    const dotProduct = pixels.reduce((sum, p, i) => sum + p * weights[i], 0);
    
    return {
      score: dotProduct,
      formulaKaTeX: `Z = \\sum x_i w_i = ${dotProduct.toFixed(1)}`,
      cppOffset: 3,
      cppValue: dotProduct
    };
  }
}
```

### 3. Quy Tắc Nội Dung KaTeX An Toàn Trong `manifest.json`
Mọi chuỗi KaTeX chèn vào `problem`, `challenge`, `formulaKaTeX` **phải tuân thủ chuẩn chống lỗi hiển thị**:
- Ô trống trong ma trận/vector toán học: dùng `?` (ví dụ `\begin{bmatrix} ? & ? \\ ? & ? \end{bmatrix}`), **không** dùng `\text{___}`.
- Ô trống trong văn bản dẫn dắt (ngoài môi trường toán): dùng code span Markdown `` `______` ``, không đặt trong `$...$`.
- `KaTeXRenderer.js` nên có một bộ kiểm tra lint đơn giản (regex chặn `_{3,}` hoặc `\\text{_+}` bên trong `$...$`) chạy lúc build/test để bắt lỗi này trước khi commit một `manifest.json` mới.

---

## 🖥️ IV. Thiết Kế Bố Cục Giao Diện "3 Cột Vàng" (The 3-Zone Workspace)

```
+---------------------------------------------------------------------------------------------------------+
| [LOGO] AI SYSTEMS VISUAL LAB     [Menu Bài Học ▼]     [Tiến độ: ●●●○○○○○]     [Phím tắt: ?] [Dark Mode] |
+------------------------------------+------------------------------------+-------------------------------+
|  CỘT 1: CÂU CHUYỆN & DẪN DẮT       |  CỘT 2: SÂN CHƠI TƯƠNG TÁC         |  CỘT 3: LIVE MATH & TELEMETRY |
|  (30% Width - Socratic Narrative)  |  (45% Width - Interactive Canvas)  |  (25% Width - Real-time Data) |
|                                    |                                    |                               |
|  📌 BƯỚC 4: VŨ KHÍ TRỌNG SỐ ÂM    |  [ KHU VỰC THAO TÁC TRỰC QUAN ]    |  📐 CÔNG THỨC TOÁN SỐNG:      |
|                                    |                                    |                               |
|  ❓ Vấn Đề Thực Tế:                |   Ảnh đầu vào X (Click để bật/tắt):|  Z = X · W                    |
|  Đèn pha xe đối diện làm sáng cả   |   +---+---+                        |  Z = [1, 1, 1, 1] · [1, 1,    |
|  4 ô pixel, robot tưởng là gạch    |   | 1 | 1 | (Sáng)                 |                      -1, -1]^T|
|  ngang nên phanh gấp nguy hiểm!    |   +---+---+                        |  Z = 1 + 1 - 1 - 1 = 0.0      |
|                                    |   | 1 | 1 | (Sáng)                 |                               |
|  🔧 Thử Thách Của Bạn:             |   +---+---+                        |  📊 PHÂN TÍCH ĐIỂM SỐ:        |
|  Hãy chỉnh trọng số ở 2 ô dưới     |                  ×                 |  Điểm biển Dừng : [ 0.0 ] ░░  |
|  thành số âm để trừ điểm!          |   Khuôn mẫu W (Thanh trượt số):    |  Điểm Đi thẳng  : [ 0.0 ] ░░  |
|                                    |   +-----+-----+                    |  => Đèn pha bị triệt tiêu!    |
|  🔎 Đúc Kết:                       |   | +1  | +1  | (Xanh: Thưởng)     |                               |
|  Trọng số âm chính là "bằng chứng  |   +-----+-----+                    |  💾 BỘ NHỚ RAM C++ (Row-major)|
|  bác bỏ".                          |   | -1  | -1  | (Đỏ: Phạt)         |  Mảng Z_flat[4]:              |
|                                    |   +-----+-----+                    |  [ 0.0,  0.0,  0.0,  0.0 ]    |
|  [◀ Bước trước]     [Bước sau ▶]   |   [ Reset Ảnh ]  [ Thử Đèn Pha ]   |  Offset: r*N + c = index [3]  |
+------------------------------------+------------------------------------+-------------------------------+
```

---

## 🎨 V. Hệ Thống Thẩm Mỹ & Phong Cách Đồ Họa (Visual Aesthetics)

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

## 📱 VI. Khả Năng Tiếp Cận & Responsive Fallback (Accessibility & Breakpoints)

1. **Breakpoint < 900px (tablet/mobile):** Layout 3 cột gập thành **thanh tab dưới cùng** (Câu Chuyện / Sân Chơi / Toán Học), chỉ hiển thị 1 cột tại một thời điểm. `core/layout.js` chịu trách nhiệm chuyển đổi chế độ Grid ⇄ Tab dựa trên `matchMedia('(max-width: 900px)')`.
2. **Không phụ thuộc hoàn toàn vào màu sắc:** Mọi cặp ngữ nghĩa Xanh (Thưởng) / Đỏ (Phạt) đều đi kèm **ký hiệu hình học dự phòng** (`+` / `−`, hoặc icon ✓ / ✕) để người dùng mù màu vẫn phân biệt được, không chỉ dựa vào hue.
3. **Tương phản & kích thước chữ:** Văn bản chính tối thiểu đạt tỉ lệ tương phản WCAG AA trên nền Dark OLED; công thức KaTeX không nhỏ hơn 16px để đọc rõ trên màn hình nhỏ.
4. **Điều hướng bàn phím:** Toàn bộ thao tác chuyển bước/bài học phải thực hiện được bằng bàn phím (xem mục VII.2), không bắt buộc dùng chuột.

---

## ⌨️ VII. Điều Hướng & Lưu Tiến Độ (Navigation & Progress Persistence)

### 1. Lưu Tiến Độ Học (`core/progress.js`)
- Tiến độ được lưu vào `localStorage` dưới khóa `tensorplay:progress`, dạng `{ "bai_01_robot_vision": { "lastStep": 4, "completed": false }, ... }`.
- Chỉ dấu `[Tiến độ: ●●●○○○○○]` ở header tính bằng tổng số bước đã hoàn thành chia cho tổng số bước của toàn bộ `registry.json`, đọc trực tiếp từ `progress.js` — không hard-code.
- Reset tiến độ là một hành động rõ ràng (nút "Làm lại từ đầu" trong menu), không tự động xóa khi người dùng tải lại trang.

### 2. Bảng Phím Tắt (`core/shortcuts.js`)
| Phím | Hành động |
|---|---|
| `←` / `→` | Lùi / Tiến một bước trong bài học hiện tại |
| `1`–`6` | Nhảy trực tiếp đến Bài 1–6 |
| `R` | Reset trạng thái Canvas của bước hiện tại (tương đương nút "Reset") |
| `?` | Mở/đóng panel trợ giúp phím tắt (overlay mờ, không điều hướng rời trang) |
| `Esc` | Đóng mọi overlay đang mở |

Panel trợ giúp (`?`) hiển thị chính bảng này, tự sinh từ cấu hình trong `shortcuts.js` để không bị lệch tài liệu.

---

## 🛠️ VIII. Ngăn Xếp Công Nghệ & Quy Trình Phát Triển (Tech Stack & Dev Workflow)

- **Dev server & build:** [Vite](https://vite.dev) — `npm run dev` cho HMR khi phát triển, `npm run build` xuất ra `dist/` (đã có trong `.gitignore`). Không cần framework UI (React/Vue); `core/engine.js` tự quản lý state bằng vanilla JS + DOM API.
- **KaTeX:** Nạp qua CDN (jsdelivr hoặc cdnjs), pin phiên bản cụ thể trong `<link>`/`<script>` của `index.html` (ví dụ `katex@0.16.x`) để tránh breaking change âm thầm.
- **`package.json` scripts tối thiểu:**
  ```json
  {
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "test": "vitest run"
    },
    "devDependencies": {
      "vite": "^6.0.0",
      "vitest": "^3.0.0"
    }
  }
  ```
- **Không có runtime dependency ngoài KaTeX (CDN)** — giữ đúng triết lý "chạy nhẹ, không cồng kềnh" đã nêu ở Mục I.3.

---

## ✅ IX. Chiến Lược Kiểm Thử & Kiểm Chứng Tự Động (Testing & Verification)

Theo quy chuẩn thiết kế bài tập toán học, **mọi `logic.js` phải đi kèm script kiểm chứng tự động** chạy trước khi bàn giao bài học. Dự án dùng **Vitest** (`npm test`) cho mục đích này:

1. **Mỗi bài học có `logic.test.js` cạnh `logic.js`**, kiểm tra:
   - Kết quả tính toán khớp với giá trị kỳ vọng ở các bước mốc trong `manifest.json` (ví dụ: bước 4 của Bài 1 phải cho `score = 0.0` khi `weights = [1,1,-1,-1]`).
   - Các trường hợp biên đặc thù của từng bài: Bài 2 — logits lớn gây tràn số (`Infinity`/`NaN`) phải được "Safe Softmax" trung hòa đúng cách; Bài 4 — trọng số khởi tạo toàn 0 phải thể hiện đúng "lời nguyền nơ-ron tê liệt" (gradient = 0 ở mọi nơ-ron ẩn).
   - Tính bất biến của offset bộ nhớ: `index = r * N + c` trả về đúng vị trí cho mọi `(r, c)` hợp lệ, và báo lỗi/rõ ràng khi `r, c` vượt biên (Bài 6).
2. **Chạy test là điều kiện bắt buộc trước khi thêm bài học mới vào `registry.json`** — không merge một gói bài học nếu `npm test` chưa xanh.
3. **Lint nội dung KaTeX** (xem Mục III.3) được gộp vào cùng bước test, quét toàn bộ `manifest.json` trong `lessons/**` để chặn sớm lỗi `ParseError` trước khi người học chạm vào UI.

---

## 📝 X. Hướng Dẫn Thêm Bài Học Mới (Contributor Checklist)

1. Tạo thư mục `lessons/bai_0N_<ten_bai>/` theo đúng Hợp Đồng Gói Bài Tập (Mục III).
2. Viết `manifest.json` với kịch bản Socratic đầy đủ: `problem` → `challenge` → `takeaway` cho mỗi bước, tuân thủ quy tắc KaTeX an toàn (Mục III.3).
3. Viết `logic.js` xuất `class LessonLogic` với `onUserUpdate()` và `calculate()`.
4. Viết `logic.test.js` kiểm chứng toàn bộ giá trị số trong `manifest.json` (Mục IX.1) — chạy `npm test` phải xanh.
5. Bổ sung `assets/` nếu bài học cần minh họa SVG riêng; đặt tên file mô tả đúng nội dung (không dùng `asset1.svg`, `img2.png`...).
6. Đăng ký bài học mới vào `lessons/registry.json` (id, title, tags, đường dẫn).
7. Kiểm tra bằng tay ở cả 2 chế độ layout: desktop (3 cột) và breakpoint <900px (tab) — xem Mục VI.

---

## 🚀 XI. Lộ Trình Triển Khai Chi Tiết (Execution Roadmap)

### Giai Đoạn 0: Khởi Tạo Tooling
- [ ] `npm init`, cài `vite` + `vitest` làm devDependencies, tạo `vite.config.js` tối giản.
- [ ] Thêm `index.html` tham chiếu KaTeX qua CDN (pin version) và script `type="module"` trỏ vào `core/engine.js`.
- [ ] Xác nhận `npm run dev` chạy được trang trắng, `npm test` chạy được (dù chưa có test) trước khi viết tính năng.

### Giai Đoạn 1: Dựng Bộ Khung Nền Tảng (Core Framework Shell)
- [ ] Thiết lập `core/styles/` (tokens, layout, components) và `core/engine.js` (state machine + event bus).
- [ ] Xây dựng layout 3 cột responsive, hỗ trợ thu/phóng từng cột; thêm breakpoint <900px gập thành tab (Mục VI.1).
- [ ] Tích hợp `KaTeXRenderer.js` để render công thức toán học sắc nét không độ trễ.
- [ ] Xây dựng cơ chế tải bài động (`Dynamic Lesson Loader`) dựa trên `registry.json`.
- [ ] Dựng `core/progress.js` (đọc/ghi `localStorage`) và `core/shortcuts.js` (phím tắt + panel trợ giúp `?`) theo Mục VII.

### Giai Đoạn 2: Triển Khai Hoàn Chỉnh Bài 1 (Visual Robot Vision Package)
- [ ] Tạo gói `lessons/bai_01_robot_vision/` gồm `manifest.json`, `logic.js`, `logic.test.js`, thư mục `assets/`.
- [ ] Viết `logic.test.js` kiểm chứng toàn bộ bước mốc trong `manifest.json` trước khi dựng UI (Mục IX.1) — chạy `npm test` xanh.
- [ ] Dựng component bàn cờ pixel $2 \times 2$ có thể click tương tác trực tiếp.
- [ ] Dựng component khuôn mẫu dập trọng số (màu xanh cho $+1$, màu đỏ cho $-1$, kèm ký hiệu `+`/`−` dự phòng cho người mù màu).
- [ ] Kết nối thời gian thực: Click pixel $\to$ khuôn dập nhân tức thì $\to$ điểm số $Z$ nhảy $\to$ ô nhớ RAM C++ highlight vị trí `offset`.

### Giai Đoạn 3: Mở Rộng Sang Bài 2 Đến Bài 6
- [ ] **Bài 2:** Bộ mô phỏng lóa sáng (Logits Slider $0 \to 1000 \to \text{NaN}$) và cần gạt Safe Softmax. `logic.test.js` phải bao phủ case tràn số.
- [ ] **Bài 3:** Trình diễn chu trình SGD từng nhịp (Forward $\to$ Loss $\to$ Backward $\to$ Update) kèm trọng số đổi màu khi học.
- [ ] **Bài 4:** Mô phỏng van cơ học ReLU chặn dòng gradient. `logic.test.js` phải bao phủ case "khởi tạo trọng số bằng 0".
- [ ] **Bài 5:** Băng chuyền xử lý Mini-batch $B=2$ song song.
- [ ] **Bài 6:** Thanh đo dung lượng RAM trực quan cảnh báo Memory Leak qua từng epoch. `logic.test.js` phải bao phủ case `r, c` vượt biên mảng.

### Giai Đoạn 4: Hoàn Thiện & Phát Hành (Polish & Release)
- [ ] Kiểm tra toàn bộ 6 bài ở breakpoint <900px (chế độ tab) trên thiết bị thật hoặc DevTools responsive mode.
- [ ] Chạy `npm test` cho toàn bộ `lessons/**/logic.test.js` + lint KaTeX trên mọi `manifest.json` (Mục IX) — phải xanh 100% trước khi gắn cờ "release".
- [ ] Kiểm tra bàn phím: toàn bộ 6 bài có thể hoàn thành chỉ bằng `←/→/1-6/R/?/Esc`, không cần chuột.
- [ ] Rà lại `registry.json` khớp đúng 6 bài, đúng thứ tự, đúng tag; xác nhận chỉ dấu tiến độ ở header tính đúng từ `progress.js`.
- [ ] `npm run build` ra `dist/` sạch, mở bằng static server xác nhận chạy đúng như `npm run dev`.
