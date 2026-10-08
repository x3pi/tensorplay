# 🚀 Kế Hoạch Giai Đoạn Tiếp Theo — TensorPlay (dành cho Agent thực hiện)

> ⚠️ **CẬP NHẬT (cấu trúc mới):** Dự án đã chuyển sang `lessons/<slug>/` + `curriculum/` (xem `KE_HOACH_CAU_TRUC_LINH_HOAT.md`). **Task 0 (đánh số lại) và Task 4 (đổi tên file cho khớp số bài) đã lỗi thời và không cần làm.** Task 1–3 đã hoàn thành; Task 5 (bài tập trong repo `AI`, Bài tập 14–28) và phần lớn Task 6 (LR schedule, data parallel, tokenization, ZeRO, GQA, RoPE, LoRA, MoE, mini-GPT) cũng đã xong. Khi làm các task còn lại (Task 5 bài tập trong repo `AI`, Task 6 backlog), dùng `npm run new-lesson` thay vì đánh số, và đường dẫn bài là `lessons/<slug>/`.


> Tài liệu tự đủ để một agent chưa biết gì về dự án có thể làm tiếp. Đọc hết Mục 0–2 trước khi sửa bất kỳ file nào.
> Ngày lập: 2026-10-08. Trạng thái nền: 31 bài, 40 file test / 190 test xanh, `vite build` chạy được, nhánh `main` đã đồng bộ `origin/main`.

---

## 0. Bối cảnh & Nguyên tắc bắt buộc

**TensorPlay** (`/mnt/2d4726e7-046b-47c7-b9a9-d2a9cc0cfc8d/Work/tensorplay`) là bộ "sandbox tương tác" tiếng Việt để học toán và hệ thống của Deep Learning. Mỗi bài = 1 trang HTML tĩnh độc lập (Vite + Vitest, KaTeX qua CDN, không framework).

Repo liên quan: `/mnt/2d4726e7-046b-47c7-b9a9-d2a9cc0cfc8d/Work/AI` (tài liệu học, có `AGENTS.md` quy định cách viết bài tập toán). **Quy chuẩn trong `AGENTS.md` áp dụng cho mọi nội dung toán của bài mới**, tóm tắt:

1. Mỗi bài gắn với một tình huống thực/tưởng tượng cụ thể, **cấm** bài học thuộc lòng hay điền công thức khô.
2. Số nhỏ, tròn, dễ nhẩm (0, 1, 2, -1, 0.5, 0.25, 0.1); ma trận tối đa 2×2, 2×3 hoặc vector 2–4 phần tử. Số lớn chỉ dùng khi tính dung lượng RAM/FLOPs.
3. KaTeX an toàn: **không** dùng `_` trần hay `\text{___}` trong toán; ô trống trong ma trận dùng `?`, trong văn bản dùng code span `` `______` ``. Test `shared/katex-lint.test.js` sẽ chặn.
4. Mọi bài phải có script Python kiểm chứng độc lập (`kiem_tra_bai_tap.py` của track).

**Nguyên tắc kiến trúc** (xem `KE_HOACH_THIET_KE.md`): "Atomic Concept Sandbox" — mỗi bài chỉ một "Aha!"; không phụ thuộc cứng vào bài khác; không router/registry; thêm bài không được sửa logic bài cũ.

**Ràng buộc quy trình:**
- Không `git push` (người dùng tự push vì cần token). Chỉ commit khi người dùng yêu cầu rõ; nếu commit, dùng tiền tố `feat:`/`fix:`/`docs:`/`refactor:` như lịch sử repo và thêm dòng `Co-Authored-By` theo cấu hình của phiên làm việc.
- Không bao giờ ghi token/secret vào repo.
- Trong repo `AI` đang có thay đổi chưa commit của người dùng (`README.md`, `stages/04_candle_and_dl_systems/toan_hoc/BAI_TAP_TOAN_HOC.md`, `.../kiem_tra_bai_tap.py`): **đọc kỹ và chỉ thêm, không ghi đè**.

