# 🧱 Kế Hoạch Tái Cấu Trúc: Từ "Homework CMU Đánh Số" Sang "Kho Bài Học + Lộ Trình Linh Hoạt"

> Dành cho agent thực hiện. Đọc hết Mục 1–4 trước khi động vào code. Tài liệu này **thay thế** các phần đánh số bài trong `KE_HOACH_TIEP_THEO.md` (Task 0 và Task 4 của file đó trở nên không cần nữa nếu làm xong kế hoạch này).
> Ngày lập: 2026-10-08. Trạng thái nền: `main` có 34 bài, 208 test xanh, build chạy được.

---

## 1. Vấn đề hiện tại (có bằng chứng trong repo)

Cấu trúc hiện nay bắt chước thứ tự bài tập của khóa CMU 10-414/714 (`hw0_… hw4_`) và đánh số "Bài NN" khắp nơi. Hậu quả đã gặp thật:

| Triệu chứng | Chỗ thấy |
|---|---|
| Thêm 1 bài ở giữa làm lệch số của mọi bài sau; phải viết `tools/renumber.py` ánh xạ 31 → 34 bài | `tools/renumber.py`, `shared/catalog-consistency.test.js` (cứng "34 bài") |
| Tên file lệch số bài: `bai_13_self_attention` thực ra là Bài 30; `bai_03_cache_locality` là Bài 09 | `examples/*/` |
| Số bài nằm trong 5 nơi khác nhau: `title` catalog, `<title>` html, comment đầu `.logic.js`, câu tham chiếu trong chữ ("Bài 19 (BatchNorm)"), README/KE_HOACH | script đánh số lại từng bị sót: "Bài 25-24" |
| Track tên theo homework (`hw2_modules_conv`) nên bài "Strides" và "Van kích hoạt" phải `git mv` sang track khác | commit lịch sử |
| Script kiểm chứng Python gộp theo track (`kiem_tra_bai_tap.py` 5 file), không gắn với từng bài | `examples/hw*/kiem_tra_bai_tap.py` |
| Chỉ có **một** thứ tự duy nhất cho mọi người học | `catalog.json` là một mảng phẳng; `LessonNav` chỉ biết trước/sau theo mảng này |
| Chat history của Gia sư AI và `LessonNav` đoán bài bằng **tên file** | `AiTutor.js:1833-1838`, `LessonNav.js:18-26` |

**Mục tiêu:** thêm/sửa/xóa/đổi thứ tự/đổi tên một bài chỉ cần chạm **một chỗ**, không có số nào nằm trong tên file, tiêu đề hay văn bản; đồng thời cho phép **nhiều lộ trình học** (đầy đủ, theo CMU, rút gọn cho LLM, thiên C++...) dùng chung một kho bài.

---

## 2. Nguyên tắc thiết kế

1. **Tách "nội dung" khỏi "thứ tự".** Bài học là đối tượng độc lập có danh tính ổn định (`slug`). Thứ tự chỉ tồn tại trong các file lộ trình.
2. **Không số trong định danh.** Tên thư mục, tên file, `id`, tiêu đề, comment code, tham chiếu chéo đều không chứa "Bài NN". Số hiển thị (vd "3/34") được **tính lúc chạy** theo lộ trình đang xem.
3. **Một bài = một thư mục tự đủ.** Mọi thứ của bài (trang, logic, test, kiểm chứng Python, metadata) nằm cùng chỗ. Xóa thư mục = xóa bài.
4. **Tham chiếu chéo theo `slug`, không theo số.** Đổi thứ tự hay đổi tên bài không làm hỏng câu chữ của bài khác.
5. **Nhiều lộ trình, một kho bài.** CMU chỉ còn là một *lộ trình* và một trường metadata (`sources`), không còn quyết định cấu trúc thư mục.
6. **Máy kiểm tra thay cho mắt người.** Mọi ràng buộc (slug duy nhất, tham chiếu tồn tại, tiên quyết xuất hiện trước, không số trong tên) được test tự động chặn.
7. **Không phá cũ:** URL cũ, tiến độ học đã lưu, lịch sử chat Gia sư AI vẫn dùng được sau migration.
8. Giữ nguyên các nguyên tắc đã có: Atomic Concept Sandbox, không router/registry runtime nặng, KaTeX an toàn, quy chuẩn `AGENTS.md` (số nhỏ tròn, gắn tình huống thực, có script Python kiểm chứng).

---

## 3. Kiến trúc đích

### 3.1 Cây thư mục

