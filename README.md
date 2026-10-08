# 🎮 TensorPlay
### *Interactive Deep Learning Systems & Visual Math Lab*

TensorPlay là nền tảng học tập tương tác trực quan hóa toán học và kỹ nghệ hệ thống AI (Deep Learning Systems).

Mỗi bài học trong TensorPlay là một **"Hạt nhân Khái niệm" (Atomic Unit)** khép kín trong `lessons/<slug>/`, tự mang theo giao diện trực quan, logic toán, unit test và script kiểm chứng độc lập.

---

## 🧭 Tài Liệu Kiến Trúc & Kế Hoạch
- Kế hoạch kiến trúc linh hoạt: [`KE_HOACH_CAU_TRUC_LINH_HOAT.md`](KE_HOACH_CAU_TRUC_LINH_HOAT.md)
- Kế hoạch thiết kế nguyên bản: [`KE_HOACH_THIET_KE.md`](KE_HOACH_THIET_KE.md)

---

## 🏗️ Cấu Trúc Dự Án
Kiến trúc tách rời: Thư viện bài học độc lập (`lessons/`) + Lộ trình học linh hoạt (`curriculum/`).

```text
tensorplay/
├── curriculum/                  # Lộ trình & Siêu dữ liệu học tập
│   ├── topics.json              # 8 chủ đề chính & mã màu
│   ├── legacy-map.json          # Ánh xạ URL cũ để chuyển hướng tự động
│   └── paths/                   # Các lộ trình học (JSON)
│       ├── main.json            # "Lộ trình đầy đủ" (49 bài học)
│       ├── llm-systems.json     # "Chuyên sâu LLM & Transformers" (10 bài)
│       ├── cpp-memory.json      # "Kỹ nghệ Bộ nhớ & Hiệu năng C++" (7 bài)
│       └── cmu-10414.json       # "Khung đối chiếu CMU 10-414/714"
├── lessons/                     # Thư viện bài học tự quản (49 bài)
│   └── <slug>/                  # Định danh bằng slug ngữ nghĩa (ví dụ: robot_vision)
│       ├── index.html           # Giao diện Sandbox tương tác 3 cột
│       ├── logic.js             # Logic toán học thuần (ES Module)
│       ├── logic.test.js        # Unit test kiểm chứng thuật toán (Vitest)
│       ├── lesson.json          # Metadata, độ khó, tiên quyết, tags
│       └── kiem_tra.py          # Script Python kiểm chứng số học (AGENTS.md)
├── templates/lesson/            # Khuôn mẫu chuẩn để tạo bài học mới
├── tools/                       # Bộ công cụ CLI tự động hóa
│   ├── build-catalog.mjs        # Biên dịch catalog.json tự động
│   ├── run_checks.py            # Chạy kiểm chứng toán học toàn bộ / theo bài
│   └── new-lesson.mjs           # Tạo bài học mới từ template chỉ với 1 lệnh
├── shared/                      # Thành phần dùng chung (LessonNav, AiTutor, Resizer...)
└── index.html                   # Trang chủ: duyệt bài theo lộ trình, lọc chủ đề, tìm kiếm
```

---

## ⚙️ Các Lệnh Thao Tác

```bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi động môi trường phát triển (Dev Server + HMR)
npm run dev

# 3. Biên dịch & kiểm tra danh mục bài học
npm run catalog
npm run catalog:check

# 4. Kiểm thử toàn diện hệ thống (Catalog + Vitest + Kiểm chứng toán học Python)
npm run verify

# 5. Tạo bài học mới từ khuôn mẫu chuẩn
npm run new-lesson <slug> --title "Tên Bài Học" --topic <topic_id>

# 6. Đóng gói sản phẩm tĩnh
npm run build
```

## 🚀 Triển khai & CI
- `vite.config.js` dùng `base: './'` và các trang chuyển hướng URL cũ dùng đường dẫn tương đối, nên bản `dist/` chạy được cả ở gốc domain lẫn dưới thư mục con (ví dụ GitHub Pages `/tensorplay/`).
- `.github/workflows/ci.yml` chạy `npm run verify` (catalog khớp nguồn + toàn bộ Vitest + kiểm chứng toán học Python từng bài ở chế độ strict) rồi `npm run build`.
- Kiểm chứng từng bài: `lessons/<slug>/kiem_tra.py` tính độc lập bằng numpy và đối chiếu trực tiếp với `logic.js` qua `tools/checks_common.py` (`js_calc`).
