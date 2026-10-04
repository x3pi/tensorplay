# 📋 Kế Hoạch Triển Khai: TensorPlay
### *Nền Tảng Tương Tác Trực Quan Hóa Toán Học & Kỹ Nghệ Hệ Thống AI (DLSys Visual Lab)*

---

## 🎯 I. Mục Tiêu & Triết Lý Thiết Kế

1. **Giải quyết triệt để vấn đề "Toán dễ nhưng khó tưởng tượng":**
   - Biến các khái niệm ma trận trừu tượng thành các thực thể vật lý trực quan (khuôn mẫu dập ảnh, van một chiều cơ học, bảng điểm thời gian thực).
   - Phản hồi tức thì (**Instant Feedback Loop**): Click/kéo chuột ở đâu thì đồ thị và công thức toán nhảy số tương ứng ngay lập tức.
2. **Nguyên tắc "Hạt nhân Khái niệm Độc Lập" (Atomic Concept Sandbox):**
   - Mỗi bài tập chỉ tập trung giải quyết triệt để **đúng một 'Aha! Moment'** (một nút thắt tư duy duy nhất), không nhồi nhét.
   - **Không có phụ thuộc cứng (Zero Hard Dependencies):** Người học có thể vào thẳng bất kỳ bài nào mà không bắt buộc phải hoàn thành các bài trước.
   - **Tự cấp dữ liệu mồi (Self-contained Presets):** Mỗi bài đi kèm sẵn các nút bấm thử nghiệm (vd: *Ảnh chuẩn*, *Ảnh dính bụi*, *Đèn pha*) để tương tác ngay lập tức.
   - **Hỗ trợ Deep-link:** Mỗi bài/mỗi bước có URL hash riêng (ví dụ `/#/bai_01_robot_vision?step=4`) giúp dễ dàng chia sẻ, lưu bookmark hoặc nhúng vào tài liệu lý thuyết.
3. **Kiến trúc đóng gói module độc lập (Package-per-Lesson):**
   - Mỗi bài học là một **"gói tự trị" (autonomous package)** chứa đầy đủ logic toán, kịch bản dẫn dắt và **thư mục tài nguyên riêng** (hình ảnh SVG, icon, hiệu ứng âm thanh, mock data).
   - Hệ thống cốt lõi (**Core Engine**) hoàn toàn độc lập với nội dung bài học. Thêm bài mới chỉ việc tạo thêm một thư mục bài học, không cần sửa lại mã nguồn giao diện.
4. **Thẩm mỹ cao cấp (Modern Developer Experience):**
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
│   ├── router.js                    # Hash router: Điều hướng deep-link (#/lesson-id?step=N)
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

Mỗi thư mục bài học trong `lessons/<ten_bai>/` tuân thủ một chuẩn giao tiếp thống nhất, đảm bảo tính tự trị và khả năng mở rộng không giới hạn:

### 1. File Đặc Tả Bài Học (`manifest.json`)
Chứa toàn bộ siêu dữ liệu, phân loại môn học, các nút thử nghiệm nhanh (presets) và kịch bản dẫn dắt theo phương pháp Socratic:
```json
{
  "id": "bai_01_robot_vision",
  "title": "Bài 1: Tự Chế Tạo 'Mắt' Cho Robot",
  "stage": "04_candle_and_dl_systems",
  "courseMapping": {
    "course": "CMU 10-414 / 10-714",
    "track": "HW0: Tensor Basics & C++ Memory",
    "topic": "Ma trận 1D Flatten, Dot Product & Trọng số âm"
  },
  "difficulty": "beginner",
  "estimatedMinutes": 8,
  "tags": ["computer-vision", "linear-algebra", "dot-product", "c-plus-plus-memory"],
  "totalSteps": 8,
  "presets": [
    {
      "id": "horizontal_sign",
      "label": "Ảnh Chuẩn (Gạch Ngang)",
      "description": "Hai pixel hàng trên bật sáng, hai pixel hàng dưới tối",
      "state": { "pixels": [1, 1, 0, 0] }
    },
    {
      "id": "dusty_sign",
      "label": "Ảnh Dính Bụi",
      "description": "Một pixel dưới bị nhiễu mờ do bụi bẩn trên camera",
      "state": { "pixels": [1, 1, 0.5, 0] }
    },
    {
      "id": "headlight_glare",
      "label": "Đèn Pha Chói Lóa",
      "description": "Cả 4 pixel đều bị kích thích cực đại",
      "state": { "pixels": [1, 1, 1, 1] }
    }
  ],
  "steps": [
    {
      "step": 1,
      "badge": "Bước 1 / 8",
      "heading": "Máy tính đọc ảnh như thế nào?",
      "problem": "Camera chỉ trả về các con số 0 và 1, máy tính chưa hiểu ý nghĩa hình học...",
      "challenge": "Hãy click vào 4 ô vuông để vẽ biển báo Gạch Ngang và quan sát vector 1D bên dưới.",
      "takeaway": "Ảnh 2D trong bộ nhớ máy tính luôn được trải phẳng (flatten) thành 1 hàng số liên tục.",
      "assetsUsed": ["robot_camera.svg"]
    },
    {
      "step": 4,
      "badge": "Bước 4 / 8",
      "heading": "Vũ khí bí mật: Trọng số âm",
      "problem": "Đèn pha quá sáng khiến robot bị lóa, nhận nhầm là biển báo nguy hiểm...",
      "challenge": "Hãy thử gán giá trị -1 vào hai ô bên dưới của khuôn mẫu dập trọng số.",
      "takeaway": "Trọng số dương là bằng chứng ủng hộ, trọng số âm chính là 'bằng chứng bác bỏ'!",
      "assetsUsed": ["dust_particle.svg"]
    }
  ]
}
```

### 2. Thư Mục Tài Nguyên Riêng (`assets/`) & Cơ Chế Phân Giải Đường Dẫn
- Mỗi bài học sở hữu một thư mục `assets/` riêng chứa file SVG, icon, âm thanh phản hồi hoặc mock data nhỏ.
- **Quy tắc cô lập (Asset Isolation):** Tuyệt đối không dùng chung assets giữa các bài học để tránh phụ thuộc chéo. Nếu hai bài cần icon tương tự, mỗi bài giữ một bản sao hoặc chuyển vào `core/assets/` nếu là tài nguyên hệ thống chung (như logo ứng dụng, icon play/pause).
- **Hàm phân giải URL chuẩn (`getAssetUrl`):**
  Trong `core/engine.js`, cung cấp hàm helper:
  ```javascript
  // Trả về URL hợp lệ trong cả môi trường Vite Dev và Vite Production Bundle
  getAssetUrl(lessonId, relativeAssetPath) {
    return new URL(`../lessons/${lessonId}/assets/${relativeAssetPath}`, import.meta.url).href;
  }
  ```

### 3. File Thuật Toán Riêng Của Bài (`logic.js`)
Xuất ra (export) lớp tính toán trạng thái độc lập, có thể chạy cả trong browser lẫn môi trường test không có DOM (headless Vitest):
```javascript
export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      pixels: [1, 1, 0, 0],
      weights: [1, 1, -1, -1]
    };
    return this.calculate();
  }

  // Nạp preset mồi dữ liệu nhanh cho người học thử nghiệm
  applyPreset(presetState) {
    this.state = { ...this.state, ...presetState };
    return this.calculate();
  }

  // Được gọi mỗi khi người dùng tương tác trên Canvas (click, kéo slider)
  onUserUpdate(partialState) {
    this.state = { ...this.state, ...partialState };
    return this.calculate();
  }

  // Tính toán kết quả cho Cột 3 (Toán & Bộ nhớ RAM)
  calculate() {
    const { pixels, weights } = this.state;
    const dotProduct = pixels.reduce((sum, p, i) => sum + p * weights[i], 0);
    
    return {
      score: dotProduct,
      formulaKaTeX: `Z = \\sum_{i=1}^{4} x_i w_i = ${dotProduct.toFixed(1)}`,
      cppOffset: 3,
      cppValue: dotProduct,
      isCorrect: dotProduct > 0.8
    };
  }
}
```