---

## 1. Cấu trúc hiện tại (31 bài)

| Track | Thư mục | Bài |
|---|---|---|
| 0 | `hw0_tensor_memory/` | 01 robot_vision · 02 softmax_loss · 03 softmax_regression · 04 twolayer_relu_backprop · 05 minibatch_sgd · 06 cpp_matmul_loops (`bai_06a_…`) · 07 memory_leak (`bai_03b_…`) · 08 cache_locality (`bai_03_…`) · 09 strides_views |
| 1 | `hw1_autograd_engine/` | 10 autograd_graph (`bai_04_…`) · 11 reverse_vs_forward_ad (`bai_05_…`) · 12 broadcast_grad · 13 gradient_check |
| 2 | `hw2_modules_conv/` | 14 activation_valves (`bai_06_…`) · 15 kaiming_init · 16 optimizers · 17 batch_norm (`bai_09_…`) · 18 dropout · 19 layernorm_residual · 20 conv2d_im2col (`bai_08_…`) · 21 minibatch_assembly (`bai_07_…`) |
| 3 | `hw3_cuda_architecture/` | 22 cuda_threads (`bai_10_…`) · 23 shared_memory_tiling (`bai_11_…`) · 24 coalescing_and_banks (`bai_12_…`) · 25 mixed_precision |
| 4 | `hw4_transformer_llm/` | 26 rnn_bptt · 27 self_attention (`bai_13_…`) · 28 positional_encoding · 29 multi_head_attention · 30 kv_cache (`bai_14_…`) · 31 flash_attention (`bai_15_…`) |

**Điểm cần nhớ về cách số bài hoạt động (nguồn gây lỗi nếu làm ẩu):**
- Tên file **không** khớp số bài (di sản lịch sử). `examples/catalog.json` là nguồn sự thật cho thứ tự: mảng được sắp theo `order`; `shared/components/LessonNav.js` dùng đúng thứ tự mảng này để tạo nút Trước/Sau.
- `id` trong catalog = tên cơ sở của file (vd `bai_13_self_attention`) và cũng là khóa lưu tiến độ trong `localStorage` (`markCompleted(LESSON_ID)` ở mỗi trang). **KHÔNG đổi `id`.**
- Số bài xuất hiện ở: `title` trong catalog; `<title>` của mỗi `.html`; dòng comment đầu mỗi `.logic.js` (`* Bài NN: …`); các câu tham chiếu chéo trong chữ ("Bài 17", "(xem Bài 12)") nằm trong `STEPS`/`STEP_COMMENTS` của `.html`; `README.md`; `KE_HOACH_THIET_KE.md` (Mục IX); `index.html` (câu "Bài 01 → 31").
- Hai file `bai_02b_softmax_regression.html` và `hw1_autograd_engine/bai_06b_matrix_relu_backprop.html` là trang chuyển hướng cũ, không nằm trong catalog.

---

## 2. Quy trình & Mẫu chuẩn cho một bài mới

### 2.1 Bộ file bắt buộc (đặt trong thư mục track)
`<ten_bai>.html` + `<ten_bai>.logic.js` + `<ten_bai>.logic.test.js`. **Đặt tên không kèm số** (như `dropout`, `layernorm_residual`) để tránh lặp lại tình trạng lệch số.

### 2.2 File mẫu để sao chép (đã chạy tốt, đã kiểm tra trên Chrome headless)
- `examples/hw2_modules_conv/layernorm_residual.{html,logic.js,logic.test.js}` — mẫu 5 bước, có segmented control, slider, preset, bảng thống kê, KaTeX.
- `examples/hw3_cuda_architecture/mixed_precision.*` — mẫu có hai slider và cảnh báo số học.
- `examples/hw4_transformer_llm/multi_head_attention.*`, `positional_encoding.*` — mẫu bảng trọng số attention.

