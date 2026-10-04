# 🎮 TensorPlay
### *Interactive Deep Learning Systems & Visual Math Lab*

TensorPlay là nền tảng học tập tương tác trực quan hóa toán học và kỹ nghệ hệ thống AI (Deep Learning Systems).

Mỗi bài học trong TensorPlay là một **"Hạt nhân Khái niệm" (Atomic Unit)** khép kín, sở hữu logic toán và thư mục tài nguyên riêng, giúp người học "chạm", tương tác và hiểu bản chất cơ chế của mạng nơ-ron và phần cứng máy tính mà không cần học vẹt.

---

## 🧭 Tài Liệu Kiến Trúc & Kế Hoạch
- Xem kế hoạch kiến trúc chi tiết tại: [`KE_HOACH_THIET_KE.md`](KE_HOACH_THIET_KE.md)

---

## 🏗️ Cấu Trúc Dự Án
```text
tensorplay/
├── KE_HOACH_THIET_KE.md   # Kiến trúc & hợp đồng module bài học
├── index.html             # Shell ứng dụng chính
├── package.json           # Scripts dev / build / test
├── core/                  # Engine điều phối, layout 3 cột, KaTeX, theme, progress, shortcuts
└── lessons/               # Kho bài học độc lập (mỗi bài kèm assets/ + logic.test.js riêng)
    ├── registry.json      # Sổ đăng ký bài học & tags
    ├── bai_01_robot_vision/   # Bài 1: Dập khuôn ma trận & bộ nhớ C++
    └── ...
```

## ⚙️ Chạy Dự Án
```bash
npm install     # Vite + Vitest (devDependencies, không có runtime dependency ngoài KaTeX qua CDN)
npm run dev     # Dev server + HMR
npm test        # Kiểm chứng tự động logic.js của mọi bài học (Vitest)
npm run build   # Build tĩnh ra dist/
```