```text
tensorplay/
├── index.html                      # Trang chủ: chọn lộ trình, lọc theo chủ đề, tìm kiếm
├── lessons/                        # KHO BÀI HỌC (phẳng, không phân track)
│   ├── robot_vision/
│   │   ├── index.html              # trang bài (URL: /lessons/robot_vision/)
│   │   ├── logic.js
│   │   ├── logic.test.js
│   │   ├── kiem_tra.py             # kiểm chứng số học độc lập bằng numpy (AGENTS.md mục 5)
│   │   ├── lesson.json             # metadata của riêng bài này
│   │   └── assets/                 # (tùy chọn) SVG/ảnh riêng
│   ├── layernorm_residual/ ...
│   └── ...                         # 34 thư mục, tên = slug
├── curriculum/                     # THỨ TỰ & NHÓM — chỗ DUY NHẤT chứa thứ tự
│   ├── topics.json                 # danh mục chủ đề (nhãn, màu, mô tả)
│   ├── paths/
│   │   ├── main.json               # "Lộ trình đầy đủ"
│   │   ├── cmu-10414.json          # "Theo khung khóa CMU 10-414/714"
│   │   ├── llm-systems.json        # "Đường nhanh tới LLM Systems"
│   │   └── cpp-memory.json         # "Kỹ nghệ bộ nhớ & C++/CUDA"
│   └── legacy-map.json             # id/URL cũ → slug mới (tương thích ngược)
├── public/curriculum/catalog.json  # SINH TỰ ĐỘNG từ lessons/*/lesson.json + curriculum/** (commit vào git)
├── shared/
│   ├── curriculum.js               # nạp catalog, tra bài theo slug, lộ trình, prev/next, resolveRefs()
│   ├── lesson-context.js           # getLessonSlug() — slug của trang hiện tại
│   └── ... (components cũ giữ nguyên)
├── tools/
│   ├── build-catalog.mjs           # quét lessons/ + curriculum/ → catalog.json (+ kiểm tra)
│   ├── new-lesson.mjs              # scaffold bài mới từ mẫu
│   ├── migrate-to-lessons.mjs      # script migration một lần (xóa sau khi xong)
│   └── run_checks.py               # chạy mọi lessons/*/kiem_tra.py
└── templates/lesson/               # mẫu để new-lesson sao chép (html/logic/test/kiem_tra/lesson.json)
```

`examples/` bị xóa hoàn toàn sau migration. `vite.config.js` quét `lessons/**/index.html`.

### 3.2 `lesson.json` (metadata của một bài)

```json
{
  "id": "layernorm_residual",
  "title": "LayerNorm & Residual — Chuẩn Hóa Theo Mẫu, Cao Tốc Cho Gradient",
  "summary": "Vì sao Transformer bỏ BatchNorm... (được phép chứa $…$ KaTeX)",
  "topic": "training-stability",
  "tags": ["layernorm", "residual", "transformer-block"],
  "difficulty": "intermediate",
  "estimatedMinutes": 12,
  "status": "ready",
  "prerequisites": ["batch_norm_dynamics"],
  "related": ["rnn_bptt", "kv_cache_anatomy"],
  "sources": [{ "course": "CMU 10-414/714", "ref": "HW2" }],
  "aliases": ["layernorm_residual"]
}
```

Quy tắc:
- `id` **bắt buộc bằng tên thư mục** và dùng `[a-z0-9_]` (không dấu gạch ngang, không số đứng đầu, **không** khớp `/^bai_?\d/` hay `/\d{2}/` kiểu số thứ tự).
- `title` không bắt đầu bằng "Bài", không chứa số thứ tự.
- `prerequisites` = bài *nên học trước* (mềm, không khóa truy cập — giữ nguyên "Zero Hard Dependencies"). `related` = gợi ý đọc thêm.
- `aliases` = các `id` cũ để migrate tiến độ/lịch sử chat (xem 3.6).
- `sources` tùy chọn, **chỉ ghi khi đã đối chiếu với tài liệu khóa học thật** (agent không được tự đoán ánh xạ homework; để trống nếu không chắc).
- `status`: `ready | draft | planned`. Bài `draft`/`planned` không hiện nút "Trải nghiệm" nhưng vẫn hiện thẻ nếu `planned` (hỗ trợ backlog).

### 3.3 `curriculum/topics.json`

```json
[
  { "id": "foundations",        "label": "Nền tảng Tensor & Softmax",        "color": "#38bdf8" },
  { "id": "memory-systems",     "label": "Bộ nhớ, Cache & C++",               "color": "#f59e0b" },
  { "id": "autograd",           "label": "Autograd & Gradient",               "color": "#10b981" },
  { "id": "training-stability", "label": "Huấn luyện ổn định (init/optim/norm)", "color": "#a78bfa" },
  { "id": "cnn-data",           "label": "CNN & Pipeline dữ liệu",            "color": "#f472b6" },
  { "id": "gpu",                "label": "GPU, CUDA & độ chính xác số",       "color": "#fb7185" },
  { "id": "transformer",        "label": "Transformer",                       "color": "#22d3ee" },
  { "id": "llm-serving",        "label": "LLM Serving",                       "color": "#facc15" }
]
```
Mỗi bài có đúng **một** `topic` (nhóm hiển thị), nhiều `tags` (tìm kiếm). Thêm chủ đề mới chỉ cần sửa file này.