### 2.3 Hợp đồng `logic.js`
Xuất `export class LessonLogic` với `reset()`, `applyPreset(state)`, `onUserUpdate(partial)`, `calculate()`; xuất `export const PRESETS = [{id,label,state}]`; các hàm toán thuần xuất riêng để test. **Chạy được trong Node, không đụng DOM.** `calculate()` trả `verdict: { type: 'success'|'warning'|'danger', text }` và chuỗi `formulaKaTeX`.

### 2.4 Hợp đồng `.html`
Giữ nguyên khung: header, `<main class="lab-grid">` 3 cột (`col-narrative`, `col-sandbox`, `col-telemetry`), mount `#mount-step-wizard`, `#mount-comment-section`, `#mount-preset-picker`, nút `#btn-reset`, `#verdict`. Import các factory từ `../../shared/components/` (`createStepWizard`, `createLiveSlider`, `createPresetPicker`, `createCommentSection`), `renderMath`/`renderAllInlineMath` từ `../../shared/katex-render.js`, `markCompleted` từ `../../shared/progress.js`; cuối trang nạp `LessonNav.js`.
Mỗi `STEP` có: `step, badge, heading, problem, mechanism, action, takeaway`. Có 4–5 bước, bước cuối gọi `markCompleted`. Có `STEP_COMMENTS` (id duy nhất toàn dự án, `tagType` ∈ `gotcha|math|systems`).

### 2.5 Các bẫy kỹ thuật đã gặp (đọc kỹ)
1. **Escape LaTeX trong chuỗi JS một dấu nháy:** phải viết `\\frac`, `\\approx`, `\\times` (hai gạch). Nếu tạo file bằng Python (heredoc thường), `\\` bị nuốt thành `\` và JS hiểu sai (`\a`, `\t`…) → mất chữ. Dùng raw string (`r'''…'''`) hoặc công cụ Write. Dấu nháy đơn trong chuỗi (`f'`) phải viết `f\'`.
2. **StepWizard KHÔNG render Markdown:** `**đậm**` và `*nghiêng*` hiện nguyên dấu sao. Chỉ dùng văn bản thường, `$…$`, `$$…$$` và `` `code` ``. Xuống dòng bằng `\n` (ví dụ ở trường `action`).
3. **`-0` trong Vitest:** `toEqual([0])` thất bại với `-0`. Chuẩn hóa bằng `x + 0` hoặc `Math.round(x*1e9)/1e9 + 0`.
4. **Lớp CSS verdict:** chỉ `success`, `warning`, `danger` (không có `info`).
5. **`LiveSlider` chỉ hiển thị giá trị thô**, không có hàm format; đặt đơn vị/giá trị suy ra (vd `g = 1e-8`) trong một dòng caption riêng.
6. **Số liệu phải kiểm chứng độc lập:** tính bằng numpy/công thức khác trước, rồi mới đặt vào test JS. Hai lần trong phiên trước ước lượng nhẩm lệch ở chữ số thứ 4 (1.6352 vs 1.6351).
7. **Đừng khẳng định thứ chưa kiểm chứng.** Ví dụ đã phát hiện: mixed precision không giảm bộ nhớ trạng thái tham số (cả hai đều 16 byte/param với Adam) — bài phải nói đúng điều này.

