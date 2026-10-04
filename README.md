# 🎮 TensorPlay
### *Interactive Deep Learning Systems & Visual Math Lab*

TensorPlay là nền tảng học tập tương tác trực quan hóa toán học và kỹ nghệ hệ thống AI (Deep Learning Systems).

Mỗi bài học trong TensorPlay là một **"Hạt nhân Khái niệm" (Atomic Unit)** khép kín, sở hữu logic toán và thư mục tài nguyên riêng, giúp người học "chạm", tương tác và hiểu bản chất cơ chế của mạng nơ-ron và phần cứng máy tính mà không cần học vẹt.

---

## 🧭 Tài Liệu Kiến Trúc & Kế Hoạch
- Xem kế hoạch kiến trúc chi tiết tại: [`KE_HOACH_THIET_KE.md`](KE_HOACH_THIET_KE.md)

---

## 🏗️ Cấu Trúc Dự Án
Không có app shell / router / registry trung tâm — mỗi ví dụ là 1 trang HTML tĩnh độc lập, dùng chung thư viện component trong `shared/`.
```text
tensorplay/
├── KE_HOACH_THIET_KE.md   # Kiến trúc, hợp đồng component & hợp đồng gói ví dụ
├── index.html             # Trang danh mục, liệt kê 15 ví dụ theo track
├── package.json           # Scripts dev / build / test
├── shared/                # Component tái sử dụng (StepWizard, ValueGrid, LiveSlider, MemoryTape, ScoreBar, PresetPicker...)
└── examples/              # Mỗi ví dụ = 3 file (.html / .logic.js / .logic.test.js), nhóm theo track
    ├── catalog.json       # Metadata để index.html render thẻ ví dụ
    ├── hw0_tensor_memory/     # Bài 01–03: Tensor & bộ nhớ C++
    ├── hw1_autograd_engine/   # Bài 04–06: Autograd (Needle)
    ├── hw2_modules_conv/      # Bài 07–09: Module & Conv2D
    ├── hw3_cuda_architecture/ # Bài 10–12: CUDA
    └── hw4_transformer_llm/   # Bài 13–15: Transformer & LLM Systems
```

## ⚙️ Chạy Dự Án
```bash
npm install     # Vite + Vitest (devDependencies, không có runtime dependency ngoài KaTeX qua CDN)
npm run dev     # Dev server + HMR
npm test        # Kiểm chứng tự động logic.js của mọi bài học (Vitest)
npm run build   # Build tĩnh ra dist/
```