### 3.4 Lộ trình `curriculum/paths/<id>.json`

```json
{
  "id": "main",
  "title": "Lộ trình đầy đủ",
  "description": "Từ vector đầu tiên đến FlashAttention.",
  "default": true,
  "sections": [
    { "title": "Chặng 1 — Nền tảng", "lessons": ["robot_vision", "softmax_loss", "..."] },
    { "title": "Chặng 2 — Autograd", "lessons": ["autograd_graph", "..."] }
  ]
}
```
- Thứ tự = thứ tự xuất hiện. Một bài có thể xuất hiện ở nhiều lộ trình. Lộ trình có thể bỏ bài.
- Số thứ tự hiển thị (`Bài 7/34`) = vị trí trong lộ trình **đang chọn** (`?path=…`, mặc định `main`).
- Bài không thuộc lộ trình nào hiện trong nhóm "Chưa xếp lộ trình" ở trang chủ (không bị mất) và test ở Mục 6 **cảnh báo** (không fail) nếu bài `ready` không nằm trong `main`.
- Thêm bài vào lộ trình = thêm một dòng slug; đổi thứ tự = di chuyển dòng; không động vào file bài.

**Gợi ý nội dung ban đầu cho 4 lộ trình** (agent có thể tinh chỉnh, miễn là ghi lại lý do trong commit):
- `main`: đúng thứ tự 34 bài hiện tại (xem bảng Mục 4), chia thành 6–7 chặng theo `topic`.
- `llm-systems`: robot_vision → softmax_stability → cross_entropy_logsumexp → softmax_regression → autograd_graph → layernorm_residual → rnn_bptt → self_attention → positional_encoding → multi_head_attention → mixed_precision → kv_cache_anatomy → flash_attention (≈13 bài).
- `cpp-memory`: robot_vision (offset 1D) → cpp_matmul_loops → memory_leak → cache_locality → strides_views → minibatch_assembly → cuda_threads → shared_memory_tiling → coalescing_and_banks → activation_checkpointing.
- `cmu-10414`: sắp theo khung khóa CMU. **Chỉ lập khi đối chiếu được với đề bài CMU thật**; nếu không chắc từng bài thuộc homework nào thì để lộ trình này `status: "planned"` và ghi TODO — không bịa.

### 3.5 Tham chiếu chéo theo slug

Trong chuỗi văn bản của bài (`STEPS`, `STEP_COMMENTS`, summary) dùng cú pháp:

```
BatchNorm ([[lesson:batch_norm_dynamics]]) chuẩn hóa theo cột...
```
`shared/curriculum.js` xuất `resolveRefs(text)` thay `[[lesson:slug]]` bằng `«Tiêu đề ngắn của bài»` (phần trước dấu "—" hoặc ":" của `title`). Yêu cầu:
- Khi chạy trên trình duyệt: `resolveRefs` dùng catalog đã nạp (top-level `await` trong module được phép). Nếu catalog lỗi: rơi về hiển thị slug dạng chữ thường, **không ném lỗi, không làm trắng trang**.
- Khi chạy trong Vitest (Node): có thể truyền catalog vào để test.
- Hiển thị dạng liên kết chỉ khi renderer của `StepWizard`/`CommentSection` hiện tại hỗ trợ HTML an toàn; nếu không, để chữ thường (không mở lỗ hổng XSS). Kiểm tra `shared/katex-render.js:renderRichText` trước khi quyết định.
- Test chặn: không còn chuỗi `Bài \d` trong `lessons/**` (trừ chính từ "Bài" dùng trong câu thường như "Bài học này", "bài toán" — regex chỉ bắt `\bBài\s+\d`), và mọi `[[lesson:x]]` phải trỏ tới slug tồn tại.

### 3.6 Tương thích ngược

- **URL cũ** (`/examples/hw2_modules_conv/bai_09_batch_norm_dynamics.html`): Vite plugin hoặc bước build sinh trang chuyển hướng tĩnh từ `curriculum/legacy-map.json` (`{"examples/hw2_modules_conv/bai_09_batch_norm_dynamics.html": "lessons/batch_norm_dynamics/"}`). Chỉ cần cho 34 bài hiện có.
- **Tiến độ đã lưu** (`localStorage["tensorplay:progress"]` khóa theo `id` cũ): `shared/progress.js` thêm bước đọc: nếu không có khóa `slug` mà có khóa trùng một `alias` thì dùng và (tùy chọn) ghi sang khóa mới. Hàm công khai (`markCompleted`, `isLessonCompleted`) giữ nguyên chữ ký.
- **Ghi chú học tập** (`CommentSection`, khóa theo `lessonId`) và **lịch sử chat Gia sư AI** (`AiTutor.getChatStorageKey`, hiện lấy từ *tên file*): đổi sang lấy slug từ `getLessonSlug()`; đọc thêm khóa cũ theo alias khi khóa mới chưa có.
- Khi đặt slug mới cho bài cũ, **luôn thêm `id` cũ vào `aliases`**.