### 2.6 Checklist hoàn tất một bài (Definition of Done)
- [ ] 3 file bài + mục trong `examples/catalog.json` (`id`, `track`, `trackTitle`, `order`, `title` dạng `Bài NN: …`, `path`, `summary` có thể chứa `$…$`, `tags`, `difficulty`, `estimatedMinutes`, `status: "ready"`).
- [ ] Hàm kiểm chứng mới trong `examples/<track>/kiem_tra_bai_tap.py` **và** được gọi trong khối `if __name__ == '__main__'`; script chạy ra "ĐẠT CHUẨN".
- [ ] `npx vitest run` toàn bộ xanh (gồm `katex-lint`).
- [ ] `npx vite build` thành công.
- [ ] Smoke test trình duyệt (mục 5) không có lỗi console.
- [ ] Cập nhật `KE_HOACH_THIET_KE.md` Mục IX, `README.md` (số bài, dải bài mỗi track), `index.html` (câu "Bài 01 → N").
- [ ] Số bài và tham chiếu chéo trong chữ đã khớp thứ tự cuối cùng (xem Task 0).

---

## 3. Thứ tự mục tiêu sau khi thêm 3 bài (34 bài)

| # mới | Bài | Trạng thái | # cũ |
|---|---|---|---|
| 01–03 | robot_vision, softmax_loss, softmax_regression | giữ | 01–03 |
| **04** | **cross_entropy_logsumexp** | **MỚI (Task 1)** | — |
| 05–10 | twolayer_relu, minibatch_sgd, cpp_matmul, memory_leak, cache_locality, strides_views | dời +1 | 04–09 |
| 11–14 | autograd_graph, reverse_vs_forward, broadcast_grad, gradient_check | dời +1 | 10–13 |
| 15 | activation_valves | dời +1 | 14 |
| 16 | kaiming_init | dời +1 | 15 |
| 17 | optimizers | dời +1 | 16 |
| **18** | **adamw_weight_decay** | **MỚI (Task 2)** | — |
| 19 | batch_norm | dời +2 | 17 |
| 20 | dropout | dời +2 | 18 |
| 21 | layernorm_residual | dời +2 | 19 |
| 22 | conv2d_im2col | dời +2 | 20 |
| 23 | minibatch_assembly | dời +2 | 21 |
| 24–26 | cuda_threads, shared_memory_tiling, coalescing_and_banks | dời +2 | 22–24 |
| 27 | mixed_precision | dời +2 | 25 |
| **28** | **activation_checkpointing** | **MỚI (Task 3)** | — |
| 29 | rnn_bptt | dời +3 | 26 |
| 30 | self_attention | dời +3 | 27 |
| 31 | positional_encoding | dời +3 | 28 |
| 32 | multi_head_attention | dời +3 | 29 |
| 33 | kv_cache | dời +3 | 30 |
| 34 | flash_attention | dời +3 | 31 |

Track theo số mới: hw0 = 01–10, hw1 = 11–14, hw2 = 15–23, hw3 = 24–28, hw4 = 29–34.

---

## 4. Danh sách công việc

### Task 0 — Công cụ đánh số lại (làm đầu tiên, làm một lần)
**Mục tiêu:** viết script một lần chạy `tools/renumber.py` (hoặc đặt trong scratchpad nếu không muốn giữ) nhận bảng ánh xạ `id → số mới` và cập nhật mọi nơi liệt kê ở Mục 1. Không sửa tay từng file.

Yêu cầu:
1. Ánh xạ theo `id` (không theo tên file). Ghi bảng ánh xạ cố định trong script, kèm các số cũ ↔ mới ở Mục 3.
2. Cập nhật: `catalog.json` (`order`, `title`, và `track`/`path` nếu dời thư mục), `<title>` của html, comment đầu `.logic.js`, `README.md`, `KE_HOACH_THIET_KE.md`.
3. Với tham chiếu chéo trong chữ: dùng regex `Bài (\d{2})\b` rồi ánh xạ **một lượt** (map cũ→mới, không chuỗi hóa để tránh dịch hai lần). Bỏ qua trang chuyển hướng. Với tham chiếu một chữ số (`Bài 3`, `Bài 4` trong `bai_04_twolayer_relu_backprop.html`, và `Bài 4.1`, `Bài 6.1`… trong comment/label của một số `.logic.js`) là **số cục bộ cũ** — xử lý thủ công, đọc ngữ cảnh rồi sửa đúng.
4. Sau khi chạy: `grep -rnE "Bài [0-9]+" examples shared index.html README.md KE_HOACH_THIET_KE.md` và **đọc từng dòng tham chiếu chéo** xem còn đúng nghĩa (vd "Bài 17 (BatchNorm)" phải thành "Bài 19").
5. Kiểm tra ngược: bài thứ N trong catalog phải có `<title>` bắt đầu `Bài N:`. Viết thành một test Vitest mới `shared/catalog-consistency.test.js`: đọc catalog, kiểm `order` liên tục 1..N, `title` khớp `Bài ${order}`, mỗi `path` tồn tại, `<title>` của file html khớp. Test này chặn tái phát lỗi lệch số.