### 4. Sổ Danh Bạ Toàn Cục (`lessons/registry.json`)
Là danh bạ trung tâm để Core Engine tải danh sách bài học, phân loại theo Track DL Systems, hỗ trợ tìm kiếm và lọc theo tag:
```json
{
  "version": "1.0.0",
  "tracks": [
    { "id": "hw0", "title": "Track 0: Nền Tảng Tensor & Bộ Nhớ C++" },
    { "id": "hw1", "title": "Track 1: Động Cơ Autograd (Needle Engine)" },
    { "id": "hw2", "title": "Track 2: Module Nơ-ron & Tối Ưu Conv2D" },
    { "id": "hw3", "title": "Track 3: Tăng Tốc Phần Cứng GPU (CUDA Architecture)" },
    { "id": "hw4", "title": "Track 4: Kiến Trúc Transformer & LLM Systems" }
  ],
  "lessons": [
    {
      "id": "bai_01_robot_vision",
      "dir": "bai_01_robot_vision",
      "title": "Bài 1: Tự Chế Tạo 'Mắt' Cho Robot",
      "trackId": "hw0",
      "order": 1,
      "difficulty": "beginner",
      "estimatedMinutes": 8,
      "tags": ["computer-vision", "linear-algebra", "dot-product"]
    },
    {
      "id": "bai_02_softmax_loss",
      "dir": "bai_02_softmax_loss",
      "title": "Bài 2: Softmax & Cơn Ác Mộng Lóa Sáng",
      "trackId": "hw0",
      "order": 2,
      "difficulty": "beginner",
      "estimatedMinutes": 10,
      "tags": ["numerical-stability", "loss-function", "softmax"]
    }
  ]
}
```

### 5. Quy Tắc Nội Dung KaTeX An Toàn Trong `manifest.json`
Mọi chuỗi KaTeX chèn vào `problem`, `challenge`, `formulaKaTeX` **phải tuân thủ chuẩn chống lỗi hiển thị**:
- Ô trống trong ma trận/vector toán học: dùng `?` (ví dụ `\begin{bmatrix} ? & ? \\ ? & ? \end{bmatrix}`), **tuyệt đối không** dùng `\text{___}` vì KaTeX sẽ văng lỗi `ParseError`.
- Ô trống trong văn bản dẫn dắt (ngoài môi trường toán): dùng code span Markdown `` `______` ``, không đặt trong `$...$`.
- Bộ kiểm tra lint trong `npm test` sẽ tự động quét toàn bộ `manifest.json` để phát hiện ký tự `_` trần trong toán học.

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

## ⌨️ VII. Điều Hướng, Deep-linking & Lưu Tiến Độ (Navigation & State Engine)

### 1. Hash Router & Deep-linking (`core/router.js`)
Để đảm bảo nguyên tắc **Khái niệm Hạt nhân Độc lập (Atomic Concept Sandbox)**, bất kỳ bài học hoặc trạng thái nào cũng có thể được truy cập trực tiếp qua URL hash:
- **Cấu trúc URL:** `/#/<lesson_id>?step=<N>&preset=<preset_id>`
  - Ví dụ: `/#/bai_01_robot_vision?step=4&preset=headlight_glare`
- **Cơ chế xử lý router:**
  - Khi người dùng dán link, `core/router.js` phân tích chuỗi hash, yêu cầu `core/engine.js` nạp động module bài tương ứng.
  - Tự động nhảy đến bước `step=4` và áp dụng `preset=headlight_glare` mà **không đòi hỏi người dùng phải làm từ bước 1**.
  - Khi người dùng chuyển bước hoặc click preset trong giao diện, URL hash được cập nhật tự động bằng `history.replaceState` (không làm tải lại trang).
  - Nếu URL hash trống hoặc không hợp lệ, hệ thống tự động điều hướng về bài học gần nhất lưu trong `localStorage`, hoặc mặc định là bài đầu tiên trong `registry.json`.

### 2. Lưu Tiến Độ Học (`core/progress.js`)
- Tiến độ được lưu vào `localStorage` dưới khóa `tensorplay:progress`, dạng:
  ```json
  {
    "bai_01_robot_vision": { "lastStep": 4, "completed": false, "completedSteps": [1, 2, 3] },
    "bai_02_softmax_loss": { "lastStep": 1, "completed": false, "completedSteps": [] }
  }
  ```