---

## 4. Ánh xạ định danh 34 bài hiện tại → slug mới

Slug ngắn, không số. Agent được phép chỉnh tên slug nếu có lý do, nhưng **bắt buộc** ghi alias và cập nhật bảng trong commit.

| id/thư mục cũ | slug mới | topic |
|---|---|---|
| `bai_01_robot_vision` | `robot_vision` | foundations |
| `bai_02_softmax_loss` | `softmax_stability` | foundations |
| `bai_03_softmax_regression` | `softmax_regression` | foundations |
| `cross_entropy_logsumexp` | `cross_entropy_logsumexp` | foundations |
| `bai_04_twolayer_relu_backprop` | `twolayer_relu_backprop` | foundations |
| `bai_05_minibatch_sgd` | `minibatch_sgd` | foundations |
| `bai_06a_cpp_matmul_loops` | `cpp_matmul_loops` | memory-systems |
| `bai_03b_memory_leak` | `memory_leak` | memory-systems |
| `bai_03_cache_locality` | `cache_locality` | memory-systems |
| `strides_views` | `strides_views` | memory-systems |
| `bai_04_autograd_graph` | `autograd_graph` | autograd |
| `bai_05_reverse_vs_forward_ad` | `reverse_vs_forward_ad` | autograd |
| `broadcast_grad` | `broadcast_grad` | autograd |
| `gradient_check` | `gradient_check` | autograd |
| `bai_06_activation_valves` | `activation_valves` | training-stability |
| `kaiming_init` | `kaiming_init` | training-stability |
| `optimizers` | `optimizers` | training-stability |
| `adamw_weight_decay` | `adamw_weight_decay` | training-stability |
| `bai_09_batch_norm_dynamics` | `batch_norm_dynamics` | training-stability |
| `dropout` | `dropout` | training-stability |
| `layernorm_residual` | `layernorm_residual` | training-stability |
| `bai_08_conv2d_im2col` | `conv2d_im2col` | cnn-data |
| `bai_07_minibatch_assembly` | `minibatch_assembly` | cnn-data |
| `bai_10_cuda_threads` | `cuda_threads` | gpu |
| `bai_11_shared_memory_tiling` | `shared_memory_tiling` | gpu |
| `bai_12_coalescing_and_banks` | `coalescing_and_banks` | gpu |
| `mixed_precision` | `mixed_precision` | gpu |
| `activation_checkpointing` | `activation_checkpointing` | gpu |
| `rnn_bptt` | `rnn_bptt` | transformer |
| `bai_13_self_attention` | `self_attention` | transformer |
| `positional_encoding` | `positional_encoding` | transformer |
| `multi_head_attention` | `multi_head_attention` | transformer |
| `bai_14_kv_cache_anatomy` | `kv_cache_anatomy` | llm-serving |
| `bai_15_flash_attention_concept` | `flash_attention` | llm-serving |

Thứ tự của lộ trình `main` = thứ tự hàng trên (đúng thứ tự `order` 1..34 hiện tại). Mọi `id` cũ của cột 1 vào `aliases`.

---

## 5. Công việc theo giai đoạn

**Mỗi giai đoạn phải kết thúc ở trạng thái xanh** (`npx vitest run`, `npx vite build`, các script Python, smoke test trình duyệt ở Mục 8) và nên là một commit riêng. Không `git push` (người dùng tự push). Không ghi secret vào repo.

### Giai đoạn 0 — Chuẩn bị
1. Tạo nhánh `refactor/lessons-structure` từ `main`. Chạy đủ bộ kiểm tra hiện tại để chắc nền xanh.
2. Chụp "bản đồ trước": xuất danh sách (id, title, path, order) ra file tạm để so sánh sau migration (số bài, title không đổi nghĩa).
3. Đọc kỹ các điểm phụ thuộc đường dẫn: `vite.config.js:19`, `shared/components/LessonNav.js:13-26`, `shared/components/AiTutor.js:1297,1833-1838`, `index.html:347-365` (dùng `track`, `trackMap`), `shared/katex-lint.test.js:20`, `shared/catalog-consistency.test.js`, `tools/renumber.py`.

### Giai đoạn 1 — Hạ tầng dữ liệu (chưa di chuyển bài)
1. Viết `tools/build-catalog.mjs` (Node, không thêm dependency ngoài `devDependencies` hiện có hoặc dùng thuần `fs`):
   - Quét `lessons/*/lesson.json`, đọc `curriculum/topics.json`, `curriculum/paths/*.json`.
   - Sinh `public/curriculum/catalog.json` dạng `{ lessons: {slug: {...}}, topics: [...], paths: [...] }`, gồm cả `position` trong mỗi lộ trình để client khỏi tính lại.
   - Kiểm tra và **thoát mã ≠ 0** khi vi phạm các luật ở Mục 6.