Gợi ý: làm Task 0 **sau cùng** của đợt thêm bài (khi đã đủ 3 bài mới) để chỉ phải đánh số một lần. Trong lúc làm Task 1–3, tạm đặt `order` cuối catalog và số bài tạm thời đúng với kết quả cuối.

---

### Task 1 — Bài mới: Cross-Entropy dạng Log-Sum-Exp (Track 0, Bài 04)
**File:** `hw0_tensor_memory/cross_entropy_logsumexp.*`; **id:** `cross_entropy_logsumexp`.

**Aha duy nhất:** tính `log(softmax(z))` bằng cách "softmax rồi log" làm hỏng loss khi logit chênh lệch lớn; công thức `log p_y = z_y − logsumexp(z)` thì ổn. Nối Bài 02 (Safe Softmax) với Bài 03 (loss, gradient `P − Y`).

**Tình huống:** robot phân loại biển báo 2 lớp, camera nhiễu cực đại làm logit `z = [0, −1000]`… hoặc logit đúng-lớp rất nhỏ so với lớp sai.

**Số liệu mẫu (agent phải tự kiểm chứng bằng numpy):**
- `z = [0, -1000]`, nhãn thật là lớp 1 (index 1, logit −1000).
  - Cách ngây thơ: `softmax = [1, 0]` (FP32/FP64 đều làm tròn `e^-1000` về 0), `log(0) = -Infinity` → loss `Infinity`.
  - Cách LSE: `m = 0`, `logsumexp = 0 + log(e^0 + e^-1000) ≈ 0`, `log p_1 = -1000 - 0 = -1000` → loss = 1000, hữu hạn và đúng.
- Cho thêm cặp logit vừa phải `z = [2, 1]`, nhãn 1: loss = `log(e^2+e^1) − 1 = 1.3133`.
- Gradient: `∂L/∂z = softmax(z) − onehot(y)` luôn hữu hạn; xác nhận bằng sai phân hữu hạn ở `z=[2,1]`.

**Điều khiển gợi ý:** slider logit của lớp sai (−1000…+10) hoặc preset ("Ổn định", "Logit chênh 1000", "Cả hai logit rất lớn"); chọn nhãn thật; công tắc "Naive / LSE".

**Mục kiểm tra:** loss naive = Infinity khi `p_y` underflow; loss LSE khớp `numpy`/`scipy.special.logsumexp`; gradient tổng bằng 0; `softmax` luôn cộng 1.

**Ghi chú:** các framework dùng `log_softmax` hoặc `cross_entropy(logits, target)` gộp sẵn, không bao giờ dùng `log(softmax(x))` — đưa thành một `STEP_COMMENT` kiểu gotcha.

---

### Task 2 — Bài mới: Weight Decay — L2 vs AdamW (Track 2, Bài 18)
**File:** `hw2_modules_conv/adamw_weight_decay.*`; **id:** `adamw_weight_decay`. Đứng ngay sau Bài Optimizers (Adam).

**Aha duy nhất:** cộng L2 vào gradient rồi đưa qua Adam **không** cho kết quả giống weight decay đúng nghĩa, vì bước chuẩn hóa `1/√v̂` của Adam làm méo lực kéo. AdamW tách weight decay ra khỏi gradient.