- Chỉ dấu `[Tiến độ: ●●●○○○○○]` ở header tính bằng tổng số bước đã hoàn thành chia cho tổng số bước của toàn bộ `registry.json`, đọc trực tiếp từ `progress.js` — không hard-code.
- Reset tiến độ là một hành động rõ ràng (nút "Làm lại từ đầu" trong menu), không tự động xóa khi người dùng tải lại trang.

### 3. Bảng Phím Tắt Toàn Cục (`core/shortcuts.js`)
| Phím | Hành động |
|---|---|
| `←` / `→` | Lùi / Tiến một bước trong bài học hiện tại |
| `1`–`9` | Nhảy trực tiếp đến Preset 1–9 của bài học hiện tại |
| `R` | Reset trạng thái Canvas về giá trị mặc định của bước hiện tại |
| `?` | Mở/đóng panel trợ giúp phím tắt (overlay mờ, không điều hướng rời trang) |
| `Esc` | Đóng mọi overlay / modal đang mở |

Panel trợ giúp (`?`) hiển thị chính bảng này, tự sinh từ cấu hình trong `shortcuts.js` để không bị lệch tài liệu.

---

## 🗺️ VIII. Lộ Trình Ánh Xạ Khóa Học DL Systems (CMU 10-414 / 10-714 Mapping)

Dự án TensorPlay được cấu trúc xoay quanh 5 bài tập lớn (Homework tracks) kinh điển của bộ môn Deep Learning Systems (CMU 10-414 / 10-714). Tuy nhiên, **mỗi bài tập lớn được bóc tách thành các bài học tương tác độc lập (Atomic Visual Sandboxes)**, người học có thể chọn bất kỳ chủ đề nào để trải nghiệm ngay lập tức:

### Track 0: Nền Tảng Tensor & Kỹ Nghệ Bộ Nhớ C++ (HW0 Track)
*Trọng tâm: Chuyển dịch tư duy từ vòng lặp toán học sang layout bộ nhớ máy tính thực tế.*
- **Bài 01: Robot Vision & Vector Dot Product (`bai_01_robot_vision`)**
  - *Ý tưởng trực quan:* Nhận diện biển báo gạch ngang $2 \times 2$. Trọng số âm làm "bằng chứng bác bỏ" triệt tiêu đèn pha chói lóa.
  - *Góc nhìn C++:* Trải phẳng 2D thành 1D mảng liên tục, công thức dịch chuyển con trỏ `offset = r * N + c`.
- **Bài 02: Softmax & Cơn Ác Mộng Lóa Sáng (`bai_02_softmax_loss`)**
  - *Ý tưởng trực quan:* Đèn pha công suất cực đại đẩy logits lên $+1000 \to e^{1000} \to$ văng lỗi `Infinity` / `NaN`.
  - *Kỹ nghệ hệ thống:* Thanh gạt "Safe Softmax": trừ đi giá trị cực đại $\max(z)$ trước khi tính $\exp$, bảo toàn độ ổn định số học mà xác suất không đổi.
- **Bài 03: Row-Major vs Col-Major Cache Locality (`bai_03_cache_locality`)**
  - *Ý tưởng trực quan:* Trực quan hóa đường quét của đầu đọc CPU. Quét theo hàng (Row-major) nạp trúng cache L1 (Cache Hit xanh mướt); quét theo cột (Col-major) gây Cache Miss đỏ rực làm chậm hệ thống 10 lần.

### Track 1: Động Cơ Tự Động Tính Đạo Hàm (Needle Autograd Engine - HW1 Track)
*Trọng tâm: Xây dựng đồ thị tính toán (Computational Graph DAG) và lan truyền ngược.*
- **Bài 04: The Computational Graph Flow (`bai_04_autograd_graph`)**
  - *Ý tưởng trực quan:* Các node phép tính ($+, \times, \text{ReLU}$) như các trạm trung chuyển nước. Nước chảy xuôi tạo kết quả (Forward Pass), sóng dội ngược mang gradient về từng tham số (Backward Pass).
  - *Kỹ nghệ hệ thống:* Thứ tự duyệt tô-pô (Topological Sort) và cơ chế tích lũy gradient `node.grad += out_grad * local_grad`.