2. Thêm npm scripts: `"catalog": "node tools/build-catalog.mjs"`, `"catalog:check": "node tools/build-catalog.mjs --check"` (fail nếu file sinh ra lệch với bản commit), `"check": "npm run catalog:check && vitest run"`; `predev`/`prebuild` gọi `catalog`.
3. Viết `shared/curriculum.js` + test: `loadCatalog()`, `getLesson(slug)`, `getPath(id)`, `neighbors(slug, pathId)`, `positionIn(slug, pathId)`, `resolveRefs(text, catalog?)`. Test chạy không cần DOM.
4. Viết `shared/lesson-context.js`: `getLessonSlug()` = phân đoạn thư mục cuối của `location.pathname` khi dạng `/lessons/<slug>/…`; fallback từ `<meta name="tp-lesson">`.
5. Chưa đụng `examples/`. Tạm thời có thể sinh catalog từ `examples/catalog.json` để kiểm thử hạ tầng.

### Giai đoạn 2 — Di chuyển 34 bài (script, một lần)
Viết `tools/migrate-to-lessons.mjs` (hoặc Python) làm **tự động và idempotent**, in báo cáo:
1. Với mỗi bài trong bảng Mục 4: `git mv` bộ ba file (`<id>.html` → `lessons/<slug>/index.html`, `<id>.logic.js` → `logic.js`, `<id>.logic.test.js` → `logic.test.js`) và thư mục `assets/` nếu có (hiện chỉ track 0 có `assets/` chung — kiểm tra bài nào dùng, chuyển đúng bài).
2. Sửa bên trong file:
   - `index.html`: `import … from './<id>.logic.js'` → `'./logic.js'`; `LESSON_ID`/`lessonId` → đọc `getLessonSlug()` (hoặc ghi cứng slug mới); `<title>` bỏ tiền tố "Bài NN: " (giữ hậu tố " - TensorPlay"); `<meta name="tp-lesson" content="<slug>">`; đường dẫn `../../shared/…` **giữ nguyên** vì độ sâu thư mục không đổi (`lessons/<slug>/` sâu 2 như `examples/<track>/`).
   - `logic.test.js`: đổi import `./<id>.logic.js` → `./logic.js`, dòng `describe('examples/…')` → `describe('lessons/<slug>/logic.js')`.
   - `logic.js`: bỏ "Bài NN:" ở comment đầu và dòng `Path:` cũ; sửa nhãn preset còn chứa số bài cũ (vd `"Bài 6.1 …"`, `"Bài 5: …"` ở `minibatch_sgd`, `cpp_matmul_loops`, `twolayer_relu_backprop`).
3. Sinh `lesson.json` cho từng bài từ `examples/catalog.json` (giữ nguyên `summary`, `tags`, `difficulty`, `estimatedMinutes`, `status`), thêm `topic` theo bảng, `aliases` = id cũ, `prerequisites` điền ban đầu bằng quan hệ rõ ràng (vd `layernorm_residual` ← `batch_norm_dynamics`; `multi_head_attention` ← `self_attention`; `positional_encoding` ← `self_attention`; `kv_cache_anatomy` ← `self_attention`; `flash_attention` ← `shared_memory_tiling`+`self_attention`; `adamw_weight_decay` ← `optimizers`; `broadcast_grad` ← `strides_views`...). Đừng ép tiên quyết giả; ít mà đúng tốt hơn nhiều mà bịa.
4. Sinh `curriculum/paths/main.json` đúng thứ tự `order` hiện tại, nhóm thành chặng theo `topic`.
5. Sinh `curriculum/legacy-map.json` (đường dẫn cũ → thư mục mới).
6. Chuyển `kiem_tra_bai_tap.py` theo bài (xem Giai đoạn 5).
7. Xóa `examples/` (sau khi script xác nhận không còn tệp sót) và xóa `tools/renumber.py`, `shared/catalog-consistency.test.js` bản cũ (thay bằng test mới ở Mục 6).