**Tình huống:** một trọng số `w = 1` không nhận gradient dữ liệu (`g = 0`) — ví dụ đặc trưng không bao giờ bật — ta muốn nó teo dần một cách có kiểm soát để chống overfitting.

**Số liệu mẫu (lấy `lr = 0.1`, `λ = 0.1`, `β1 = 0.9`, `β2 = 0.999`, bước đầu tiên, có bias correction, `ε` rất nhỏ hoặc bỏ):**
- SGD + L2: `w ← w − lr·(g + λw) = 1 − 0.1·0.1 = 0.99`. SGD decoupled cũng ra `0.99` (hai cách tương đương ở SGD).
- Adam + L2: gradient hiệu dụng `g' = λw = 0.1`; `m̂ = 0.1`, `v̂ = 0.01` → bước `lr · m̂/√v̂ = 0.1·1 = 0.1` → `w = 0.9`. Lực kéo **không phụ thuộc λ** (đổi λ = 0.01 vẫn ra 0.9).
- AdamW: `w ← w − lr·λ·w = 0.99`; bước tỉ lệ đúng với λ.
- Aha: Adam+L2 teo nhanh gấp 10 lần dự kiến và mất kiểm soát hệ số λ.

**Điều khiển gợi ý:** slider λ (0, 0.01, 0.1), công tắc "L2-trong-gradient / AdamW", số bước (1–5) để xem quỹ đạo `w` theo thời gian; preset "SGD", "Adam + L2 ❌", "AdamW ✅".

**Mục kiểm tra:** cài đặt Adam thủ công bằng numpy và đối chiếu với `torch.optim` nếu có sẵn (nếu không có torch, dùng công thức); xác nhận ở bước 1 các giá trị 0.99 / 0.9 / 0.99; xác nhận Adam+L2 không đổi khi λ đổi (ở g=0, bước đầu).

**Ghi chú:** `STEP_COMMENT` nhắc "không áp weight decay lên bias và LayerNorm" (thực hành chuẩn), và bài báo "Decoupled Weight Decay Regularization" (Loshchilov & Hutter). Tùy chọn mở rộng (bài riêng, ưu tiên thấp): **LR warmup** — vì ở các bước đầu `v̂` ước lượng nhiễu nên bước nhảy của Adam quá lớn.

---

### Task 3 — Bài mới: Activation Checkpointing (Track 3, Bài 28)
**File:** `hw3_cuda_architecture/activation_checkpointing.*`; **id:** `activation_checkpointing`. Đứng sau Bài Mixed Precision.

**Aha duy nhất:** huấn luyện tốn RAM chủ yếu vì phải **giữ activation của forward để dùng cho backward**; đổi lại bằng tính lại một phần forward (≈ +33% thời gian) có thể giảm RAM từ `O(L)` xuống `O(√L)`.

**Tình huống:** mạng 16 tầng, mỗi activation chiếm 1 đơn vị bộ nhớ (ví dụ 1 GB), GPU chỉ còn 10 GB trống.

**Số liệu mẫu (agent kiểm chứng):**
- Không checkpoint: lưu cả 16 activation → 16 đơn vị > 10 ⇒ OOM.
- Checkpoint mỗi `k = 4` tầng: giữ `L/k = 4` điểm neo; khi backward một đoạn, tính lại `k = 4` activation trong đoạn đó ⇒ đỉnh bộ nhớ `L/k + k = 8` đơn vị ≤ 10 ⇒ chạy được.
- Tối ưu theo √L: `k = √16 = 4` cho `L/k + k` nhỏ nhất (=8).
- Chi phí tính: forward = 1 đơn vị thời gian, backward ≈ 2; tổng 3. Checkpoint thêm 1 lần forward ⇒ 4 ⇒ chậm hơn 4/3 ≈ +33%.
- Kiểm chứng `L = 16, k ∈ {1, 2, 4, 8, 16}`: bộ nhớ `L/k + k` = 17, 10, 8, 10, 17 (k=1 và k=L suy biến thành đắt nhất, đúng quy luật).