- **Bài 05: Reverse-mode vs Forward-mode AD (`bai_05_reverse_vs_forward_ad`)**
  - *Ý tưởng trực quan:* Bài toán 1 triệu đầu vào tham số nhưng chỉ có 1 đầu ra hàm Loss. So sánh trực tiếp: Forward-mode tốn 1 triệu lần chạy; Reverse-mode chỉ tốn đúng 1 lượt dội ngược duy nhất!
- **Bài 06: Van Kích Hoạt & Lời Nguyền Trọng Số 0 (`bai_06_activation_valves`)**
  - *Ý tưởng trực quan:* Van một chiều cơ học ReLU. Dòng gradient bị khóa chặt khi đầu vào âm (Dead ReLU).
  - *Lời nguyền khởi tạo:* Thử khởi tạo toàn bộ trọng số bằng 0 $\to$ toàn bộ tầng ẩn nhận gradient giống hệt nhau $\to$ mạng nơ-ron bị "tê liệt tư duy".

### Track 2: Thư Viện Nơ-ron & Phép Chập Tối Ưu (HW2 Track)
*Trọng tâm: Khái niệm Module, xử lý theo lô (batching) và biến đổi hình học ma trận.*
- **Bài 07: Mini-Batching Assembly Line (`bai_07_minibatch_assembly`)**
  - *Ý tưởng trực quan:* Băng chuyền công nghiệp xử lý lô dữ liệu $B=2, B=4$ song song thay vì từng mẫu đơn lẻ.
  - *Kỹ nghệ hệ thống:* Tính toán dung lượng bộ nhớ tạm thời (Activation Buffer) tăng tuyến tính theo kích thước lô $B \times C \times H \times W$.
- **Bài 08: Conv2D & Thần Chú Im2col (`bai_08_conv2d_im2col`)**
  - *Ý tưởng trực quan:* Tại sao máy tính ghét 6 vòng lặp `for` lồng nhau của phép chập?
  - *Phép màu Im2col:* Mở cuộn từng vùng trượt ảnh thành các cột ma trận và biến toàn bộ phép tích chập thành một phép nhân ma trận (GEMM) đơn lẻ siêu tốc.
- **Bài 09: Ổn Định Nội Bộ Với BatchNorm (`bai_09_batch_norm_dynamics`)**
  - *Ý tưởng trực quan:* Kéo dãn và dịch chuyển phân phối điểm số của từng batch về trung bình 0, phương sai 1.
  - *Sự khác biệt chế độ:* Công tắc chuyển đổi giữa Training (tính mean/var theo batch) và Inference (sử dụng Running Mean/Variance tích lũy).

### Track 3: Tăng Tốc Phần Cứng GPU (CUDA Architecture - HW3 Track)
*Trọng tâm: Mô hình tính toán song song hàng loạt (SIMT) và hệ thống phân cấp bộ nhớ GPU.*
- **Bài 10: CUDA Grid, Blocks & Threads (`bai_10_cuda_threads`)**
  - *Ý tưởng trực quan:* Một sân vận động chứa hàng ngàn công nhân (threads). Ánh xạ chỉ số công việc `int idx = blockIdx.x * blockDim.x + threadIdx.x`.
  - *Tình huống biên:* Xử lý an toàn khi kích thước dữ liệu không chia hết cho kích thước khối (Boundary Guard `if (idx < N)`).
- **Bài 11: Tiled Matrix Multiplication & Shared Memory (`bai_11_shared_memory_tiling`)**
  - *Ý tưởng trực quan:* DRAM ngoài của GPU giống như kho hàng xa xôi; Shared Memory giống như mặt bàn làm việc ngay trước mặt từng khối thread.
  - *Kỹ thuật Tiling:* Chia ma trận thành các block $2 \times 2$, nạp chung vào Shared Memory bằng hàm đồng bộ `__syncthreads()`, cắt giảm 80% lưu lượng truy cập DRAM chậm chạp.