### Giai đoạn 3 — Nối lại phần dùng chung
1. `vite.config.js`: quét `lessons/**/index.html`; đặt tên entry theo slug (`lessons_<slug>`); `index.html` giữ nguyên là entry gốc. Đảm bảo `public/curriculum/catalog.json` được copy vào `dist/` và có thể fetch bằng `import.meta.env.BASE_URL + 'curriculum/catalog.json'`.
2. `shared/components/LessonNav.js`: bỏ khớp bằng `pathname.includes(...)`; dùng `getLessonSlug()` + `neighbors(slug, pathId)`. `pathId` lấy từ `?path=` (lưu lựa chọn gần nhất vào `localStorage` `tensorplay:path`), mặc định `main`. Hiển thị "3/34 · Lộ trình đầy đủ" và nút Trước/Sau theo lộ trình. Nút kèm `?path=` để giữ ngữ cảnh. Nếu bài không thuộc lộ trình đang chọn: ẩn Trước/Sau và hiện liên kết "Về lộ trình đầy đủ".
3. `shared/components/AiTutor.js`: `getChatStorageKey()` dùng slug (kèm đọc khóa cũ theo alias để không mất lịch sử); các nhánh `renderSuggestions()` hiện đoán theo `pathname`/tên file — chuyển sang tra theo slug. Cập nhật `AiTutor.test.js`.
4. `shared/progress.js`: thêm tra cứu alias (Mục 3.6). Thêm test.
5. `shared/components/CommentSection.js`: mặc định `lessonId = getLessonSlug()`; giữ khả năng truyền tay.
6. `index.html` (trang chủ): thay `track`/`trackMap` bằng:
   - thanh chọn **lộ trình** (đọc `paths`), đổi lộ trình đổi thứ tự/nhóm chặng và số hiển thị trên thẻ;
   - bộ lọc **chủ đề** (đọc `topics`, có màu), ô **tìm kiếm** (title/summary/tags);
   - thẻ hiển thị số thứ tự trong lộ trình chọn, huy hiệu `topic`, trạng thái hoàn thành, các bài tiên quyết dạng chip;
   - nhóm "Chưa xếp lộ trình" cho bài mồ côi;
   - liên kết thẻ có `?path=<id>`.
7. `shared/katex-lint.test.js`: quét `lessons` thay vì `examples`.

### Giai đoạn 4 — Chuyển tham chiếu chéo sang slug
1. Quét toàn bộ `lessons/**/index.html` và `logic.js` tìm `Bài \d+[-–\d]*` trong chuỗi văn bản. Với **từng** vị trí: đọc ngữ cảnh, xác định bài được nhắc (dựa trên bảng ánh xạ số hiện tại → slug), thay bằng `[[lesson:slug]]`. Ví dụ đã biết: `kaiming_init` ("BatchNorm (Bài 19)"), `gradient_check` ("Bài 13"), `strides_views` ("Bài 26"), `rnn_bptt` ("Bài 24", "Bài 30"), `mixed_precision` ("Bài 13", "Bài 25-26"), `multi_head_attention` ("Bài 33", "Bài 10"), `positional_encoding` ("Bài 29", "Bài 30"), `layernorm_residual` ("Bài 19", "Bài 33", "Bài 29"), `bai_01_robot_vision` ("Bài 02" ×3), và các chú giải kiểu "Ở Bài 3 mạng 1 tầng" trong `twolayer_relu_backprop`. Câu "Bấm chuyển sang Bài 30 trong mục lục" của `rnn_bptt` nên thành "Bấm sang bài Self-Attention".
2. Gọi `resolveRefs` trên `STEPS` và `STEP_COMMENTS` trước khi truyền cho `createStepWizard`/`createCommentSection`. Dùng mẫu chung (xem `templates/lesson/index.html`), đừng sửa riêng từng bài mỗi kiểu.
3. Sau khi xong, test "không còn số bài" (Mục 6) phải xanh. **Đọc lại bằng mắt** 100% các câu đã thay: có bài nhắc *bài sau* ("sẽ học ở…") và bài nhắc *bài trước*, không được đảo nghĩa.

### Giai đoạn 5 — Kiểm chứng Python theo từng bài
1. Mỗi `lessons/<slug>/kiem_tra.py` có `def main() -> None` (raise `AssertionError` khi sai) và khối `if __name__ == "__main__": main()` in "ĐẠT CHUẨN". Chuyển từng hàm `kiem_tra_*` từ 5 file track cũ về đúng bài (ánh xạ: `kiem_tra_bai_01…06a` → `robot_vision, softmax_stability, softmax_regression, twolayer_relu_backprop, minibatch_sgd, cpp_matmul_loops`; `kiem_tra_strides_views` → `strides_views`; hàm theo tên chủ đề khác tự suy ra). **Giữ nguyên nội dung kiểm tra, không làm yếu assertion.** Hàm dùng chung (vd `_softmax` ở track 4) copy sang từng file cần hoặc đưa vào `tools/checks_common.py`.
2. `tools/run_checks.py`: tìm `lessons/*/kiem_tra.py`, chạy từng cái trong subprocess, in bảng ✅/❌ và tổng; tham số `--lesson <slug>`; mã thoát ≠ 0 nếu có bài sai. Bài nào có `lesson.json` mà thiếu `kiem_tra.py` thì **in cảnh báo** (và fail trong chế độ `--strict`, dùng cho CI).
3. Thêm npm script `"verify": "python3 tools/run_checks.py"`.