**Điều khiển gợi ý:** slider `k` (1…16, bước 1) và ngân sách bộ nhớ; hiển thị thanh RAM so với ngân sách, thanh thời gian; preset "Không checkpoint ❌ (OOM)", "k=4 ✅", "k=1 (neo mọi tầng, lãng phí)".

**Mục kiểm tra:** công thức đỉnh bộ nhớ đúng; tìm `k` tối ưu bằng duyệt bằng vòng lặp khớp `round(sqrt(L))`; tỉ lệ thời gian 4/3. Lưu ý trung thực: mô hình đơn giản hóa (mọi tầng cùng kích thước, bỏ qua trọng số/optimizer), phải nói rõ trong bài.

---

### Task 4 — Dọn dẹp & đổi tên file cho khớp số bài
Thực hiện **sau Task 0–3**, trong một commit riêng.

1. Tìm liên kết vào hai trang chuyển hướng cũ: `grep -rn "bai_02b_softmax_regression\|bai_06b_matrix_relu_backprop" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git`. Nếu chỉ còn chính chúng (và các test của chúng — `bai_02b_…logic.test.js`, `bai_06b_…logic.test.js`), xóa cả bộ file (`.html`, `.logic.js`, `.logic.test.js`).
2. Tùy chọn có chủ đích: đổi tên các file di sản có số cục bộ sai (`bai_13_self_attention` → `self_attention`, `bai_14_kv_cache_anatomy` → `kv_cache_anatomy`, `bai_09_batch_norm_dynamics` → `batch_norm_dynamics`, v.v.) bằng `git mv` cả bộ 3 file. **Giữ nguyên `id` trong catalog và `LESSON_ID`/`lessonId` trong html** để không mất tiến độ người học; chỉ đổi `path`. Cập nhật `import … from './<ten>.logic.js'` trong html và test, và dòng `describe('…')`/comment đường dẫn bên trong. Chạy lại test + build + smoke.
3. Sửa tên hàm/nhãn lỗi thời: nhãn preset kiểu `"Bài 6.1 (A 2x3, B 3x2)"`, `"Bài 5: Khởi tạo 0, B=2"` — đổi thành tên mô tả không chứa số bài.

---

### Task 5 — Tài liệu bài tập trong repo `AI` (tùy chọn nhưng nên làm)
Repo: `/mnt/2d4726e7-046b-47c7-b9a9-d2a9cc0cfc8d/Work/AI`, thư mục `stages/04_candle_and_dl_systems/toan_hoc/`.

1. Đọc `AGENTS.md` ở gốc repo `AI` và `BAI_TAP_TOAN_HOC.md` hiện có để bắt chước văn phong, khung số liệu, cách đánh số.
2. Thêm các phần bài tập tự luyện (tính tay trong 2–5 phút, số nhỏ) cho các chủ đề mới: LayerNorm vs BatchNorm (ma trận `[[1,3],[2,6]]`), mixed precision/loss scaling, positional encoding, multi-head attention (X 3×4, h=2), cross-entropy LSE, AdamW, activation checkpointing.
3. Mỗi bài tập có tình huống thực tế (AGENTS.md mục 2), ô trống dùng `?` hoặc code span (mục 4).
4. Cập nhật `kiem_tra_bai_tap.py` cùng thư mục với hàm kiểm chứng tương ứng, chạy phải ra kết quả đạt.
5. **Không** ghi đè thay đổi chưa commit của người dùng: chạy `git diff` trước, chỉ thêm phần mới.

---