- **Bài 12: Memory Coalescing & Bank Conflicts (`bai_12_coalescing_and_banks`)**
  - *Ý tưởng trực quan:* Trạm thu phí cao tốc. Các thread đọc bộ nhớ liền kề nhau được gom thành 1 giao dịch bus duy nhất (Coalesced Access); đọc nhảy cóc phân tán làm nghẽn bus bộ nhớ.

### Track 4: Kiến Trúc Transformer & LLM Systems (HW4 Track)
*Trọng tâm: Cơ chế chú ý (Attention), bộ nhớ đệm suy luận (KV-Cache) và tối ưu hóa I/O.*
- **Bài 13: Scaled Dot-Product Self-Attention (`bai_13_self_attention`)**
  - *Ý tưởng trực quan:* Chiếu đèn pin tìm kiếm. Query tìm kiếm Key tương ứng để tạo bảng điểm tương đồng, nhân chia tỉ lệ $\sqrt{d}$ để tránh bão hòa Softmax.
  - *Mặt nạ Causal Mask:* Tam giác che phủ tương lai cho các mô hình tự hồi quy (Autoregressive LLM).
- **Bài 14: KV-Cache Anatomy (`bai_14_kv_cache_anatomy`)**
  - *Ý tưởng trực quan:* Tại sao khi sinh từng từ (token-by-token generation), ta không cần tính lại toàn bộ lịch sử từ đầu?
  - *Bảng đệm KV-Cache:* Giữ lại vector $K, V$ của các từ đã qua, chỉ tính Query cho từ mới nhất. Tiết kiệm từ độ phức tạp $O(N^2)$ xuống $O(N)$ tính toán thừa.
- **Bài 15: Trực Quan Hóa FlashAttention Tiling (`bai_15_flash_attention_concept`)**
  - *Ý tưởng trực quan:* Tại sao ma trận Attention $N \times N$ là thủ phạm gây tràn bộ nhớ GPU khi văn bản dài?
  - *Kỹ thuật FlashAttention:* Cắt nhỏ ma trận thành từng block nạp vào SRAM của GPU, tính toán Softmax trực tuyến (Online Softmax Scaling) mà không bao giờ phải lưu toàn bộ ma trận $N \times N$ khổng lồ ra HBM.

---

## 🛠️ IX. Ngăn Xếp Công Nghệ & Quy Trình Phát Triển (Tech Stack & Dev Workflow)