### Giai đoạn 6 — Công cụ tạo bài & tài liệu
1. `templates/lesson/` lấy từ bài mẫu hiện có (`layernorm_residual`: bố cục chuẩn, có `resolveRefs`, segmented control, slider, preset, verdict); đánh dấu `TODO` rõ ràng.
2. `tools/new-lesson.mjs <slug> [--topic t] [--path main --after other_slug]`: tạo thư mục từ mẫu, điền `lesson.json`, tùy chọn chèn slug vào lộ trình; chạy `build-catalog`. Từ chối slug không hợp lệ hoặc trùng.
3. Thêm npm scripts: `"new-lesson": "node tools/new-lesson.mjs"`.
4. Viết lại `README.md` (cấu trúc mới, cách chạy, **cách thêm/sửa/đổi thứ tự/đổi tên/xóa bài**) và `KE_HOACH_THIET_KE.md` (Mục II cấu trúc thư mục, Mục IV hợp đồng gói ví dụ, Mục IX lộ trình, Mục XII checklist đóng góp). Cập nhật `KE_HOACH_TIEP_THEO.md`: đánh dấu Task 0/4 là *thay thế bởi kế hoạch này*; sửa các Task còn lại dùng quy trình `new-lesson` thay vì đánh số.
5. Cập nhật liên kết trong repo `AI` nếu có đường dẫn trỏ vào `tensorplay/examples/...` (hiện `README.md` chỉ trỏ tới thư mục gốc `../tensorplay`; kiểm tra bằng `grep -rn "tensorplay" /mnt/2d4726e7-046b-47c7-b9a9-d2a9cc0cfc8d/Work/AI --include=*.md`). Không ghi đè thay đổi chưa commit của người dùng.

### Giai đoạn 7 — Tương thích ngược & dọn dẹp
1. Sinh trang chuyển hướng cho URL cũ từ `legacy-map.json` (Vite plugin nhỏ hoặc bước `build-catalog` ghi file HTML vào `public/examples/...`). Smoke test một URL cũ.
2. Xác minh với `localStorage` giả lập: đặt `tensorplay:progress = {"bai_13_self_attention": {completed:true}}` rồi mở bài `self_attention` — thẻ phải hiện "✓ Hoàn thành".
3. Xóa mọi tham chiếu `hw0…hw4`, `track`, `trackMap`, `examples/` còn sót (`grep` toàn repo, trừ `node_modules`, `dist`, `.git`, và các tài liệu lịch sử cần giữ — ghi chú rõ).
4. Chạy toàn bộ kiểm tra ở Mục 8 lần cuối.

---

## 6. Luật kiểm tra tự động (đặt trong `tools/build-catalog.mjs` và test Vitest `shared/curriculum-consistency.test.js`)

**Lỗi (fail):**
1. `id` trong `lesson.json` = tên thư mục; slug duy nhất; slug khớp `/^[a-z][a-z0-9_]*$/`; **không** khớp `/^bai_?\d/` và **không** chứa chuỗi hai chữ số liền nhau kiểu số thứ tự (`/\d{2}/`).
2. Mỗi thư mục bài có đủ `index.html`, `logic.js`, `logic.test.js`, `lesson.json`; bài `status: "ready"` bắt buộc có `kiem_tra.py`.
3. `title` không bắt đầu bằng "Bài" và không chứa mẫu `\bBài\s+\d`.
4. `topic` tồn tại trong `topics.json`; mọi slug trong `paths/*.json`, `prerequisites`, `related` đều tồn tại; không trùng slug trong cùng một lộ trình.
5. `prerequisites` không tạo chu trình, và trong lộ trình `main` mọi tiên quyết xuất hiện **trước** bài phụ thuộc.
6. `<title>` của `index.html` bắt đầu bằng `title` rút gọn của bài (khớp metadata) và không chứa số thứ tự.
7. Không còn `\bBài\s+\d` trong `lessons/**` (văn bản), mọi `[[lesson:x]]` trỏ tới slug có thật.
8. `public/curriculum/catalog.json` khớp bản sinh mới nhất (`catalog:check`).
9. Mọi `index.html` nạp `LessonNav.js`, và import `./logic.js` tồn tại.

**Cảnh báo (không fail, in ra):** bài `ready` không thuộc lộ trình nào; bài thiếu `prerequisites`; `estimatedMinutes` ngoài 3–30; `summary` rỗng.

---

## 7. Quy trình làm việc *sau* tái cấu trúc (viết vào README)