### Task 6 — Backlog ưu tiên thấp (chỉ làm khi 0–5 xong)
Mỗi mục là một bài độc lập, làm theo Mục 2:
- LR schedule & warmup (cosine, linear warmup) — Track 2, sau AdamW.
- Data Parallelism & All-Reduce (tổng gradient trên 2 GPU, chi phí truyền thông) — Track 3, sau Checkpointing.
- Embedding & Tokenization (bảng tra, chỉ số `index = token * d + j` như offset 1D) — Track 4, trước Positional Encoding.
- Bài ôn tập tổng hợp "mini-GPT một khối" ghép LN + MHA + residual.

---

## 5. Quy trình xác minh (chạy sau mỗi bài và sau mỗi task)

```bash
cd /mnt/2d4726e7-046b-47c7-b9a9-d2a9cc0cfc8d/Work/tensorplay

# 1) Unit test + lint KaTeX (phải xanh toàn bộ)
npx vitest run

# 2) Kiểm chứng số học độc lập, theo track
for t in hw0_tensor_memory hw1_autograd_engine hw2_modules_conv hw3_cuda_architecture hw4_transformer_llm; do
  python3 examples/$t/kiem_tra_bai_tap.py | tail -3
done

# 3) Build tĩnh
npx vite build

# 4) Smoke test trình duyệt: bài phải render, không lỗi console
(npx vite --port 3111 --host 127.0.0.1 >/tmp/vite.log 2>&1 &) ; sleep 3
google-chrome --headless=new --no-sandbox --disable-gpu --enable-logging=stderr --v=0 \
  --virtual-time-budget=6000 --dump-dom \
  "http://127.0.0.1:3111/examples/<track>/<ten_bai>.html" 2>/tmp/chrome.err >/tmp/dom.html
grep -i CONSOLE /tmp/chrome.err | grep -vi "vite\|katex\|fonts\|net::"   # phải rỗng
grep -c 'class="tp-verdict' /tmp/dom.html                               # phải >= 1; xem nội dung #verdict
pkill -f "vite --port 3111"
```
Với bài mới nên mở DOM kiểm tra nội dung `#verdict` và bảng telemetry khớp số liệu mẫu trong test (đã dùng cách này cho 4 bài gần nhất).

Nếu có thể mở trình duyệt có giao diện, kiểm tra thêm bằng mắt: bấm từng preset, từng nút phân đoạn, kéo từng slider, chuyển hết các bước của wizard, và thử nút **Bài trước / Bài kế** ở đầu trang đi đúng thứ tự mới.

---

## 6. Thứ tự thực hiện đề xuất
1. Task 1, 2, 3 (mỗi bài một nhánh/commit, đều theo Mục 2). Trong lúc làm, đặt `order` tạm cuối catalog.
2. Task 0 (chạy script đánh số lại một lần; thêm test `catalog-consistency`).
3. Task 4 (dọn dẹp, đổi tên file).
4. Task 5 (tài liệu bài tập repo `AI`).
5. Cập nhật `KE_HOACH_THIET_KE.md` Mục IX, `README.md`, `index.html`; xóa phần "Backlog" các mục đã làm.
6. Báo lại cho người dùng: danh sách file đã đổi, kết quả 4 lệnh ở Mục 5, và để người dùng tự `git push`.

## 7. Tiêu chí chấp nhận cuối cùng
- Catalog có 34 bài, `order` liên tục 1..34, `title` khớp `<title>`; test `catalog-consistency` xanh.
- `npx vitest run` xanh, `vite build` thành công, 5 script Python đều "ĐẠT CHUẨN".
- Không còn tham chiếu chéo sai số bài (đã đọc lại bằng mắt các dòng `grep "Bài [0-9]"`).
- 3 bài mới hoạt động trên trình duyệt, mỗi bài có ≥ 4 bước, ≥ 3 preset, `STEP_COMMENTS`, hàm Python kiểm chứng.
- Không có secret trong repo; không có `git push`; không đổi `id` của bài cũ.
