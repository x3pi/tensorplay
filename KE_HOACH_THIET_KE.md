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
│
├── core/                            # BỘ KHUNG ĐIỀU HÀNH DÙNG CHUNG (CORE ENGINE)
│   ├── engine.js                    # State Machine: Quản lý tiến trình, bước học, event bus
│   ├── layout.js                    # Quản lý bố cục 3 cột, co giãn responsive
│   ├── styles/                      # Hệ thống Design Tokens & CSS dùng chung
│   │   ├── tokens.css               # Màu sắc, font chữ, hiệu ứng đổ bóng glassmorphism
│   │   ├── layout.css               # Grid 3 cột, splitters, tabs
│   │   └── components.css           # Nút bấm, thanh trượt slider, card thông số
│   ├── components/                  # Thư viện UI widgets tái sử dụng
│   │   ├── KaTeXRenderer.js         # Khối hiển thị công thức toán học động
│   │   ├── MemoryVisualizer.js      # Khối mô phỏng thanh RAM C++ (1D array & pointer)
│   │   └── ProbabilityBar.js        # Thanh đo phần trăm Softmax trực quan
│   └── lib/                         # Thư viện phụ trợ (KaTeX JS/CSS)
│
└── lessons/                         # DANH MỤC CÁC BÀI HỌC (MỖI BÀI MỘT GÓI ĐỘC LẬP)
    ├── registry.json                # Sổ danh bạ đăng ký tất cả bài học
    │
    ├── bai_01_robot_vision/         # === GÓI BÀI TẬP 1 ===
    │   ├── manifest.json            # Cấu hình bài học: Tiêu đề, số bước, câu hỏi
    │   ├── logic.js                 # Thuật toán tính toán riêng của Bài 1
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
    │   ├── custom_canvas.js         # Thanh trượt logits & bộ mô phỏng lóa sáng
    │   └── assets/                  # 🎨 TÀI NGUYÊN RIÊNG CỦA BÀI 2
    │       ├── sun_glare.svg        # Hiệu ứng chói nắng gây tràn số
    │       └── cliff_warning.svg    # Robot lao xuống vực vì đoán sai tự tin
    │
    ├── bai_03_sgd_cycle/            # === GÓI BÀI TẬP 3 ===
    │   ├── manifest.json
    │   ├── logic.js
    │   └── assets/
    │
    ├── bai_04_nn_relu/              # === GÓI BÀI TẬP 4 ===
    │   ├── manifest.json
    │   ├── logic.js
    │   └── assets/
    │       └── water_valve_relu.svg # Hình ảnh van đóng/mở ReLU
    │
    ├── bai_05_minibatch/            # === GÓI BÀI TẬP 5 ===
    │   ├── manifest.json
    │   └── ...
    │
    └── bai_06_cpp_memory/           # === GÓI BÀI TẬP 6 ===
        ├── manifest.json
        └── ...
```

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

## 🚀 VI. Lộ Trình Triển Khai Chi Tiết (Execution Roadmap)

### Giai Đoạn 1: Dựng Bộ Khung Nền Tảng (Core Framework Shell)
- [ ] Thiết lập thư mục `tensorplay/` với `index.html`, `core/styles/`, `core/engine.js`.
- [ ] Xây dựng layout 3 cột responsive, hỗ trợ thu/phóng từng cột.
- [ ] Tích hợp KaTeX để render công thức toán học sắc nét không độ trễ.
- [ ] Xây dựng cơ chế tải bài động (`Dynamic Lesson Loader`) dựa trên `registry.json`.

### Giai Đoạn 2: Triển Khai Hoàn Chỉnh Bài 1 (Visual Robot Vision Package)
- [ ] Tạo gói `lessons/bai_01_robot_vision/` gồm `manifest.json`, `logic.js`, thư mục `assets/`.
- [ ] Dựng component bàn cờ pixel $2 \times 2$ có thể click tương tác trực tiếp.
- [ ] Dựng component khuôn mẫu dập trọng số (màu xanh cho $+1$, màu đỏ cho $-1$).
- [ ] Kết nối thời gian thực: Click pixel $\to$ khuôn dập nhân tức thì $\to$ điểm số $Z$ nhảy $\to$ ô nhớ RAM C++ highlight vị trí `offset`.

### Giai Đoạn 3: Mở Rộng Sang Bài 2 Đến Bài 6
- [ ] **Bài 2:** Bộ mô phỏng lóa sáng (Logits Slider $0 \to 1000 \to \text{NaN}$) và cần gạt Safe Softmax.
- [ ] **Bài 3:** Trình diễn chu trình SGD từng nhịp (Forward $\to$ Loss $\to$ Backward $\to$ Update) kèm trọng số đổi màu khi học.
- [ ] **Bài 4:** Mô phỏng van cơ học ReLU chặn dòng gradient.
- [ ] **Bài 5:** Băng chuyền xử lý Mini-batch $B=2$ song song.
- [ ] **Bài 6:** Thanh đo dung lượng RAM trực quan cảnh báo Memory Leak qua từng epoch.