| Muốn | Làm |
|---|---|
| Thêm bài | `npm run new-lesson -- <slug> --topic <t> --path main --after <slug_khác>` rồi viết nội dung; `npm run check` |
| Đổi thứ tự | Sửa `curriculum/paths/<id>.json`; **không** sửa file bài |
| Tạo lộ trình mới | Thêm `curriculum/paths/<id>.json` |
| Đổi tên bài | Sửa `title` trong `lesson.json`; nếu đổi `slug` thì `git mv` thư mục, đổi `id`, thêm slug cũ vào `aliases`, cập nhật `legacy-map.json` và các `[[lesson:…]]` (test sẽ chỉ ra chỗ sót) |
| Xóa bài | Xóa thư mục; xóa slug khỏi lộ trình; test chỉ ra mọi tham chiếu thừa |
| Tách/gộp bài | Bài mới đặt `aliases` cho id cũ; cập nhật lộ trình và tham chiếu |

---

## 8. Quy trình xác minh (chạy sau mỗi giai đoạn)

```bash
cd /mnt/2d4726e7-046b-47c7-b9a9-d2a9cc0cfc8d/Work/tensorplay

npm run catalog:check          # catalog sinh ra khớp bản commit (từ Giai đoạn 1)
npx vitest run                 # unit test + katex-lint + consistency
npm run verify                 # mọi lessons/*/kiem_tra.py (từ Giai đoạn 5)
npx vite build                 # build tĩnh phải thành công
npx vite preview --port 4173 & # kiểm tra bản build: catalog.json phải fetch được
```

**Smoke test trình duyệt** cho ít nhất: trang chủ, 3 bài ngẫu nhiên, bài đầu và bài cuối của lộ trình, 1 URL cũ (chuyển hướng):
```bash
(npx vite --port 3111 --host 127.0.0.1 >/tmp/vite.log 2>&1 &) ; sleep 3
google-chrome --headless=new --no-sandbox --disable-gpu --enable-logging=stderr --v=0 \
  --virtual-time-budget=6000 --dump-dom "http://127.0.0.1:3111/lessons/<slug>/" \
  2>/tmp/chrome.err >/tmp/dom.html
grep -i CONSOLE /tmp/chrome.err | grep -vi "vite\|katex\|fonts\|net::"   # phải rỗng
pkill -f "vite --port 3111"
```
Kiểm tra DOM: `#verdict` có nội dung; không có `katex-error`; nút Trước/Sau trỏ đúng bài láng giềng **trong lộ trình đang chọn**; đổi `?path=llm-systems` thì láng giềng đổi theo; trang chủ đổi lộ trình thì thứ tự/số hiển thị đổi.

Vite dev server trả `index.html` cho `/lessons/<slug>/` (thư mục); kiểm tra thêm bản `vite preview` vì nhiều lỗi đường dẫn chỉ lộ ở bản build.

---

## 9. Tiêu chí chấp nhận cuối cùng

- [ ] Không còn thư mục `examples/`, `hw*`, file `*.logic.js` tên theo bài, `tools/renumber.py`.
- [ ] 34 thư mục `lessons/<slug>/`, mỗi thư mục đủ 5 tệp bắt buộc; tên và `id` không chứa số thứ tự.
- [ ] `grep -rEn "\bBài\s+[0-9]" lessons shared index.html curriculum` không ra kết quả.
- [ ] Thêm một bài thử bằng `npm run new-lesson` rồi **đảo vị trí hai bài** trong `main.json` chỉ chạm đúng 1–2 file (bài thử xóa đi sau khi chứng minh, không commit).
- [ ] Trang chủ có chọn lộ trình, lọc chủ đề, tìm kiếm; `LessonNav` đi theo lộ trình.
- [ ] Tiến độ cũ, ghi chú cũ, lịch sử chat cũ vẫn truy cập được; URL cũ chuyển hướng đúng.
- [ ] `npm run check`, `npm run verify`, `npx vite build` đều thành công; smoke test sạch lỗi console.
- [ ] Số test không giảm so với trước (208) — chỉ được thay thế test cũ bằng test tương đương/mạnh hơn, mỗi `logic.test.js` giữ nguyên các assertion.
- [ ] README và KE_HOACH_THIET_KE đã cập nhật, không nhắc "Bài NN" hay `hw0…hw4`.

## 10. Ngoài phạm vi / rủi ro cần để ý

- **Không** thêm framework (React/Vue/router); không dịch lại nội dung bài; không viết thêm bài mới trong đợt này (làm sau bằng `new-lesson`).
- **Không** tự bịa ánh xạ homework CMU. Trường `sources` và lộ trình `cmu-10414` chỉ điền khi đối chiếu được tài liệu khóa học.
- Rủi ro lớn nhất: tham chiếu chéo đảo nghĩa khi thay bằng `[[lesson:…]]`, và đường dẫn bản build khác bản dev. Đã có biện pháp ở Giai đoạn 4 và Mục 8.
- Nếu một bước không thể làm theo kế hoạch (vd renderer không cho phép liên kết), chọn phương án an toàn hơn, ghi rõ lý do trong commit, và báo lại người dùng thay vì tự mở rộng phạm vi.
- Không `git push`; người dùng tự xác thực và push. Commit theo giai đoạn, tiền tố `refactor:`/`feat:`/`docs:`.