- **Dev server & build:** [Vite](https://vite.dev) — `npm run dev` cho HMR khi phát triển, `npm run build` xuất ra thư mục tĩnh `dist/` (đã có trong `.gitignore`). Không dùng framework UI nặng nề (React/Vue/Angular); `core/engine.js` tự quản lý state bằng vanilla JS tinh gọn và chuẩn DOM API.
- **KaTeX:** Nạp qua CDN (jsdelivr/cdnjs), pin phiên bản cụ thể trong `<link>`/`<script>` của `index.html` (ví dụ `katex@0.16.21`) để giữ repo siêu nhẹ và không commit file build bên thứ ba.
- **`package.json` scripts:**
  ```json
  {
    "name": "tensorplay",
    "version": "0.1.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "test": "vitest run",
      "test:watch": "vitest"
    },
    "devDependencies": {
      "vite": "^6.0.0",
      "vitest": "^3.0.0"
    }
  }
  ```
- **Không có runtime dependency bên thứ ba ngoài KaTeX (CDN)** — giữ đúng triết lý tải trang tức thì, chạy nhẹ trên mọi thiết bị và dễ dàng nhúng.

---

## ✅ X. Chiến Lược Kiểm Thử & Kiểm Chứng Tự Động (Testing & Verification)

Theo quy chuẩn thiết kế bài tập toán học, **mọi logic tính toán trong `logic.js` bắt buộc phải có test tự động kiểm chứng đi kèm**:

1. **Kiểm thử logic số học từng bài (`lessons/<id>/logic.test.js`):**
   - Kiểm tra kết quả tính toán khớp 100% với giá trị kỳ vọng ở từng bước trong `manifest.json`.
   - Bao phủ các trường hợp biên quan trọng:
     - Bài 01: `pixels = [1, 1, 1, 1]` kết hợp `weights = [1, 1, -1, -1]` phải ra đúng `score = 0.0` (đèn pha bị triệt tiêu).
     - Bài 02: `logits = [1000, 1000]` với Softmax thường sinh ra `NaN`, nhưng Safe Softmax phải trả về xác suất hợp lệ `[0.5, 0.5]`.
     - Bài 06: Trọng số khởi tạo bằng 0 cho ra gradient bằng nhau ở mọi hidden unit, chứng minh lời nguyền đối xứng.
     - Bài 14: KV-Cache tái sử dụng các slice vector cũ và chỉ bổ sung đúng 1 slot cho token mới.
2. **Kiểm tra cú pháp KaTeX an toàn (KaTeX Safety Lint):**
   - Viết test quét tự động toàn bộ file `manifest.json` trong `lessons/**/manifest.json`.
   - Chặn đứng mọi chuỗi chứa `_` trần trong toán học hoặc `\text{___}` trước khi bài học được thêm vào `registry.json`.
3. **Quy tắc cổng chất lượng (Quality Gate):** Lệnh `npm test` phải xanh 100% mới được coi là hoàn tất gói bài học.

---

## 📝 XI. Hướng Dẫn Thêm Bài Học Mới (Contributor Checklist)

Để thêm một bài học mới vào TensorPlay, người đóng góp chỉ cần thực hiện 7 bước tuần tự:

1. **Tạo thư mục:** `lessons/<ten_bai>/` theo đúng Hợp Đồng Gói Bài Tập (Mục III).
2. **Khai báo `manifest.json`:** Viết kịch bản dẫn dắt Socratic (`problem` $\to$ `challenge` $\to$ `takeaway`), định nghĩa các presets thử nhanh và khai báo thông tin `courseMapping`.
3. **Cung cấp `assets/` riêng:** Đặt các hình minh họa SVG, icon vào thư mục `lessons/<ten_bai>/assets/`.
4. **Viết `logic.js`:** Kế thừa hoặc tuân theo mẫu `class LessonLogic` (chứa `onUserUpdate`, `applyPreset`, `calculate`).
5. **Viết `logic.test.js`:** Bao phủ các mốc giá trị trong `manifest.json` và trường hợp biên đặc thù.
6. **Chạy kiểm chứng:** Thực thi `npm test`, xác nhận tất cả test số học và lint KaTeX đều pass.
7. **Đăng ký vào `registry.json`:** Thêm thông tin bài học mới vào `lessons/registry.json`. Kiểm tra trên trình duyệt: cả giao diện 3 cột và giao diện mobile tab đều hiển thị mượt mà.

---

## 🚀 XII. Lộ Trình Triển Khai Chi Tiết (Execution Roadmap)

### Giai Đoạn 0: Khởi Tạo Môi Trường & Tooling Cơ Bản
- [ ] Khởi tạo `package.json` với `vite` và `vitest`.
- [ ] Tạo file `vite.config.js` tối giản hỗ trợ module import.
- [ ] Dựng `index.html` tích hợp font (`Outfit`, `Fira Code`) và KaTeX qua CDN.
- [ ] Kiểm tra lệnh `npm run dev` và `npm test` hoạt động mượt mà.

### Giai Đoạn 1: Dựng Bộ Khung Nền Tảng (Core Framework Shell)
- [ ] Dựng hệ thống Design Tokens CSS (`core/styles/tokens.css`, `layout.css`, `components.css`).
- [ ] Xây dựng bộ khung điều phối `core/engine.js` (State Machine, Event Bus, dynamic lesson loader).
- [ ] Triển khai `core/router.js` hỗ trợ deep-linking `/#/<lesson_id>?step=<N>&preset=<id>`.
- [ ] Xây dựng layout 3 cột linh hoạt với thanh điều khiển splitters và breakpoint <900px gập tab (`core/layout.js`).
- [ ] Xây dựng `core/progress.js` (quản lý lưu trữ localStorage) và `core/shortcuts.js` (bảng phím tắt toàn cục).
- [ ] Hoàn thiện `core/components/KaTeXRenderer.js` hỗ trợ render công thức toán học thời gian thực.

### Giai Đoạn 2: Triển Khai Gói Bài Thí Điểm (Pilot Track HW0)
- [ ] **Bài 01 (`bai_01_robot_vision`):** Lưới pixel $2 \times 2$, khuôn dập trọng số âm, triệt tiêu đèn pha, mô phỏng ô nhớ RAM 1D.
- [ ] **Bài 02 (`bai_02_softmax_loss`):** Thanh trượt Logits lóa sáng $0 \to 1000$, hiện tượng tràn số FP32 `NaN`, cần gạt Safe Softmax.
- [ ] **Bài 03 (`bai_03_cache_locality`):** Mô phỏng đầu đọc CPU Cache Hit vs Cache Miss khi duyệt mảng Row-Major vs Col-Major.

### Giai Đoạn 3: Triển Khai Track HW1 (Autograd Engine Needle)
- [ ] **Bài 04 (`bai_04_autograd_graph`):** Trực quan hóa dòng chảy xuôi Forward Pass và sóng dội ngược Backward Pass trên DAG.
- [ ] **Bài 05 (`bai_05_reverse_vs_forward_ad`):** So sánh chi phí tính toán giữa Reverse-mode và Forward-mode AD.
- [ ] **Bài 06 (`bai_06_activation_valves`):** Van cơ học ReLU chặn dòng gradient và hiện tượng tê liệt nơ-ron khi khởi tạo trọng số bằng 0.

### Giai Đoạn 4: Triển Khai Track HW2 (Modules & Convolutions)
- [ ] **Bài 07 (`bai_07_minibatch_assembly`):** Băng chuyền xử lý song song Mini-batch $B=2, B=4$ và bộ đệm Activation Buffer.
- [ ] **Bài 08 (`bai_08_conv2d_im2col`):** Trực quan hóa phép mở cuộn Im2col biến phép chập thành GEMM siêu tốc.
- [ ] **Bài 09 (`bai_09_batch_norm_dynamics`):** Động lực học chuẩn hóa BatchNorm (Training vs Inference Running Stats).

### Giai Đoạn 5: Triển Khai Track HW3 (CUDA Programming)
- [ ] **Bài 10 (`bai_10_cuda_threads`):** Ánh xạ lưới luồng Grid, Block, Thread và xử lý phần tử biên.
- [ ] **Bài 11 (`bai_11_shared_memory_tiling`):** Bộ nhớ nhanh Shared Memory, kỹ thuật Tiling MatMul và rào cản `__syncthreads()`.
- [ ] **Bài 12 (`bai_12_coalescing_and_banks`):** Trực quan hóa Memory Coalescing và giải quyết Bank Conflicts.

### Giai Đoạn 6: Triển Khai Track HW4 (Transformers & LLM Systems)
- [ ] **Bài 13 (`bai_13_self_attention`):** Chiếu đèn pin Self-Attention $Q \times K^T / \sqrt{d}$ và tam giác che phủ Causal Mask.
- [ ] **Bài 14 (`bai_14_kv_cache_anatomy`):** Bảng đệm KV-Cache trong suy luận LLM, cắt giảm độ phức tạp tính toán thừa.
- [ ] **Bài 15 (`bai_15_flash_attention_concept`):** Ý tưởng Tiling FlashAttention tính Softmax trực tuyến trong SRAM.

### Giai Đoạn 7: Tinh Chỉnh, Đóng Gói & Đăng Ký Tên Miền
- [ ] Kiểm thử toàn diện trên desktop và mobile với `npm test` đạt 100% độ bao phủ.
- [ ] Đóng gói `npm run build` xuất ra static bundle tối ưu.
- [ ] Cấu hình PWA (Service Worker) để hỗ trợ học offline không cần mạng.
- [ ] Thiết lập domain chính thức (ví dụ `tensorplay.dev`) và CI/CD deploy tự động qua GitHub Pages / Cloudflare Pages.

