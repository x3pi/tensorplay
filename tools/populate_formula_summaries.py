#!/usr/bin/env python3
"""
Populate FormulaSummary component and core formulas across all TensorPlay lessons.
Ensures every lesson has a synthesized mathematical & systems formula cheat sheet
at the end of Column 1 (Khung Dẫn Dắt & Chú Giải).
"""

import os
import re

LESSON_FORMULAS = {
    # --------------------------------------------------------------------------
    # Group 1: Foundations & Classical ML
    # --------------------------------------------------------------------------
    "robot_vision": [
        {
            "id": "rv-dot",
            "title": r"1. Điểm Số Nhận Diện Qua Tích Vô Hướng (Dot Product)",
            "formula": r"Z = X \cdot W = \sum_{i=0}^3 x_i w_i",
            "shape": r"X \in \{0, 1\}^4, \; W \in \mathbb{R}^4 \implies Z \in \mathbb{R}",
            "description": r"Ảnh $2 \times 2$ được duỗi phẳng thành vector 4 phần tử. Mỗi pixel nhân với một trọng số để chấm điểm biển báo.",
            "takeaway": r"Phép nhân ma trận hay tích vô hướng chính là cỗ máy chấm điểm độ tương đồng thị giác.",
            "tags": [r"Forward", r"Đại Số Tuyến Tính"]
        },
        {
            "id": "rv-boundary",
            "title": r"2. Ranh Giới Quyết Định Nhị Phân (Decision Boundary)",
            "formula": r"\hat{y} = \mathbb{1}[Z \ge 0] \implies \begin{cases} 1 & \text{nếu } Z \ge 0 \text{ (Đi Thẳng)} \\ 0 & \text{nếu } Z < 0 \text{ (Dừng Lại)} \end{cases}",
            "shape": r"Z \in \mathbb{R} \implies \hat{y} \in \{0, 1\}",
            "description": r"Dấu của $Z$ quyết định hành vi robot. Siêu phẳng $X \cdot W = 0$ chia không gian 4 chiều thành 2 nửa quyết định.",
            "takeaway": r"Nơ-ron nhị phân hoạt động như một công tắc ngưỡng dựa trên dấu của điểm số.",
            "tags": [r"Phân Loại", r"Ngưỡng"]
        },
        {
            "id": "rv-weights",
            "title": r"3. Cơ Chế Thưởng / Phạt Của Trọng Số Âm & Dương",
            "formula": r"w_i > 0 \implies \text{Detector (Khuyến khích)}, \quad w_i < 0 \implies \text{Inhibitor (Bác bỏ)}",
            "shape": r"W \in \mathbb{R}^4",
            "description": r"Trọng số dương cộng điểm khi pixel sáng. Trọng số âm trừ điểm để chặn lỗi (ví dụ đèn pha chiếu làm sáng cả 4 pixel).",
            "takeaway": r"Trọng số âm là bằng chứng bác bỏ, giúp mô hình phân biệt mẫu thay vì chỉ đếm số lượng pixel sáng.",
            "tags": [r"Trực Giác", r"Trọng Số"]
        },
        {
            "id": "rv-layout",
            "title": r"4. Ánh Xạ Bộ Nhớ 1D Row-Major Order",
            "formula": r"\text{index} = r \times C + c",
            "shape": r"r \in [0, R-1], \; c \in [0, C-1] \implies \text{index} \in [0, RC-1]",
            "description": r"Trong RAM máy tính, ma trận 2D được trải phẳng liên tục theo từng hàng. Với ảnh $2 \times 2$: $(r=1, c=1) \to \text{index} = 3$.",
            "takeaway": r"Mọi tensor đa chiều trong bộ nhớ vật lý đều là dải ô nhớ tuyến tính 1D.",
            "tags": [r"Systems", r"Bộ Nhớ RAM"]
        }
    ],

    "softmax_stability": [
        {
            "id": "ss-naive",
            "title": r"1. Công Thức Softmax Ngây Thơ (Naive Softmax)",
            "formula": r"P_i = \frac{e^{z_i}}{\sum_{j=1}^K e^{z_j}}",
            "shape": r"z \in \mathbb{R}^K \implies P \in [0, 1]^K, \; \sum_i P_i = 1.0",
            "description": r"Biến vector điểm thô $z$ thành phân phối xác suất. Gặp lỗi tràn số khi $z_i > 88.72$ trong chuẩn FP32.",
            "takeaway": r"Hàm mũ $e^z$ tăng cực nhanh, dễ vượt quá giới hạn biểu diễn của số thực dấu phẩy động.",
            "tags": [r"Forward", r"Softmax"]
        },
        {
            "id": "ss-shift",
            "title": r"2. Tính Chất Bất Biến Dịch Chuyển (Shift-Invariance)",
            "formula": r"\operatorname{softmax}(z)_i = \frac{e^{z_i - c}}{\sum_{j=1}^K e^{z_j - c}} \quad \forall c \in \mathbb{R}",
            "shape": r"c = \text{scalar}",
            "description": r"Chứng minh: nhân cả tử và mẫu với $e^{-c}$ triệt tiêu nhau, không làm thay đổi phân phối xác suất đầu ra.",
            "takeaway": r"Ta có quyền trừ đi một số bất kỳ trên toàn bộ vector logits mà không làm sai lệch kết quả toán học.",
            "tags": [r"Toán Học", r"Bất Biến"]
        },
        {
            "id": "ss-safe",
            "title": r"3. Softmax An Toàn (Safe Softmax)",
            "formula": r"m = \max_{j=1}^K z_j, \qquad P_i = \frac{e^{z_i - m}}{\sum_{j=1}^K e^{z_j - m}}",
            "shape": r"z_i - m \le 0 \implies e^{z_i - m} \in (0, 1]",
            "description": r"Trừ $m = \max(z)$ đảm bảo số mũ lớn nhất là $e^0 = 1$. Mẫu số luôn $\ge 1$, triệt tiêu 100% lỗi tràn số (overflow).",
            "takeaway": r"Mọi framework (PyTorch, Candle, TensorFlow) đều cài đặt Safe Softmax ở tầng nhân C++/CUDA.",
            "tags": [r"Systems", r"Ổn Định Số Học"]
        }
    ],

    "softmax_regression": [
        {
            "id": "sr-forward",
            "title": r"1. Lan Truyền Tiến: Logits & Softmax",
            "formula": r"Z = X \cdot W, \qquad P_{b, i} = \frac{e^{Z_{b, i}}}{\sum_{j=1}^K e^{Z_{b, j}}}",
            "shape": r"X \in \mathbb{R}^{B \times n}, \; W \in \mathbb{R}^{n \times K} \implies Z \in \mathbb{R}^{B \times K}",
            "description": r"Nhân ma trận tính điểm $Z$, sau đó chuẩn hóa từng hàng bằng hàm Softmax để thu được ma trận xác suất $P$.",
            "takeaway": r"Toàn bộ mini-batch $B$ mẫu được xử lý song song bằng một phép nhân ma trận.",
            "tags": [r"Forward", r"Ma Trận"]
        },
        {
            "id": "sr-loss",
            "title": r"2. Hàm Mất Mát Cross-Entropy Loss",
            "formula": r"\text{Loss} = -\frac{1}{B} \sum_{b=1}^B \ln\left(P_{b, y_b}\right)",
            "shape": r"P \in \mathbb{R}^{B \times K}, \; y \in \{0, \dots, K-1\}^B \implies \text{Loss} \in \mathbb{R}^+",
            "description": r"Đo độ sai lệch: nếu dự đoán tự tin vào nhãn đúng ($P_{y} \to 1 \implies \text{Loss} \to 0$); nếu đoán sai ($P_y \to 0 \implies \text{Loss} \to +\infty$).",
            "takeaway": r"Cực tiểu hóa Cross-Entropy tương đương với cực đại hóa xác suất hợp lý (Maximum Likelihood Estimation).",
            "tags": [r"Loss", r"Xác Suất"]
        },
        {
            "id": "sr-backward",
            "title": r"3. Đạo Hàm Ma Trận Dội Ngược (Backward Pass)",
            "formula": r"G = P - I_y, \qquad \nabla_W = \frac{1}{B} X^T \cdot G",
            "shape": r"G \in \mathbb{R}^{B \times K}, \; X^T \in \mathbb{R}^{n \times B} \implies \nabla_W \in \mathbb{R}^{n \times K}",
            "description": r"$G$ là vector sai số: phần tử nhãn đúng mang dấu âm (đòi tăng điểm), nhãn sai mang dấu dương (đòi giảm điểm). $\nabla_W$ là tích giữa đầu vào và sai số.",
            "takeaway": r"Gradient của mạng nơ-ron được tính bằng tích ma trận chuyển vị $X^T G$, không cần bất kỳ vòng lặp thủ công nào.",
            "tags": [r"Backward", r"Gradient"]
        },
        {
            "id": "sr-sgd",
            "title": r"4. Cập Nhật Trọng Số Stochastic Gradient Descent (SGD)",
            "formula": r"W \leftarrow W - \alpha \cdot \nabla_W",
            "shape": r"\alpha = \text{learning rate (tốc độ học)}",
            "description": r"Dấu trừ giúp ta đi ngược hướng dốc để giảm Loss. Trọng số lớp đúng tự động được tăng, lớp sai tự động bị phạt giảm.",
            "takeaway": r"Gradient descent tự động thưởng điểm cho nơ-ron đoán đúng và trừ điểm nơ-ron đoán sai mà không cần câu lệnh rẽ nhánh if/else.",
            "tags": [r"Tối Ưu", r"SGD"]
        }
    ],

    "cross_entropy_logsumexp": [
        {
            "id": "cel-naive",
            "title": r"1. Hàm Mất Mát Cross-Entropy Lý Thuyết",
            "formula": r"\mathcal{L} = -\sum_{i=1}^K y_i \ln(P_i) = -\ln(P_y)",
            "shape": r"y \in \{0, 1\}^K, \; P \in [0, 1]^K \implies \mathcal{L} \in [0, +\infty)",
            "description": r"Đo lường sự khác biệt giữa nhãn thật one-hot và xác suất dự đoán $P$. Với nhãn đúng $y$, chỉ cần tối đa hóa $P_y$ tương đương cực tiểu hóa $-\ln P_y$.",
            "takeaway": r"Cross-Entropy ép xác suất của nhãn đúng tiệm cận 1.0; nếu $P_y \to 0$ thì Loss tiến tới $+\infty$.",
            "tags": [r"Loss Function", r"Phân Loại"]
        },
        {
            "id": "cel-lse",
            "title": r"2. Phép Biến Đổi Log-Sum-Exp Ổn Định Tuyệt Đối",
            "formula": r"\mathcal{L}_{\text{LSE}} = \ln\left(\sum_{j=1}^K e^{z_j}\right) - z_y = m + \ln\left(\sum_{j=1}^K e^{z_j - m}\right) - z_y",
            "shape": r"z \in \mathbb{R}^K, \; m = \max_j(z_j) \implies \mathcal{L}_{\text{LSE}} \in [0, +\infty)",
            "description": r"Triệt tiêu phép chia phân số trước khi lấy $\ln$. Trừ $m = \max(z)$ đảm bảo số mũ luôn $\le 0$, triệt tiêu hoàn toàn tràn số $e^{z} \to +\infty$.",
            "takeaway": r"Log-Sum-Exp dung hợp Softmax và Cross-Entropy thành một toán tử duy nhất, loại bỏ bước trung gian dễ sập số.",
            "tags": [r"Log-Sum-Exp", r"Ổn Định Số Học"]
        },
        {
            "id": "cel-grad",
            "title": r"3. Gradient Dội Ngược Cực Kỳ Đẹp & An Toàn",
            "formula": r"\frac{\partial \mathcal{L}}{\partial z_i} = P_i - y_i = \begin{cases} P_i - 1 & \text{nếu } i = y \\ P_i & \text{nếu } i \ne y \end{cases}",
            "shape": r"z, P, y \in \mathbb{R}^K \implies \nabla_z \mathcal{L} \in [-1, 1]^K",
            "description": r"Đạo hàm của Log-Sum-Exp theo logit $z_i$ rút gọn thần kỳ thành xác suất dự đoán trừ nhãn thật. Không còn xuất hiện phép chia cho $P_y$ gây lỗi $0 \times \infty = \text{NaN}$.",
            "takeaway": r"Gradient của hàm mất mát phân loại bản chất chính là sai số trực tiếp giữa xác suất dự đoán và nhãn thực tế.",
            "tags": [r"Backprop", r"Gradient"]
        },
        {
            "id": "cel-hardware",
            "title": r"4. Ranh Giới Giới Hạn Phần Cứng FP16 & FP32",
            "formula": r"z_{\max}^{\text{FP16}} \approx 11.089, \quad z_{\max}^{\text{FP32}} \approx 88.7228",
            "shape": r"\text{FP16: } 5 \text{ bits exp (max } 65504\text{)}, \; \text{FP32: } 8 \text{ bits exp (max } 3.4 \times 10^{38}\text{)}",
            "description": r"Chỉ cần logit vượt quá $11.089$ trong FP16 hoặc $88.72$ trong FP32, phép tính $e^z$ ngây thơ sẽ tràn thành $+\infty$ và biến Loss thành NaN.",
            "takeaway": r"Phép trừ max $z - \max(z)$ là bắt buộc trong mọi thư viện Deep Learning (PyTorch torch.nn.CrossEntropyLoss, CUDA kernels).",
            "tags": [r"Systems", r"Hardware FP16/FP32"]
        }
    ],

    "twolayer_relu_backprop": [
        {
            "id": "tl-forward",
            "title": r"1. Lan Truyền Tiến Mạng 2 Tầng (Forward Pass)",
            "formula": r"Z_1 = X W_1, \quad A_1 = \operatorname{ReLU}(Z_1) = \max(0, Z_1), \quad Z_2 = A_1 W_2",
            "shape": r"X \in \mathbb{R}^{B \times n}, \; W_1 \in \mathbb{R}^{n \times d}, \; W_2 \in \mathbb{R}^{d \times K}",
            "description": r"Tầng ẩn chiếu dữ liệu sang không gian $d$ chiều và phi tuyến hóa qua van ReLU. Tầng 2 tạo logits phân loại $K$ lớp.",
            "takeaway": r"Hàm kích hoạt phi tuyến là điều kiện bắt buộc để mạng biểu diễn được các hàm phức tạp (Universal Approximation).",
            "tags": [r"Forward", r"Tầng Ẩn"]
        },
        {
            "id": "tl-grad2",
            "title": r"2. Gradient Tầng Ra (Output Layer Gradient)",
            "formula": r"G_2 = \frac{1}{B}(P - I_y), \qquad \nabla_{W_2} = A_1^T \cdot G_2",
            "shape": r"A_1^T \in \mathbb{R}^{d \times B}, \; G_2 \in \mathbb{R}^{B \times K} \implies \nabla_{W_2} \in \mathbb{R}^{d \times K}",
            "description": r"Đạo hàm theo trọng số tầng 2 là tích giữa đầu vào tầng đó ($A_1$) và sai số đầu ra ($G_2$).",
            "takeaway": r"Công thức giống hệt Softmax Regression, chỉ khác đầu vào là kích hoạt tầng ẩn $A_1$ thay vì dữ liệu thô $X$.",
            "tags": [r"Backward", r"Gradient"]
        },
        {
            "id": "tl-relu-valve",
            "title": r"3. Dội Ngược Qua Van ReLU & Gradient Tầng 1",
            "formula": r"G_1 = (G_2 W_2^T) \odot \mathbb{1}[Z_1 > 0], \qquad \nabla_{W_1} = X^T \cdot G_1",
            "shape": r"\mathbb{1}[Z_1 > 0] = \text{ReLU mask} \in \{0, 1\}^{B \times d}",
            "description": r"Van ReLU hoạt động một chiều: cho gradient đi qua khi $Z_1 > 0$, chặn đứng hoàn toàn gradient ($= 0$) khi $Z_1 \le 0$.",
            "takeaway": r"Khởi tạo trọng số toàn số 0 sẽ làm tê liệt mạng nơ-ron (lời nguyền đối xứng), nơ-ron không bao giờ học được.",
            "tags": [r"Backward", r"ReLU Mask"]
        }
    ],

    "minibatch_assembly": [
        {
            "id": "ma-dims",
            "title": r"1. Cấu Trúc Tensor Batch 4D Chuẩn (BCHW)",
            "formula": r"X \in \mathbb{R}^{B \times C \times H \times W}",
            "shape": r"B = \text{batch}, \; C = \text{channels}, \; H = \text{height}, \; W = \text{width}",
            "description": r"Định dạng sắp xếp tensor trong bộ nhớ: $B$ ảnh, mỗi ảnh có $C$ kênh màu, chiều cao $H$ và chiều rộng $W$.",
            "takeaway": r"Gom batch giúp GPU tận dụng hàng nghìn nhân tính toán song song thay vì nạp từng ảnh đơn lẻ.",
            "tags": [r"Tensor", r"Kích Thước"]
        },
        {
            "id": "ma-strides",
            "title": r"2. Công Thức Bước Nhảy Strides (Row-Major 4D)",
            "formula": r"\text{offset} = b \cdot (C H W) + c \cdot (H W) + h \cdot W + w",
            "shape": r"S_0 = C H W, \; S_1 = H W, \; S_2 = W, \; S_3 = 1",
            "description": r"Tính toán địa chỉ con trỏ tuyến tính 1D từ bộ tọa độ 4D. Mỗi chiều có một bước nhảy (stride) tương ứng.",
            "takeaway": r"Truy cập đúng thứ tự stride-1 giúp bộ đệm CPU/GPU nạp dữ liệu theo khối (cache-friendly).",
            "tags": [r"Systems", r"Strides"]
        },
        {
            "id": "ma-ram",
            "title": r"3. Ước Tính Dung Lượng Bộ Nhớ Batch",
            "formula": r"\text{RAM (Bytes)} = B \times C \times H \times W \times \text{sizeof(dtype)}",
            "shape": r"\text{Float32: 4 bytes}, \quad \text{FP16/BF16: 2 bytes}, \quad \text{INT8: 1 byte}",
            "description": r"Ước lượng kích thước bộ nhớ đệm RAM/VRAM cần cấp phát trước khi nạp batch dữ liệu vào mô hình.",
            "takeaway": r"Cần tính toán dung lượng trước để tránh lỗi tràn bộ nhớ (CUDA Out of Memory - OOM).",
            "tags": [r"Phần Cứng", r"RAM VRAM"]
        }
    ],

    "minibatch_sgd": [
        {
            "id": "msgd-loss",
            "title": r"1. Hàm Mất Mát Trung Bình Mini-Batch",
            "formula": r"\mathcal{L}_{\text{batch}} = \frac{1}{B} \sum_{i=1}^B \mathcal{L}(x_i, y_i)",
            "shape": r"B = \text{kích thước mini-batch}",
            "description": r"Loss của batch là trung bình cộng của từng mẫu. Giúp xấp xỉ gradient toàn thể (Full Batch) với chi phí thấp.",
            "takeaway": r"Mini-batch cân bằng giữa tốc độ tính toán của SGD đơn lẻ và độ ổn định của Full Batch Gradient Descent.",
            "tags": [r"Hàm Mất Mát", r"Batch"]
        },
        {
            "id": "msgd-grad",
            "title": r"2. Gradient Ma Trận Trung Bình",
            "formula": r"\nabla_W = \frac{1}{B} X^T \cdot G, \qquad \operatorname{Var}(\nabla_W) \approx \frac{\sigma^2}{B}",
            "shape": r"X \in \mathbb{R}^{B \times n}, \; G \in \mathbb{R}^{B \times K} \implies \nabla_W \in \mathbb{R}^{n \times K}",
            "description": r"Phương sai của gradient giảm tỉ lệ nghịch với $B$. Tăng kích thước batch giúp hướng gradient mượt và ít rung lắc hơn.",
            "takeaway": r"Quên chia cho $B$ ở bước tính gradient sẽ làm bước học lớn gấp $B$ lần, khiến mô hình phát nổ NaN.",
            "tags": [r"Gradient", r"Phương Sai"]
        },
        {
            "id": "msgd-scale",
            "title": r"3. Quy Tắc Tuyến Tính Tăng Tốc Độ Học (Linear Scaling Rule)",
            "formula": r"\alpha_{\text{new}} = \alpha_{\text{base}} \times \frac{B_{\text{new}}}{B_{\text{base}}}",
            "shape": r"\alpha = \text{learning rate}",
            "description": r"Khi tăng kích thước batch gấp $k$ lần, nên tăng tốc độ học gấp $k$ lần (kết hợp Warmup) để giữ cùng tốc độ tiến bộ.",
            "takeaway": r"Quy tắc kinh điển của Facebook AI Research khi huấn luyện ResNet trên cụm hàng nghìn GPU.",
            "tags": [r"Tối Ưu", r"Scaling"]
        }
    ],

    "activation_valves": [
        {
            "id": "av-relu",
            "title": r"1. Van ReLU & Đạo Hàm",
            "formula": r"f(x) = \max(0, x), \qquad f'(x) = \begin{cases} 1 & \text{nếu } x > 0 \\ 0 & \text{nếu } x \le 0 \end{cases}",
            "shape": r"x \in \mathbb{R} \to f(x) \in [0, +\infty)",
            "description": r"Đơn giản, tính toán siêu nhanh, không bão hòa ở nhánh dương. Bẫy: Dying ReLU (chết nơ-ron nếu rơi vào vùng âm vĩnh viễn).",
            "takeaway": r"Chuẩn mực cơ bản của các mạng thị giác máy tính và tầng nơ-ron truyền thống.",
            "tags": [r"ReLU", r"Phi Tuyến"]
        },
        {
            "id": "av-gelu",
            "title": r"2. Van GELU (Gaussian Error Linear Unit)",
            "formula": r"\operatorname{GELU}(x) = x \Phi(x) \approx 0.5 x \left(1 + \tanh\left(\sqrt{\frac{2}{\pi}} (x + 0.044715 x^3)\right)\right)",
            "shape": r"\Phi(x) = \text{hàm phân phối tích lũy chuẩn } \mathcal{N}(0, 1)",
            "description": r"Van xác suất mịn màng: giá trị âm nhỏ vẫn có gradient nhẹ đi qua, không bị đứt gãy đột ngột như ReLU.",
            "takeaway": r"Chuẩn mực kích hoạt của các mô hình Transformer như BERT, GPT-2, GPT-3.",
            "tags": [r"GELU", r"Transformer"]
        },
        {
            "id": "av-swiglu",
            "title": r"3. Van SiLU (Swish) & Cổng SwiGLU Hiện Đại",
            "formula": r"\operatorname{SiLU}(x) = x \cdot \sigma(x), \qquad \operatorname{SwiGLU}(x) = \operatorname{SiLU}(x W_{\text{gate}}) \odot (x W_{\text{up}})",
            "shape": r"\sigma(x) = \frac{1}{1 + e^{-x}}, \quad \odot = \text{element-wise product}",
            "description": r"Cơ chế phân nhánh cổng (Gated Unit): nhánh gate quyết định bao nhiêu phần trăm thông tin của nhánh up được truyền đi.",
            "takeaway": r"Kiến trúc van MLP chuẩn mực của toàn bộ các LLM hàng đầu hiện nay (LLaMA 2/3, Mistral, Qwen).",
            "tags": [r"SwiGLU", r"LLM"]
        }
    ],

    # --------------------------------------------------------------------------
    # Group 2: C++ & Hardware Systems
    # --------------------------------------------------------------------------
    "cpp_matmul_loops": [
        {
            "id": "cml-gemm",
            "title": r"1. Phép Nhân Ma Trận Cốt Lõi (GEMM)",
            "formula": r"C_{i, j} = \sum_{k=0}^{K-1} A_{i, k} B_{k, j}",
            "shape": r"A \in \mathbb{R}^{M \times K}, \; B \in \mathbb{R}^{K \times N} \implies C \in \mathbb{R}^{M \times N}",
            "description": r"Mỗi phần tử $C_{i, j}$ là tích vô hướng giữa hàng $i$ của $A$ và cột $j$ của $B$.",
            "takeaway": r"Chiếm hơn 90% thời gian tính toán của toàn bộ quá trình huấn luyện và suy luận mạng nơ-ron.",
            "tags": [r"GEMM", r"Toán Học"]
        },
        {
            "id": "cml-flops",
            "title": r"2. Khối Lượng Tính Toán FLOPs",
            "formula": r"\text{FLOPs} = 2 M N K",
            "shape": r"M N K \text{ phép nhân} + M N K \text{ phép cộng}",
            "description": r"Mỗi bước tích vô hướng đòi hỏi 1 phép nhân và 1 phép cộng dồn (Fused Multiply-Add).",
            "takeaway": r"Cơ sở để đo đạc thông lượng phần cứng (TFLOPS) của vi xử lý CPU và GPU.",
            "tags": [r"FLOPs", r"Hiệu Năng"]
        },
        {
            "id": "cml-loops",
            "title": r"3. Thứ Tự Vòng Lặp Tối Ưu Bộ Nhớ Đệm (Cache-Friendly)",
            "formula": r"\text{Tệ: } (i, j, k) \implies \text{Nhảy cột } B_{k, j} \quad \text{vs} \quad \text{Tốt: } (i, k, j) \implies \text{Duyệt liên tục } B_{k, j}, C_{i, j}",
            "shape": r"\text{Stride-1 sequential access in inner loop}",
            "description": r"Hoán đổi vòng $j$ vào trong cùng biến phép tính thành cộng vector liên tục, giảm thiểu cache misses tới 10 lần.",
            "takeaway": r"Thứ tự vòng lặp C++ quyết định tốc độ nhanh gấp 5 - 20 lần dù cùng đúng số phép tính FLOPs.",
            "tags": [r"Systems", r"Cache Locality"]
        }
    ],

    "memory_leak": [
        {
            "id": "ml-accum",
            "title": r"1. Tích Lũy Rò Rỉ Vùng Nhớ RAM Theo Epoch",
            "formula": r"\text{RAM}_{\text{leaked}} = N_{\text{steps}} \times B \times d \times \text{sizeof(float)}",
            "shape": r"N = \text{số bước lặp}, \; B = \text{batch size}",
            "description": r"Quên giải phóng một con trỏ trung gian nhỏ trong vòng lặp huấn luyện sẽ tích lũy tuyến tính theo thời gian.",
            "takeaway": r"Rò rỉ 10MB mỗi batch sẽ làm sập máy chủ sau vài giờ chạy thực tế (OOM Crash).",
            "tags": [r"Systems", r"RAM"]
        },
        {
            "id": "ml-raii",
            "title": r"2. Nguyên Tắc Cân Bằng Cấp Phát & Thu Hồi (RAII)",
            "formula": r"\sum \text{new}[] \equiv \sum \text{delete}[]",
            "shape": r"\text{Constructor cấp phát } \to \text{Destructor thu hồi}",
            "description": r"Mỗi lời gọi cấp phát vùng nhớ động trên Heap (`malloc` hoặc `new[]`) bắt buộc phải có lệnh giải phóng tương ứng.",
            "takeaway": r"Trong C++ hiện đại, luôn ưu tiên sử dụng `std::vector` hoặc `std::unique_ptr` để tự động hóa giải phóng.",
            "tags": [r"C++", r"RAII"]
        }
    ],

    "cache_locality": [
        {
            "id": "cl-line",
            "title": r"1. Dòng Cache (Cache Line) & Tỉ Lệ Nạp",
            "formula": r"\text{Cache Line} = 64 \text{ Bytes} \equiv 16 \text{ số float32}",
            "shape": r"1 \text{ lần đọc nhớ từ RAM mang về 16 floats cạnh nhau}",
            "description": r"Phần cứng không nạp 1 số đơn lẻ mà luôn nạp nguyên 1 khối 64 bytes vào L1/L2 Cache.",
            "takeaway": r"Nếu đọc số thứ 0 rồi đọc tiếp số 1..15, ta hưởng lợi 15 lần Cache Hit miễn phí.",
            "tags": [r"Hardware", r"CPU Cache"]
        },
        {
            "id": "cl-miss",
            "title": r"2. So Sánh Tỉ Lệ Cache Miss: Hàng vs Cột",
            "formula": r"\text{Row-major (Hàng): } \text{Miss Rate} \approx \frac{1}{16} = 6.25\%, \qquad \text{Col-major (Cột): } \text{Miss Rate} \approx 100\%",
            "shape": r"\text{Khi kích thước ma trận } N > \text{L1 Cache}",
            "description": r"Duyệt dọc theo cột khiến mỗi lần đọc đều nhảy xa một bước $N \times 4$ bytes, vứt bỏ toàn bộ phần còn lại của cache line.",
            "takeaway": r"Duyệt theo hàng nhanh hơn duyệt theo cột tới hàng chục lần vì tận dụng trọn vẹn Spatial Locality.",
            "tags": [r"Tối Ưu", r"Locality"]
        }
    ],

    "strides_views": [
        {
            "id": "sv-offset",
            "title": r"1. Ánh Xạ Chỉ Số Đa Chiều Sang Địa Chỉ 1D (Strides)",
            "formula": r"\text{offset}(i_0, i_1, \dots, i_{D-1}) = \sum_{k=0}^{D-1} i_k \times \text{stride}_k",
            "shape": r"\text{stride}_k = \text{số phần tử cần nhảy trong mảng 1D khi chỉ số } i_k \text{ tăng 1}",
            "description": r"Cách mà mọi thư viện Tensor (PyTorch, NumPy, Candle) biểu diễn các chiều không gian trừu tượng trên mảng 1D.",
            "takeaway": r"Nắm vững strides giúp bạn hiểu cơ chế hoạt động ngầm của mọi thao tác tensor.",
            "tags": [r"Tensor", r"Strides"]
        },
        {
            "id": "sv-contig",
            "title": r"2. Điều Kiện Bộ Nhớ Liên Tục (Contiguous Condition)",
            "formula": r"\text{stride}_k = \text{stride}_{k+1} \times \text{shape}_{k+1}, \qquad \text{với } \text{stride}_{D-1} = 1",
            "shape": r"\text{Dữ liệu xếp liền sát nhau trong RAM}",
            "description": r"Khi tensor bị cắt lát (slice) hoặc chuyển vị (transpose), strides bị thay đổi và tensor trở thành non-contiguous.",
            "takeaway": r"Hàm `.contiguous()` sẽ sao chép và sắp xếp lại dữ liệu về mảng tuần tự liên tục.",
            "tags": [r"Systems", r"Contiguous"]
        },
        {
            "id": "sv-view",
            "title": r"3. Phép Biến Đổi View Không Tốn Chi Phí (Zero-Copy View)",
            "formula": r"\text{Transpose: } \operatorname{stride}_{\text{new}} = \operatorname{permute}(\operatorname{stride}_{\text{old}}), \quad \text{Time: } O(1), \; \text{RAM: } 0 \text{ byte}",
            "shape": r"\text{Chỉ thay đổi metadata, không di chuyển dữ liệu}",
            "description": r"Chuyển vị một tensor bản chất chỉ là hoán đổi 2 số trong tuple strides, không cần chạy vòng lặp sao chép mảng.",
            "takeaway": r"Sức mạnh cốt lõi của Tensor Views: tái định hình tức thì mà không tiêu tốn thêm một byte RAM nào.",
            "tags": [r"Zero-Copy", r"View"]
        }
    ],

    "cuda_threads": [
        {
            "id": "ct-idx1d",
            "title": r"1. Chỉ Số Luồng Toàn Cục 1D (Global Thread ID)",
            "formula": r"\text{gid} = \text{blockIdx.x} \times \text{blockDim.x} + \text{threadIdx.x}",
            "shape": r"\text{blockIdx: chỉ số block}, \; \text{blockDim: số luồng/block}, \; \text{threadIdx: luồng nội bộ}",
            "description": r"Mỗi GPU thread tính toán chỉ số độc nhất của mình để biết cần xử lý phần tử nào trong mảng lớn.",
            "takeaway": r"Công thức vỡ lòng của mọi lập trình viên khi viết CUDA kernel đầu tiên.",
            "tags": [r"CUDA", r"Indexing"]
        },
        {
            "id": "ct-idx2d",
            "title": r"2. Tọa Độ Ma Trận 2D Trên Lưới Luồng",
            "formula": r"\text{col} = \text{blockIdx.x} \times \text{blockDim.x} + \text{threadIdx.x}, \quad \text{row} = \text{blockIdx.y} \times \text{blockDim.y} + \text{threadIdx.y}",
            "shape": r"\text{offset} = \text{row} \times \text{Width} + \text{col}",
            "description": r"Ánh xạ lưới khối 2D trực tiếp vào tọa độ hàng và cột của ma trận ảnh hoặc tensor.",
            "takeaway": r"Luôn kiểm tra biên: `if (row < H && col < W)` để tránh lỗi đọc tràn bộ nhớ GPU.",
            "tags": [r"CUDA", r"2D Grid"]
        },
        {
            "id": "ct-warp",
            "title": r"3. Đơn Vị Thực Thi Warp & SIMT",
            "formula": r"1 \text{ Warp} = 32 \text{ Threads}",
            "shape": r"\text{Thực thi đồng bộ cùng 1 lệnh máy (Lockstep)}",
            "description": r"GPU không điều phối từng thread riêng rẽ mà gom 32 threads thành 1 warp cùng thực thi chung một câu lệnh.",
            "takeaway": r"Rẽ nhánh `if/else` khác nhau giữa các thread trong cùng warp sẽ gây hiện tượng Warp Divergence (giảm tốc độ).",
            "tags": [r"Hardware", r"Warp"]
        }
    ],

    "coalescing_and_banks": [
        {
            "id": "cb-coalesce",
            "title": r"1. Truy Cập Hợp Nhất Bộ Nhớ Toàn Cục (Coalesced Access)",
            "formula": r"\text{Warp Access: } \text{Thread } k \text{ đọc } \text{Base} + k \implies 1 \text{ Transaction } 128 \text{ Bytes}",
            "shape": r"32 \text{ luồng đọc 32 số floats liên tục = 1 giao dịch bộ nhớ}",
            "description": r"Khi các luồng trong warp đọc ô nhớ liền kề nhau, phần cứng gộp thành đúng 1 giao dịch nạp duy nhất.",
            "takeaway": r"Nếu đọc nhảy bước (stride > 1), GPU phải phát tới 32 giao dịch riêng lẻ, làm nghẽn băng thông.",
            "tags": [r"GPU", r"Coalescing"]
        },
        {
            "id": "cb-bank",
            "title": r"2. Địa Chỉ Shared Memory Bank",
            "formula": r"\text{Bank ID} = \left(\frac{\text{Address (Bytes)}}{4}\right) \pmod{32}",
            "shape": r"32 \text{ Banks độc lập, mỗi bank rộng 4 bytes (1 float32)}",
            "description": r"Shared Memory trên chip được chia thành 32 dải ngân hàng nhớ độc lập hoạt động song song.",
            "takeaway": r"Nếu 32 luồng đọc 32 bank khác nhau: tốc độ đạt cực đại trong đúng 1 chu kỳ xung nhịp.",
            "tags": [r"Shared Memory", r"Banks"]
        },
        {
            "id": "cb-conflict",
            "title": r"3. Xung Đột Ngân Hàng Nhớ (Bank Conflict)",
            "formula": r"\text{Latency} = k \times \text{Cycle} \quad \text{khi có } k \text{ luồng cùng tranh chấp 1 Bank ID}",
            "shape": r"\text{Bị tuần tự hóa (Serialized) } k \text{ lần}",
            "description": r"Mẹo kinh điển: Thêm khoảng đệm padding (ví dụ mảng `float tile[32][33]`) để làm lệch chỉ số bank, triệt tiêu xung đột.",
            "takeaway": r"Kỹ thuật đệm padding 1 cột là bí quyết tối ưu kernel ma trận hiệu năng cao.",
            "tags": [r"Tối Ưu", r"Bank Conflict"]
        }
    ],

    "shared_memory_tiling": [
        {
            "id": "smt-tile",
            "title": r"1. Phân Khối Tile & Tái Sử Dụng Dữ Liệu",
            "formula": r"\text{Tile Size} = T \times T \implies \text{Giảm số lần nạp từ VRAM (HBM) đi } T \text{ lần}",
            "shape": r"T = 16 \text{ hoặc } 32 \text{ (vừa vặn dung lượng Shared Memory)}",
            "description": r"Mỗi khối nạp một mẩu ma trận vào SRAM cực nhanh trên chip, các luồng dùng chung nhau mẩu đó nhiều lần.",
            "takeaway": r"Biến bài toán bị nghẽn băng thông nhớ (Memory-bound) thành tận dụng tối đa năng lực tính toán (Compute-bound).",
            "tags": [r"Tiling", r"SRAM"]
        },
        {
            "id": "smt-sync",
            "title": r"2. Rào Chắn Đồng Bộ Hóa Luồng (__syncthreads)",
            "formula": r"\text{Load to SRAM} \to \text{\_\_syncthreads()} \to \text{Compute GEMM} \to \text{\_\_syncthreads()}",
            "shape": r"\text{Bắt buộc 2 rào cản đồng bộ trong mỗi vòng lặp}",
            "description": r"Rào 1 đảm bảo mọi luồng đã nạp xong tile vào SRAM mới bắt đầu tính. Rào 2 đảm bảo mọi luồng tính xong mới nạp tile kế tiếp.",
            "takeaway": r"Thiếu `__syncthreads()` sẽ gây lỗi Race Condition (đọc phải dữ liệu cũ hoặc dữ liệu rác).",
            "tags": [r"CUDA", r"Đồng Bộ"]
        }
    ],

    # --------------------------------------------------------------------------
    # Group 3: Autodiff, Backprop & Optimization
    # --------------------------------------------------------------------------
    "autograd_graph": [
        {
            "id": "ag-chain",
            "title": r"1. Quy Tắc Dây Chuyền Đa Nhánh (Multivariate Chain Rule)",
            "formula": r"\frac{\partial L}{\partial x} = \sum_{c \in \operatorname{Children}(x)} \frac{\partial L}{\partial c} \cdot \frac{\partial c}{\partial x}",
            "shape": r"\text{Cộng dồn đạo hàm từ tất cả các nhánh con phân nhánh từ } x",
            "description": r"Khi một biến $x$ được sử dụng ở nhiều phép tính khác nhau, đạo hàm tổng thể dội về $x$ là tổng các nhánh đạo hàm con.",
            "takeaway": r"Lý do vì sao trong PyTorch ta thấy `grad` được cộng dồn (`+=`) và phải gọi `optimizer.zero_grad()` mỗi bước.",
            "tags": [r"Autograd", r"Chain Rule"]
        },
        {
            "id": "ag-topo",
            "title": r"2. Thứ Tự Tô-pô Đảo Ngược (Reverse Topological Sort)",
            "formula": r"\text{Loss} \xrightarrow{\text{duyệt ngược đồ thị}} \text{Tầng ẩn} \xrightarrow{} \text{Trọng số (Leaf Nodes)}",
            "shape": r"\text{Đảm bảo nút con tính xong trước nút cha}",
            "description": r"Hệ thống sắp xếp đồ thị tính toán theo thứ tự phụ thuộc, dội ngược từ đầu ra về các nút lá tham số.",
            "takeaway": r"Nền tảng kiến trúc của autograd engine trong Torch, Candle và Jax.",
            "tags": [r"Đồ Thị", r"Tô-pô"]
        }
    ],

    "reverse_vs_forward_ad": [
        {
            "id": "rvf-cost",
            "title": r"1. So Sánh Chi Phí Tính Toán Ma Trận Jacobian",
            "formula": r"\text{Forward-Mode: } O(n_{\text{in}}) \text{ lượt} \quad \text{vs} \quad \text{Reverse-Mode: } O(n_{\text{out}}) \text{ lượt}",
            "shape": r"J \in \mathbb{R}^{m \times n} \text{ với } n = n_{\text{in}} \text{ đầu vào, } m = n_{\text{out}} \text{ đầu ra}",
            "description": r"Forward-mode tính đạo hàm theo từng biến đầu vào. Reverse-mode tính đạo hàm theo từng biến đầu ra.",
            "takeaway": r"Mạng Deep Learning có hàng tỷ tham số ($n = 10^9$) nhưng chỉ có 1 giá trị Loss vô hướng ($m = 1$) $\implies$ Reverse-Mode nhanh gấp hàng tỷ lần!",
            "tags": [r"Độ Phức Tạp", r"Autodiff"]
        },
        {
            "id": "rvf-dual",
            "title": r"2. Số Phức Kép (Dual Numbers) Trong Forward AD",
            "formula": r"x = a + b\epsilon, \quad \text{với } \epsilon^2 = 0 \implies f(a + b\epsilon) = f(a) + b f'(a)\epsilon",
            "shape": r"\epsilon = \text{đơn vị vi phân vô cùng bé}",
            "description": r"Forward-mode lan truyền đồng thời giá trị thực và đạo hàm trong cùng một lượt tính xuôi.",
            "takeaway": r"Tuyệt vời cho các bài toán đồ họa và robot học ít tham số nhưng nhiều đầu ra.",
            "tags": [r"Toán Học", r"Số Kép"]
        }
    ],

    "broadcast_grad": [
        {
            "id": "bg-sum",
            "title": r"1. Đạo Hàm Của Phép Mở Rộng Kích Thước (Broadcast)",
            "formula": r"\text{Forward: } C = A_{(1 \times D)} + B_{(B \times D)} \implies \text{Backward: } \nabla_A = \sum_{b=1}^B \nabla_{C_{b, :}}",
            "shape": r"\nabla_A \in \mathbb{R}^{1 \times D} \text{ (giữ nguyên kích thước ban đầu)}",
            "description": r"Phép toán nào được sao chép/mở rộng ở chiều xuôi thì ở chiều dội ngược bắt buộc phải **cộng dồn (reduce sum)** trên đúng chiều đó.",
            "takeaway": r"Nguyên lý bất biến: kích thước của tensor gradient luôn bằng đúng kích thước của tensor tham số gốc.",
            "tags": [r"Backward", r"Broadcast"]
        },
        {
            "id": "bg-code",
            "title": r"2. Cú Pháp Rút Gọn Trong NumPy / PyTorch",
            "formula": r"\texttt{grad\_A = grad\_C.sum(axis=0, keepdims=True)}",
            "shape": r"\text{keepdims=True giữ đúng số chiều } 2D",
            "description": r"Khi dội ngược qua phép cộng bias hoặc vector hàng, luôn cần cộng dồn trên trục batch với `keepdims=True`.",
            "takeaway": r"Quên thu gọn chiều broadcast là một trong những bug hình học (shape bug) kinh điển nhất.",
            "tags": [r"Code", r"NumPy"]
        }
    ],

    "gradient_check": [
        {
            "id": "gc-central",
            "title": r"1. Sai Phân Trung Tâm 2 Phía (Central Difference)",
            "formula": r"g_{\text{num}} = \frac{f(\theta + \epsilon) - f(\theta - \epsilon)}{2\epsilon} + O(\epsilon^2)",
            "shape": r"\epsilon \approx 10^{-5} \text{ (vừa đủ nhỏ để tránh sai số làm tròn)}",
            "description": r"Sai phân trung tâm có độ chính xác bậc 2 $O(\epsilon^2)$, chính xác hơn rất nhiều so with sai phân một phía $O(\epsilon)$.",
            "takeaway": r"Phương pháp vạn năng để kiểm chứng đạo hàm giải tích viết tay trước khi đưa vào sản xuất.",
            "tags": [r"GradCheck", r"Sai Phân"]
        },
        {
            "id": "gc-relerr",
            "title": r"2. Sai Số Tương Đối (Relative Error)",
            "formula": r"\text{RelErr} = \frac{\|g_{\text{ana}} - g_{\text{num}}\|_2}{\max(\|g_{\text{ana}}\|_2 + \|g_{\text{num}}\|_2, 10^{-8})}",
            "shape": r"\text{Đạt chuẩn: } \text{RelErr} < 10^{-5} \quad (\text{Nghi ngờ lỗi nếu } > 10^{-4})",
            "description": r"So sánh khoảng cách giữa đạo hàm giải tích và đạo hàm số học chuẩn hóa theo độ lớn của gradient.",
            "takeaway": r"Không bao giờ dùng sai số tuyệt đối $|a - b|$ vì khi gradient quá lớn hoặc quá nhỏ sẽ dẫn tới đánh giá sai lệch.",
            "tags": [r"Kiểm Thử", r"Sai Số"]
        }
    ],

    "optimizers": [
        {
            "id": "opt-mom",
            "title": r"1. SGD Kèm Quán Tính (Momentum)",
            "formula": r"v_t = \beta v_{t-1} + g_t, \qquad \theta_t = \theta_{t-1} - \alpha v_t",
            "shape": r"\beta \approx 0.9 \implies \text{tích lũy trung bình } \frac{1}{1-\beta} = 10 \text{ bước trước}",
            "description": r"Tích lũy vận tốc như quả bóng lăn xuống dốc, giúp vượt qua các vùng lòng chảo phẳng và giảm dao động răng cưa.",
            "takeaway": r"Momentum giúp nén dao động ở chiều dốc đứng và tăng tốc ở chiều dốc thoai thoải.",
            "tags": [r"Tối Ưu", r"Momentum"]
        },
        {
            "id": "opt-rmsprop",
            "title": r"2. Thuật Toán RMSprop (Tốc Độ Học Thích Nghi)",
            "formula": r"s_t = \beta s_{t-1} + (1-\beta) g_t^2, \qquad \theta_t = \theta_{t-1} - \frac{\alpha}{\sqrt{s_t} + \epsilon} g_t",
            "shape": r"s_t = \text{ước lượng bình phương độ lớn gradient}",
            "description": r"Chia cho căn bậc 2 của bình phương gradient: tọa độ nào dốc mạnh sẽ bị hãm bước, tọa độ nào dốc thoai thoải sẽ được tăng bước.",
            "takeaway": r"Tạo ra bước đi thích nghi riêng biệt cho từng tham số trong mô hình.",
            "tags": [r"RMSprop", r"Adaptive"]
        },
        {
            "id": "opt-adam",
            "title": r"3. Thuật Toán Adam (Kết Hợp Momentum & RMSprop)",
            "formula": r"\theta_t = \theta_{t-1} - \frac{\alpha}{\sqrt{\hat{v}_t} + \epsilon} \hat{m}_t",
            "shape": r"\hat{m}_t = \text{hướng đi (Momentum)}, \; \hat{v}_t = \text{độ lớn bước đi (RMSprop)}",
            "description": r"Kết hợp cả 2 ưu điểm tốt nhất: đi đúng hướng nhờ momentum và điều chỉnh bước học tự động cho từng tham số.",
            "takeaway": r"Bộ tối ưu mặc định phổ biến nhất trong toàn bộ giới trí tuệ nhân tạo hiện đại.",
            "tags": [r"Adam", r"Chuẩn Mực"]
        }
    ],

    "adamw_weight_decay": [
        {
            "id": "aw-l2",
            "title": r"1. Lỗi Của L2 Regularization Trong Adam Gốc",
            "formula": r"g_t^{\text{L2}} = g_t + \lambda \theta_{t-1} \implies \Delta \theta \propto \frac{g_t + \lambda \theta_{t-1}}{\sqrt{v_t} + \epsilon}",
            "shape": r"\text{Tham số có gradient lớn bị phạt ít, gradient nhỏ bị phạt nhiều}",
            "description": r"Trong Adam nguyên bản, L2 regularization bị trộn lẫn vào $v_t$ khiến các trọng số không được suy hao đồng đều.",
            "takeaway": r"Lý do khiến Adam từng bị chê là kém tổng quát hóa hơn SGD trên tập ImageNet.",
            "tags": [r"Bẫy Kỹ Thuật", r"L2 Loss"]
        },
        {
            "id": "aw-decoupled",
            "title": r"2. Cơ Chế Phân Tách Trọng Số Trong AdamW (Decoupled)",
            "formula": r"\theta_t = \theta_{t-1} - \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} - \eta \lambda \theta_{t-1}",
            "shape": r"\lambda = \text{hệ số suy hao (Weight Decay)}, \; \eta = \text{tốc độ học}",
            "description": r"Trừ trực tiếp lượng $\eta \lambda \theta_{t-1}$ vào trọng số độc lập hoàn toàn với việc chia ma trận phương sai $\sqrt{\hat{v}_t}$.",
            "takeaway": r"Sửa lỗi triệt để cho Adam, trở thành chuẩn mực bắt buộc cho việc huấn luyện mọi mô hình Transformer & LLM.",
            "tags": [r"AdamW", r"Chuẩn Mực"]
        }
    ],

    "gradient_accumulation_clipping": [
        {
            "id": "gac-accum",
            "title": r"1. Tích Lũy Gradient (Gradient Accumulation)",
            "formula": r"g_{\text{accum}} = \frac{1}{N_{\text{steps}}} \sum_{s=1}^{N_{\text{steps}}} \nabla \mathcal{L}_s, \qquad B_{\text{eff}} = B_{\text{micro}} \times N_{\text{steps}}",
            "shape": r"\text{Chỉ gọi } \texttt{optimizer.step()} \text{ sau mỗi } N_{\text{steps}} \text{ micro-batches}",
            "description": r"Cộng dồn đạo hàm qua nhiều bước nhỏ mà không cập nhật trọng số ngay, giúp giả lập batch size lớn trên GPU ít VRAM.",
            "takeaway": r"Giải pháp kinh điển để huấn luyện LLM lớn trên phần cứng tiêu dùng khi không đủ VRAM cho batch lớn.",
            "tags": [r"VRAM", r"Accumulation"]
        },
        {
            "id": "gac-clip",
            "title": r"2. Cắt Ngưỡng Gradient (Gradient Norm Clipping)",
            "formula": r"\|g\|_2 = \sqrt{\sum_i g_i^2}, \qquad g \leftarrow g \times \min\left(1.0, \frac{\text{max\_norm}}{\|g\|_2 + 10^{-6}}\right)",
            "shape": r"\text{max\_norm} \approx 1.0 \text{ (hoặc 0.5)}",
            "description": r"Nếu vector gradient tổng thể có độ dài vượt quá `max_norm`, co ngắn vector lại nhưng giữ nguyên góc định hướng.",
            "takeaway": r"Chiếc phanh cứu sinh ngăn chặn hiện tượng bùng nổ gradient (Exploding Gradients) gây sập mô hình.",
            "tags": [r"Ổn Định", r"Clipping"]
        }
    ],

    "lr_schedule_warmup": [
        {
            "id": "lrw-warmup",
            "title": r"1. Giai Đoạn Khởi Động Tuyến Tính (Linear Warmup)",
            "formula": r"\eta_t = \eta_{\max} \times \frac{t}{T_{\text{warmup}}}, \quad \text{với } t \le T_{\text{warmup}}",
            "shape": r"t = 1 \dots T_{\text{warmup}} \text{ (thường chiếm 1% - 5% tổng số steps)}",
            "description": r"Tăng tốc độ học từ 0 lên cực đại trong những bước đầu, giúp các bộ đệm thống kê Adam ($m_t, v_t$) ổn định trước.",
            "takeaway": r"Không dùng warmup sẽ khiến mô hình nhận những bước nhảy bạo lực ngay từ đầu, dễ kẹt ở nghiệm xấu.",
            "tags": [r"Warmup", r"Lịch Trình"]
        },
        {
            "id": "lrw-cosine",
            "title": r"2. Suy Giảm Cosine (Cosine Annealing Decay)",
            "formula": r"\eta_t = \eta_{\min} + \frac{1}{2}(\eta_{\max} - \eta_{\min}) \left(1 + \cos\left(\pi \frac{t - T_{\text{warmup}}}{T_{\text{total}} - T_{\text{warmup}}}\right)\right)",
            "shape": r"\eta_t \text{ giảm mượt mà về } \eta_{\min} \approx 0.1 \eta_{\max} \text{ (hoặc 0)}",
            "description": r"Đường cong cosine giảm nhẹ lúc đầu, giảm nhanh ở giữa và hạ cánh êm dịu ở cuối, giúp trọng số lắng đọng vào cực tiểu phẳng.",
            "takeaway": r"Lịch trình tốc độ học chuẩn mực cho mọi bài toán huấn luyện LLM quy mô lớn.",
            "tags": [r"Cosine Decay", r"Tối Ưu"]
        }
    ],

    "kaiming_init": [
        {
            "id": "ki-var",
            "title": r"1. Nguyên Lý Bảo Toàn Phương Sai Tín Hiệu",
            "formula": r"\operatorname{Var}(y) = \text{fan\_in} \times \operatorname{Var}(w) \times \operatorname{Var}(x) \overset{!}{=} \operatorname{Var}(x)",
            "shape": r"y = W x \implies \text{Mục tiêu: phương sai không đổi qua hàng trăm tầng mạng}",
            "description": r"Nếu $\operatorname{Var}(w)$ quá lớn, tín hiệu bùng nổ cấp số nhân. Nếu quá nhỏ, tín hiệu tắt lịm về 0 sau vài tầng.",
            "takeaway": r"Bí quyết giúp huấn luyện thành công các mạng nơ-ron sâu hàng trăm tầng mà không bị tiêu tán tín hiệu.",
            "tags": [r"Khởi Tạo", r"Phương Sai"]
        },
        {
            "id": "ki-kaiming",
            "title": r"2. Khởi Tạo Kaiming (He) Cho Mạng Dùng ReLU",
            "formula": r"W \sim \mathcal{N}\left(0, \sigma^2\right), \quad \sigma = \sqrt{\frac{2}{\text{fan\_in}}}",
            "shape": r"\text{Số 2 bù đắp chính xác 50% nơ-ron bị van ReLU chặn âm}",
            "description": r"Vì ReLU triệt tiêu một nửa phương sai của dữ liệu, Kaiming nhân đôi phương sai khởi tạo của trọng số để bù lại.",
            "takeaway": r"Bước đột phá lịch sử giúp Kaiming He huấn luyện thành công mạng ResNet đoạt giải ImageNet.",
            "tags": [r"Kaiming He", r"ReLU"]
        },
        {
            "id": "ki-xavier",
            "title": r"3. Khởi Tạo Xavier (Glorot) Cho Tanh / Tuyến Tính",
            "formula": r"\sigma = \sqrt{\frac{2}{\text{fan\_in} + \text{fan\_out}}}",
            "shape": r"\text{Cân bằng phương sai ở cả chiều Forward lẫn Backward}",
            "description": r"Phù hợp cho các hàm kích hoạt đối xứng quanh 0 như Tanh, Sigmoid hoặc các tầng chiếu tuyến tính.",
            "takeaway": r"Khởi tạo mặc định của các tầng chiếu trong mô hình Transformer.",
            "tags": [r"Xavier", r"Glorot"]
        }
    ],

    # --------------------------------------------------------------------------
    # Group 4: Deep Learning Modules & Training Dynamics
    # --------------------------------------------------------------------------
    "batch_norm_dynamics": [
        {
            "id": "bn-stats",
            "title": r"1. Chuẩn Hóa Theo Chiều Batch (Training Mode)",
            "formula": r"\mu_B = \frac{1}{B} \sum_{i=1}^B x_i, \quad \sigma_B^2 = \frac{1}{B} \sum_{i=1}^B (x_i - \mu_B)^2, \quad \hat{x}_i = \frac{x_i - \mu_B}{\sqrt{\sigma_B^2 + \epsilon}}",
            "shape": r"\text{Tính trung bình và phương sai trên trục } B \text{ (Batch)}",
            "description": r"Ép phân phối đầu ra của mỗi nơ-ron về dạng chuẩn tắc $\mathcal{N}(0, 1)$ trong từng mẻ huấn luyện.",
            "takeaway": r"Giảm hiện tượng biến đổi hiệp biến nội bộ (Internal Covariate Shift), cho phép dùng learning rate lớn hơn.",
            "tags": [r"BatchNorm", r"Forward"]
        },
        {
            "id": "bn-affine",
            "title": r"2. Biến Đổi Affine Có Khả Năng Học (Learnable Parameters)",
            "formula": r"y_i = \gamma \hat{x}_i + \beta",
            "shape": r"\gamma = \text{scale (độ co dãn)}, \; \beta = \text{shift (độ dịch chuyển)}",
            "description": r"Cho phép mạng khôi phục lại phân phối gốc nếu việc chuẩn hóa thuần túy làm mất đi tính biểu diễn của dữ liệu.",
            "takeaway": r"Hai tham số $\gamma, \beta$ được cập nhật bằng Gradient Descent cùng với trọng số mô hình.",
            "tags": [r"Tham Số", r"Affine"]
        },
        {
            "id": "bn-infer",
            "title": r"3. Chế Độ Suy Luận & Thống Kê Tích Lũy (Running Stats)",
            "formula": r"\mu_{\text{run}} = (1 - m) \mu_{\text{run}} + m \mu_B, \qquad \sigma_{\text{run}}^2 = (1 - m) \sigma_{\text{run}}^2 + m \sigma_B^2",
            "shape": r"m = \text{momentum} \approx 0.1 \implies \text{Dùng cố định lúc } \texttt{model.eval()}",
            "description": r"Khi chạy thực tế chỉ có 1 ảnh ($B=1$), BatchNorm không thể tính phương sai batch mà dùng thống kê tích lũy trong quá trình train.",
            "takeaway": r"Quên chuyển `model.eval()` khi inference sẽ khiến kết quả dự đoán bị sai lệch hoàn toàn.",
            "tags": [r"Inference", r"Running Stats"]
        }
    ],

    "layernorm_residual": [
        {
            "id": "ln-formula",
            "title": r"1. Chuẩn Hóa Theo Chiều Ẩn (Layer Normalization)",
            "formula": r"\mu = \frac{1}{d} \sum_{i=1}^d x_i, \quad \sigma^2 = \frac{1}{d} \sum_{i=1}^d (x_i - \mu)^2, \quad y = \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} \odot \gamma + \beta",
            "shape": r"\text{Tính độc lập cho từng token trên chiều ẩn } d \text{ (không phụ thuộc } B \text{)}",
            "description": r"Khác với BatchNorm, LayerNorm tính trung bình và phương sai trên các đặc trưng của chính token đó, hoàn toàn độc lập giữa các mẫu.",
            "takeaway": r"Hoạt động hoàn hảo cho chuỗi có độ dài thay đổi (NLP) và không bị ảnh hưởng bởi kích thước batch.",
            "tags": [r"LayerNorm", r"Chuẩn Hóa"]
        },
        {
            "id": "ln-residual",
            "title": r"2. Cơ Chế Kết Nối Tắt Pre-LN (Residual Stream)",
            "formula": r"x_{l+1} = x_l + F(\operatorname{LN}(x_l)) \implies \frac{\partial x_{l+1}}{\partial x_l} = I + \frac{\partial F}{\partial x_l}",
            "shape": r"I = \text{ma trận đơn vị (đường cao tốc truyền gradient)}",
            "description": r"Gradient dội ngược có thể chạy thẳng tuột qua ma trận đơn vị $I$ mà không bị suy hao qua các hàm phi tuyến.",
            "takeaway": r"Pre-LN giải quyết triệt để lỗi mất mát gradient, là kiến trúc nền tảng của mọi khối Transformer hiện đại.",
            "tags": [r"Pre-LN", r"Residual"]
        }
    ],

    "dropout": [
        {
            "id": "do-inverted",
            "title": r"1. Kỹ Thuật Inverted Dropout (Huấn Luyện)",
            "formula": r"m_i \sim \operatorname{Bernoulli}(1 - p), \qquad y_i = \frac{x_i \cdot m_i}{1 - p}",
            "shape": r"p = \text{xác suất rơi rụng (dropout rate)}, \quad m_i \in \{0, 1\}",
            "description": r"Ngẫu nhiên tắt các nơ-ron với xác suất $p$. Việc chia cho $(1-p)$ ngay lúc train đảm bảo kỳ vọng toán học $\mathbb{E}[y] = x$.",
            "takeaway": r"Nhờ chia $(1-p)$ lúc train, lúc inference ta không cần phải làm gì cả ($y = x$), tiết kiệm chi phí runtime.",
            "tags": [r"Dropout", r"Regularization"]
        },
        {
            "id": "do-ensemble",
            "title": r"2. Trực Giác Học Tập: Tổ Hợp Mô Hình Ẩn (Ensemble)",
            "formula": r"\text{Mỗi bước lặp huấn luyện } 1 \text{ mô hình mạng con trong tổng số } 2^N \text{ cấu trúc khả dĩ}",
            "shape": r"N = \text{số lượng nơ-ron}",
            "description": r"Ngăn chặn các nơ-ron phụ thuộc lẫn nhau (co-adaptation), ép mỗi nơ-ron phải học những đặc trưng độc lập hữu ích.",
            "takeaway": r"Kỹ thuật chống quá khớp (Overfitting) mạnh mẽ và trực quan bậc nhất trong học sâu.",
            "tags": [r"Trực Giác", r"Ensemble"]
        }
    ],

    "conv2d_im2col": [
        {
            "id": "c2d-dims",
            "title": r"1. Kích Thước Bản Đồ Đặc Trưng Đầu Ra (Output Shape)",
            "formula": r"H_{\text{out}} = \left\lfloor \frac{H + 2P - K_h}{S} \right\rfloor + 1, \qquad W_{\text{out}} = \left\lfloor \frac{W + 2P - K_w}{S} \right\rfloor + 1",
            "shape": r"P = \text{padding}, \; S = \text{stride}, \; K = \text{kích thước kernel}",
            "description": r"Công thức cơ bản xác định độ phân giải không gian của ảnh sau khi trượt bộ lọc tích chập qua.",
            "takeaway": r"Cần tính toán chuẩn xác để đảm bảo các phép cộng kết nối tắt (Residual) khớp kích thước không gian.",
            "tags": [r"Conv2D", r"Kích Thước"]
        },
        {
            "id": "c2d-im2col",
            "title": r"2. Phép Biến Đổi im2col Thành Nhân Ma Trận (GEMM)",
            "formula": r"Y = W_{\text{flat}} \cdot X_{\text{col}}",
            "shape": r"W_{\text{flat}} \in \mathbb{R}^{C_{\text{out}} \times (C_{\text{in}} K_h K_w)}, \quad X_{\text{col}} \in \mathbb{R}^{(C_{\text{in}} K_h K_w) \times (H_{\text{out}} W_{\text{out}})}",
            "description": r"Trải các vùng cửa sổ trượt thành các cột dữ liệu. Biến toàn bộ phép trượt tích chập phức tạp thành 1 phép nhân ma trận GEMM tối ưu.",
            "takeaway": r"Bí quyết giúp các thư viện cuDNN và OpenBLAS chạy mạng CNN với tốc độ khủng khiếp.",
            "tags": [r"im2col", r"GEMM"]
        }
    ],

    "rnn_bptt": [
        {
            "id": "rnn-forward",
            "title": r"1. Lan Truyền Tiến Tế Bào RNN (Forward Cell)",
            "formula": r"h_t = \tanh(W_{hh} h_{t-1} + W_{xh} x_t + b)",
            "shape": r"h_t \in \mathbb{R}^d = \text{trạng thái ẩn tại bước thời gian } t",
            "description": r"Cập nhật bộ nhớ nội bộ dựa trên thông tin vừa nhận $x_t$ và ký ức từ bước trước $h_{t-1}$.",
            "takeaway": r"Mạng hồi quy dùng chung một bộ trọng số $W_{hh}, W_{xh}$ xuyên suốt toàn bộ chiều dài thời gian.",
            "tags": [r"RNN", r"Forward"]
        },
        {
            "id": "rnn-bptt",
            "title": r"2. Chuỗi Tích Đạo Hàm Dội Ngược Xuyên Thời Gian (BPTT)",
            "formula": r"\frac{\partial L}{\partial h_1} = \frac{\partial L}{\partial h_T} \prod_{t=2}^T \frac{\partial h_t}{\partial h_{t-1}} = \frac{\partial L}{\partial h_T} \prod_{t=2}^T \operatorname{diag}(1 - h_t^2) W_{hh}^T",
            "shape": r"\text{Chuỗi tích } T-1 \text{ ma trận trọng số } W_{hh}^T",
            "description": r"Khi dội ngược qua $T$ bước, gradient bị nhân liên tiếp $T$ lần với ma trận $W_{hh}$.",
            "takeaway": r"Nếu trị riêng của $W_{hh} > 1 \implies$ bùng nổ gradient; nếu $< 1 \implies$ biến mất gradient (lý do LSTM và Transformer ra đời).",
            "tags": [r"BPTT", r"Gradient"]
        }
    ],

    "overfitting_validation": [
        {
            "id": "ov-gap",
            "title": r"1. Khoảng Cách Tổng Quát Hóa (Generalization Gap)",
            "formula": r"\Delta = \mathcal{L}_{\text{val}} - \mathcal{L}_{\text{train}}",
            "shape": r"\text{Khi } \mathcal{L}_{\text{train}} \downarrow \text{ nhưng } \mathcal{L}_{\text{val}} \uparrow \implies \text{Quá Khớp (Overfitting)}",
            "description": r"Đo lường mức độ học vẹt của mô hình: mô hình ghi nhớ dữ liệu huấn luyện nhưng mất khả năng dự đoán trên dữ liệu mới.",
            "takeaway": r"Chỉ số quan trọng nhất trên dashboard huấn luyện để theo dõi sức khỏe mô hình.",
            "tags": [r"Validation", r"Gap"]
        },
        {
            "id": "ov-stop",
            "title": r"2. Cơ Chế Dừng Sớm (Early Stopping)",
            "formula": r"\text{Stop when } \mathcal{L}_{\text{val}}^{(t)} > \min_{i < t} \mathcal{L}_{\text{val}}^{(i)} \quad \text{sau } P \text{ epochs (Patience)}",
            "shape": r"P = \text{độ kiên nhẫn (patience steps)}",
            "description": r"Lưu lại checkpoint có Loss validation thấp nhất và dừng huấn luyện khi mô hình bắt đầu có dấu hiệu học vẹt.",
            "takeaway": r"Kỹ thuật miễn phí và hiệu quả nhất để thu được mô hình có khả năng tổng quát hóa cao nhất.",
            "tags": [r"Early Stopping", r"Thực Tiễn"]
        }
    ],

    # --------------------------------------------------------------------------
    # Group 5: Transformer & Attention Architecture
    # --------------------------------------------------------------------------
    "positional_encoding": [
        {
            "id": "pe-sin",
            "title": r"1. Mã Hóa Vị Trí Sinusoidal (Chiều Chẵn & Chiều Lẻ)",
            "formula": r"PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d}}\right), \qquad PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d}}\right)",
            "shape": r"pos = \text{vị trí token}, \; i = \text{chỉ số chiều không gian } [0, d/2-1]",
            "description": r"Tạo ra một bước sóng hình sin/cosin độc nhất cho từng vị trí, từ tần số siêu cao ở chiều đầu tới siêu thấp ở chiều cuối.",
            "takeaway": r"Giúp kiến trúc Transformer (vốn không có khái niệm thứ tự) nhận biết được khoảng cách giữa các từ.",
            "tags": [r"Positional", r"Sinusoidal"]
        },
        {
            "id": "pe-linear",
            "title": r"2. Tính Chất Tịnh Tiến Tuyến Tính (Linear Shift)",
            "formula": r"PE_{pos + k} = T_k \cdot PE_{pos}",
            "shape": r"T_k = \text{ma trận xoay tuyến tính chỉ phụ thuộc vào độ lệch } k",
            "description": r"Mô hình có thể dễ dàng học cách chú ý tới các vị trí tương đối vì $PE_{pos+k}$ là một hàm tuyến tính của $PE_{pos}$.",
            "takeaway": r"Khả năng tổng quát hóa ra những chuỗi văn bản dài hơn độ dài từng thấy trong lúc huấn luyện.",
            "tags": [r"Toán Học", r"Tịnh Tiến"]
        }
    ],

    "self_attention": [
        {
            "id": "sa-formula",
            "title": r"1. Chú Ý Tích Vô Hướng Tỉ Lệ (Scaled Dot-Product Attention)",
            "formula": r"\operatorname{Attention}(Q, K, V) = \operatorname{softmax}\left(\frac{Q K^T}{\sqrt{d_k}} + M\right) V",
            "shape": r"Q, K \in \mathbb{R}^{L \times d_k}, \; V \in \mathbb{R}^{L \times d_v} \implies \text{Output} \in \mathbb{R}^{L \times d_v}",
            "description": r"Tính điểm tương đồng giữa Query và Key, chuẩn hóa thành trọng số chú ý qua Softmax và tính trung bình có trọng số trên Value.",
            "takeaway": r"Công thức làm thay đổi toàn bộ thế giới AI (bài báo 'Attention Is All You Need', 2017).",
            "tags": [r"Self-Attention", r"Cốt Lõi"]
        },
        {
            "id": "sa-scale",
            "title": r"2. Vì Sao Cần Chia Cho Căn Bậc Hai (\sqrt{d_k})?",
            "formula": r"\operatorname{Var}(q \cdot k) = \sum_{i=1}^{d_k} \operatorname{Var}(q_i k_i) = d_k \implies \operatorname{Var}\left(\frac{q \cdot k}{\sqrt{d_k}}\right) = 1.0",
            "shape": r"\text{Giả sử } q_i, k_i \sim \mathcal{N}(0, 1) \text{ độc lập}",
            "description": r"Khi số chiều $d_k$ lớn, tích vô hướng $Q K^T$ sẽ có giá trị cực lớn, đẩy Softmax vào vùng bão hòa có đạo hàm gần bằng 0.",
            "takeaway": r"Chia $\sqrt{d_k}$ giữ phương sai ổn định bằng 1, giúp gradient lưu thông mạnh mẽ.",
            "tags": [r"Toán Học", r"Scaling"]
        },
        {
            "id": "sa-mask",
            "title": r"3. Mặt Nạ Nhân Quả (Causal Mask M)",
            "formula": r"M_{i, j} = \begin{cases} 0 & \text{nếu } j \le i \text{ (quá khứ \& hiện tại)} \\ -\infty & \text{nếu } j > i \text{ (tương lai)} \end{cases}",
            "shape": r"e^{-\infty} = 0 \implies \text{Trọng số chú ý tương lai triệt tiêu hoàn toàn}",
            "description": r"Đảm bảo khi dự đoán từ tiếp theo, mô hình ngôn ngữ tự hồi quy (Autoregressive) không nhìn trộm tương lai.",
            "takeaway": r"Bắt buộc cho mọi mô hình sinh văn bản Decoder-only (GPT, LLaMA, Claude).",
            "tags": [r"Causal Mask", r"Decoder"]
        }
    ],

    "multi_head_attention": [
        {
            "id": "mha-sub",
            "title": r"1. Chiếu Vào Các Không Gian Con (Subspace Projections)",
            "formula": r"Q_i = X W_i^Q, \quad K_i = X W_i^K, \quad V_i = X W_i^V \qquad (i = 1 \dots h)",
            "shape": r"W_i^Q, W_i^K \in \mathbb{R}^{d_{\text{model}} \times d_k}, \quad d_k = \frac{d_{\text{model}}}{h}",
            "description": r"Thay vì dùng 1 đầu lớn, chia nhỏ thành $h$ đầu độc lập. Mỗi đầu tập trung học một khía cạnh ngữ pháp, ngữ nghĩa khác nhau.",
            "takeaway": r"Giống như có nhiều chuyên gia cùng đọc văn bản dưới các góc nhìn đa dạng.",
            "tags": [r"MHA", r"Subspaces"]
        },
        {
            "id": "mha-concat",
            "title": r"2. Ghép Nối & Chiếu Đầu Ra (Concat & Output Projection)",
            "formula": r"\operatorname{MHA}(Q, K, V) = \operatorname{Concat}(\text{head}_1, \dots, \text{head}_h) W^O",
            "shape": r"W^O \in \mathbb{R}^{(h \cdot d_v) \times d_{\text{model}}} \equiv \mathbb{R}^{d_{\text{model}} \times d_{\text{model}}}",
            "description": r"Gộp thông tin từ $h$ đầu chú ý lại và chiếu qua ma trận $W^O$ để đưa về kích thước không gian ẩn chuẩn.",
            "takeaway": r"Tổng chi phí tính toán của $h$ đầu nhỏ tương đương đúng 1 đầu duy nhất kích thước đầy đủ.",
            "tags": [r"MHA", r"Projection"]
        }
    ],

    "flash_attention": [
        {
            "id": "fa-online",
            "title": r"1. Công Thức Online Softmax Cục Bộ",
            "formula": r"m_{\text{new}} = \max(m_{\text{old}}, m_j), \qquad l_{\text{new}} = e^{m_{\text{old}} - m_{\text{new}}} l_{\text{old}} + e^{m_j - m_{\text{new}}}",
            "shape": r"m = \text{giá trị max}, \; l = \text{tổng số mũ mẫu số (sum of exps)}",
            "description": r"Tính toán Softmax tuần tự theo từng khối gạch (Tile) mà không cần phải nạp toàn bộ hàng vào bộ nhớ cùng lúc.",
            "takeaway": r"Bí quyết đột phá loại bỏ hoàn toàn việc lưu ma trận chú ý $N \times N$ khổng lồ.",
            "tags": [r"FlashAttention", r"Online Softmax"]
        },
        {
            "id": "fa-io",
            "title": r"2. Tối Ưu Hóa Băng Thông Bộ Nhớ IO (Memory Hierarchy)",
            "formula": r"\text{Standard Attention: } O(N^2) \text{ HBM Access} \quad \implies \quad \text{FlashAttention: } O(N) \text{ HBM Access}",
            "shape": r"\text{SRAM (nhanh 19 TB/s)} \quad \text{vs} \quad \text{HBM (chậm 1.5 - 3 TB/s)}",
            "description": r"Giữ dữ liệu trong bộ nhớ đệm SRAM cực nhanh trên chip GPU và tính toán trực tiếp, chỉ ghi kết quả cuối ra VRAM.",
            "takeaway": r"Tăng tốc độ Transformer từ 2 đến 4 lần và cho phép mở rộng ngữ cảnh lên hàng trăm nghìn tokens.",
            "tags": [r"Hardware", r"IO Complexity"]
        }
    ],

    "rope_rotary": [
        {
            "id": "rope-rot",
            "title": r"1. Phép Xoay Tọa Độ 2D Trong Không Gian Phức",
            "formula": r"\begin{pmatrix} q_{2i}' \\ q_{2i+1}' \end{pmatrix} = \begin{pmatrix} \cos(m\theta_i) & -\sin(m\theta_i) \\ \sin(m\theta_i) & \cos(m\theta_i) \end{pmatrix} \begin{pmatrix} q_{2i} \\ q_{2i+1} \end{pmatrix}, \qquad \theta_i = 10000^{-2i/d}",
            "shape": r"m = \text{vị trí token}, \; i = \text{cặp chiều không gian thứ } i",
            "description": r"Chia vector Query và Key thành các cặp 2D, xoay mỗi cặp một góc tỉ lệ thuận với vị trí token $m$.",
            "takeaway": r"Tích hợp trực tiếp vị trí vào vector đặc trưng mà không cần cộng thêm vector vị trí tuyệt đối.",
            "tags": [r"RoPE", r"Phép Xoay"]
        },
        {
            "id": "rope-rel",
            "title": r"2. Tương Quan Vị Trí Tương Đối Hoàn Hảo (Relative Dot Product)",
            "formula": r"\langle R_m q, \; R_n k \rangle = q^T R_m^T R_n k = q^T R_{n-m} k",
            "shape": r"\text{Tích vô hướng chỉ phụ thuộc vào khoảng cách tương đối } (n - m)",
            "description": r"Nhờ tính chất trực giao của ma trận xoay, tích vô hướng giữa 2 token chỉ phụ thuộc vào khoảng cách cách nhau bao nhiêu từ.",
            "takeaway": r"Giải pháp mã hóa vị trí thống trị toàn bộ thế giới LLM mã nguồn mở hiện nay (LLaMA, Qwen, Mistral).",
            "tags": [r"Toán Học", r"Relative Pos"]
        }
    ],

    "transformer_block_params": [
        {
            "id": "tbp-attn",
            "title": r"1. Tham Số Khối Chú Ý (Self-Attention Layer)",
            "formula": r"\text{Params}_{\text{attn}} = 4 d_{\text{model}}^2 \quad (W_Q, W_K, W_V, W_O)",
            "shape": r"\text{Mỗi ma trận có kích thước } d_{\text{model}} \times d_{\text{model}}",
            "description": r"Gồm 3 ma trận chiếu đầu vào (Q, K, V) và 1 ma trận chiếu đầu ra (Output projection).",
            "takeaway": r"Chiếm khoảng 1/3 tổng số tham số của một khối Transformer tiêu chuẩn.",
            "tags": [r"Attention", r"Đếm Tham Số"]
        },
        {
            "id": "tbp-mlp",
            "title": r"2. Tham Số Khối Lan Truyền Tiến (MLP / FFN)",
            "formula": r"\text{Standard FFN: } 8 d_{\text{model}}^2 \qquad \text{SwiGLU FFN: } 3 \times d_{\text{model}} \times d_{\text{ff}} \approx 8.25 d_{\text{model}}^2",
            "shape": r"d_{\text{ff}} = 4 d_{\text{model}} \text{ (Standard)} \quad \text{hoặc } \approx \frac{8}{3} d_{\text{model}} \text{ (SwiGLU)}",
            "description": r"Standard MLP gồm 2 tầng ($d \to 4d \to d$). SwiGLU gồm 3 tầng (Gate, Up, Down) giúp mô hình thông minh hơn.",
            "takeaway": r"Khối MLP là nơi lưu trữ 'tri thức thực tế' (factual knowledge) của mô hình ngôn ngữ.",
            "tags": [r"MLP", r"SwiGLU"]
        },
        {
            "id": "tbp-total",
            "title": r"3. Tổng Tham Số Mỗi Tầng & Dung Lượng VRAM",
            "formula": r"\text{Total / Layer} \approx 12 d_{\text{model}}^2, \qquad \text{VRAM Weights} = \text{TotalParams} \times \text{sizeof(dtype)}",
            "shape": r"\text{Ví dụ LLaMA-7B: 32 layers, } d=4096 \implies \approx 7 \times 10^9 \text{ params}",
            "description": r"Công thức nhẩm nhanh dung lượng: Mô hình 7 tỷ tham số (7B) ở FP16 tốn $7 \times 2 = 14$ GB VRAM chỉ để nạp trọng số.",
            "takeaway": r"Quy tắc nằm lòng của mọi kỹ sư AI khi tính toán tài nguyên triển khai phần cứng.",
            "tags": [r"Hệ Thống", r"Dung Lượng"]
        }
    ],

    "mini_gpt_forward": [
        {
            "id": "mgpt-embed",
            "title": r"1. Giai Đoạn Nhúng Đầu Vào (Input Embeddings)",
            "formula": r"h_0 = W_e[x] + W_p[pos]",
            "shape": r"W_e \in \mathbb{R}^{V \times d}, \; W_p \in \mathbb{R}^{T_{\max} \times d} \implies h_0 \in \mathbb{R}^{B \times T \times d}",
            "description": r"Biến đổi chuỗi token ID rời rạc thành các vector đặc trưng liên tục kết hợp cùng thông tin vị trí.",
            "takeaway": r"Khởi đầu của luồng dư Residual Stream chạy xuyên suốt mô hình.",
            "tags": [r"Embedding", r"Forward"]
        },
        {
            "id": "mgpt-block",
            "title": r"2. Vòng Lặp Qua N Khối Transformer Blocks",
            "formula": r"h_l' = h_{l-1} + \operatorname{Attn}(\operatorname{LN}(h_{l-1})), \qquad h_l = h_l' + \operatorname{MLP}(\operatorname{LN}(h_l'))",
            "shape": r"l = 1 \dots L \text{ (số tầng Transformer)}",
            "description": r"Hai chặng xử lý Pre-LN trên mỗi tầng: chặng 1 trao đổi thông tin giữa các từ (Attention), chặng 2 xử lý nội suy từng từ (MLP).",
            "takeaway": r"Cấu trúc lặp đồng nhất tạo nên sức mạnh mở rộng (Scalability) của mô hình Transformer.",
            "tags": [r"Transformer", r"Block"]
        },
        {
            "id": "mgpt-head",
            "title": r"3. Chiếu Logits Từ Vựng & Phân Phối Kế Tiếp",
            "formula": r"Z = \operatorname{LN}(h_L) \cdot W_e^T, \qquad P = \operatorname{softmax}(Z)",
            "shape": r"Z \in \mathbb{R}^{B \times T \times V} \implies \text{Logits chấm điểm trên toàn bộ từ vựng } V",
            "description": r"Sử dụng lại chính ma trận nhúng từ (Weight Tying $W_e^T$) để tính điểm xác suất cho token tiếp theo.",
            "takeaway": r"Tiết kiệm hàng triệu tham số và giúp biểu diễn từ vựng ở đầu vào và đầu ra đồng nhất không gian.",
            "tags": [r"LM Head", r"Logits"]
        }
    ],

    # --------------------------------------------------------------------------
    # Group 6: LLM Systems, Inference & Distributed Training
    # --------------------------------------------------------------------------
    "embedding_tokenization": [
        {
            "id": "et-onehot",
            "title": r"1. Bản Chất Đại Số Của Embedding Lookup",
            "formula": r"E(t) = \text{OneHot}(t) \cdot W_E = W_E[t, :]",
            "shape": r"\text{OneHot} \in \{0, 1\}^V, \; W_E \in \mathbb{R}^{V \times d} \implies E(t) \in \mathbb{R}^d",
            "description": r"Thao tác tra cứu từ điển `W_E[t]` thực chất là phép nhân ma trận với vector One-hot, chọn ra hàng thứ $t$.",
            "takeaway": r"Bản chất toán học vẫn là một tầng tuyến tính (Linear Layer) nhưng được tối ưu thành phép tra cứu chỉ mục trong code.",
            "tags": [r"Embedding", r"One-Hot"]
        },
        {
            "id": "et-bpe",
            "title": r"2. Thuật Toán Ghép Cặp Byte (Byte-Pair Encoding - BPE)",
            "formula": r"\text{Iterate: } \operatorname{arg\,max}_{(c_1, c_2)} \operatorname{Freq}(c_1, c_2) \to \text{Gộp thành token mới } c_{\text{new}}",
            "shape": r"\text{Kích thước từ vựng } V \text{ (thường từ 32,000 đến 128,000 tokens)}",
            "description": r"Bắt đầu từ các ký tự đơn lẻ hoặc bytes, liên tục gộp cặp ký tự xuất hiện nhiều nhất để tạo thành các subwords.",
            "takeaway": r"Cân bằng hoàn hảo giữa độ dài ngữ cảnh và kích thước từ vựng, giải quyết triệt để vấn đề từ mới (Out-Of-Vocabulary).",
            "tags": [r"Tokenization", r"BPE"]
        }
    ],

    "kv_cache_anatomy": [
        {
            "id": "kvc-size",
            "title": r"1. Dung Lượng Bộ Nhớ KV Cache Cần Cấp Phát",
            "formula": r"\text{VRAM}_{\text{KV}} = 2 \times B \times L \times n_{\text{layers}} \times n_{\text{kv\_heads}} \times d_{\text{head}} \times \text{sizeof(dtype)}",
            "shape": r"\text{Số 2 đại diện cho 2 ma trận: Key và Value}",
            "description": r"Lưu trữ lại các vector Key và Value của các từ đã sinh trong quá khứ để không phải tính lại từ đầu.",
            "takeaway": r"Nguyên nhân chính gây tràn bộ nhớ GPU khi mô hình chạy phục vụ nhiều người dùng hoặc chuỗi quá dài.",
            "tags": [r"KV Cache", r"VRAM"]
        },
        {
            "id": "kvc-phases",
            "title": r"2. Hai Pha Xử Lý: Prefill vs Decode",
            "formula": r"\text{Prefill: } O(T^2) \text{ Compute-bound (Song song)} \quad \text{vs} \quad \text{Decode: } O(1) \text{ Memory-bound (Tuần tự)}",
            "shape": r"\text{Decode bị thắt cổ chai bởi băng thông đọc VRAM (Memory Bandwidth)}",
            "description": r"Pha Prefill đọc prompt cực nhanh nhờ tính song song. Pha Decode sinh từng token một, mỗi bước phải nạp toàn bộ KV Cache cũ.",
            "takeaway": r"Lý do vì sao tốc độ sinh token của LLM phụ thuộc vào băng thông bộ nhớ của card đồ họa.",
            "tags": [r"Hệ Thống", r"Prefill Decode"]
        }
    ],

    "gqa_kv_cache": [
        {
            "id": "gqa-ratio",
            "title": r"1. Tỉ Lệ Chia Sẻ Nhóm (Grouped Query Ratio)",
            "formula": r"G = \frac{h_Q}{h_{KV}} \qquad (\text{MHA: } G=1, \quad \text{GQA: } 1 < G < h_Q, \quad \text{MQA: } h_{KV}=1)",
            "shape": r"h_Q = \text{số đầu Query}, \; h_{KV} = \text{số đầu Key/Value}",
            "description": r"Cho nhiều đầu Query cùng dùng chung một đầu Key và Value. LLaMA 3 8B dùng $h_Q = 32, h_{KV} = 8 \implies G = 4$.",
            "takeaway": r"Tiết kiệm 4 lần dung lượng KV Cache nhưng vẫn giữ nguyên 100% chất lượng suy luận so với MHA.",
            "tags": [r"GQA", r"Cấu Trúc"]
        },
        {
            "id": "gqa-mem",
            "title": r"2. Tiết Kiệm Băng Thông Khi Sinh Token",
            "formula": r"\text{VRAM KV (GQA)} = \frac{1}{G} \times \text{VRAM KV (MHA)}",
            "shape": r"\text{Giảm lượng nạp HBM từ } h_Q \text{ xuống } h_{KV} \text{ mỗi token}",
            "description": r"Giảm lượng dữ liệu cần nạp từ VRAM vào chip GPU trong mỗi bước sinh từ, giúp tăng tốc độ generate tokens lên đáng kể.",
            "takeaway": r"Cải tiến kiến trúc quan trọng nhất trong thế hệ LLM hiện đại giúp tăng thông lượng phục vụ.",
            "tags": [r"Tối Ưu", r"Băng Thông"]
        }
    ],

    "sampling_decoding": [
        {
            "id": "sd-temp",
            "title": r"1. Biến Đổi Nhiệt Độ (Temperature Scaling)",
            "formula": r"P_i = \frac{e^{z_i / T}}{\sum_{j=1}^V e^{z_j / T}}",
            "shape": r"T \to 0 \implies \text{Greedy Argmax (Cứng nhắc)}, \quad T \to \infty \implies \text{Đều (Hỗn loạn)}",
            "description": r"Chia logits cho nhiệt độ $T$ trước khi đưa vào Softmax. $T < 1.0$ làm nổi bật các từ điểm cao; $T > 1.0$ làm phẳng phân phối.",
            "takeaway": r"Nút vặn quan trọng nhất điều khiển tính sáng tạo hoặc tính chính xác của phản hồi văn bản.",
            "tags": [r"Temperature", r"Sampling"]
        },
        {
            "id": "sd-topk",
            "title": r"2. Lọc Top-K (Top-K Truncation)",
            "formula": r"z_i' = \begin{cases} z_i & \text{nếu } z_i \in \operatorname{TopK}(z, K) \\ -\infty & \text{ngược lại} \end{cases}",
            "shape": r"K \approx 40 \text{ hoặc } 50",
            "description": r"Chỉ giữ lại đúng $K$ từ có điểm số cao nhất, triệt tiêu hoàn toàn các từ hiếm lạ ở đuôi phân phối xác suất.",
            "takeaway": r"Ngăn mô hình nói nhảm hoặc sinh ra những ký tự vô nghĩa.",
            "tags": [r"Top-K", r"Lọc"]
        },
        {
            "id": "sd-topp",
            "title": r"3. Lọc Hạt Nhân Top-P (Nucleus Sampling)",
            "formula": r"\text{Chọn tập nhỏ nhất } V^{(p)} \subset V \quad \text{sao cho } \sum_{i \in V^{(p)}} P_i \ge p",
            "shape": r"p \approx 0.9 \text{ (90% tổng khối lượng xác suất tích lũy)}",
            "description": r"Tập hợp từ được chọn động theo ngữ cảnh: khi mô hình tự tin thì tập nhỏ, khi phân vân thì tập tự mở rộng.",
            "takeaway": r"Mềm dẻo và tự nhiên hơn nhiều so với Top-K cố định.",
            "tags": [r"Top-P", r"Nucleus"]
        }
    ],

    "quantization_int8": [
        {
            "id": "q8-symm",
            "title": r"1. Lượng Tử Hóa Đối Xứng (Symmetric INT8)",
            "formula": r"q = \operatorname{clamp}\left(\left\lfloor \frac{x}{S} \right\rceil, -127, 127\right), \qquad S = \frac{\max(|x|)}{127}",
            "shape": r"x \in \mathbb{R} \to q \in [-127, 127] \cap \mathbb{Z}",
            "description": r"Điểm 0 của số thực khớp chính xác với điểm 0 của số nguyên. Không cần lưu giá trị lệch (Zero-point $Z = 0$).",
            "takeaway": r"Tính toán ma trận INT8 cực nhanh trên nhân Tensor Core của GPU.",
            "tags": [r"Symmetric", r"INT8"]
        },
        {
            "id": "q8-asymm",
            "title": r"2. Lượng Tử Hóa Phi Đối Xứng (Asymmetric INT8)",
            "formula": r"q = \operatorname{clamp}\left(\left\lfloor \frac{x}{S} \right\rceil + Z, -128, 127\right), \qquad S = \frac{x_{\max} - x_{\min}}{255}, \quad Z = \left\lfloor -\frac{x_{\min}}{S} \right\rceil",
            "shape": r"Z = \text{điểm gốc không (Zero-point offset)}",
            "description": r"Tận dụng trọn vẹn 256 mức lượng tử hóa cho dữ liệu lệch một phía (ví dụ sau hàm kích hoạt ReLU).",
            "takeaway": r"Giảm dung lượng mô hình đi 2 lần so với FP16 (từ 2 bytes xuống 1 byte mỗi trọng số).",
            "tags": [r"Asymmetric", r"Zero-Point"]
        },
        {
            "id": "q8-dequant",
            "title": r"3. Giải Lượng Tử Hóa (Dequantization)",
            "formula": r"\hat{x} = S \times (q - Z)",
            "shape": r"q \in \mathbb{Z} \to \hat{x} \in \mathbb{R} \approx x",
            "description": r"Khôi phục lại giá trị số thực dấu phẩy động gần đúng từ giá trị nguyên 8-bit.",
            "takeaway": r"Cơ chế hoạt động nền tảng của các định dạng nén mô hình như GGUF, AWQ và GPTQ.",
            "tags": [r"Dequant", r"Khôi Phục"]
        }
    ],

    "lora_finetuning": [
        {
            "id": "lora-decomp",
            "title": r"1. Phân Rã Ma Trận Hạng Thấp (Low-Rank Decomposition)",
            "formula": r"W = W_0 + \Delta W = W_0 + \frac{\alpha}{r} B \cdot A",
            "shape": r"W_0 \in \mathbb{R}^{d \times k} \text{ (đóng băng)}, \quad B \in \mathbb{R}^{d \times r}, \; A \in \mathbb{R}^{r \times k} \quad (r \ll \min(d, k))",
            "description": r"Đóng băng toàn bộ trọng số gốc $W_0$. Huấn luyện thêm 2 ma trận kẹp nhỏ $A$ và $B$ với hạng $r$ cực nhỏ (ví dụ $r=8$ hoặc $16$).",
            "takeaway": r"Giảm 99% số lượng tham số cần huấn luyện, cho phép fine-tune mô hình 70B chỉ với 1 GPU cá nhân.",
            "tags": [r"LoRA", r"Hạng Thấp"]
        },
        {
            "id": "lora-init",
            "title": r"2. Khởi Tạo Trọng Số An Toàn & Scaling Factor",
            "formula": r"A \sim \mathcal{N}\left(0, \frac{1}{r}\right), \quad B = 0 \implies \Delta W = B \cdot A = 0 \text{ tại bước } 0",
            "shape": r"\frac{\alpha}{r} = \text{hệ số khuếch đại thích nghi}",
            "description": r"Khởi tạo $B=0$ đảm bảo mô hình giữ nguyên 100% tri thức gốc ở thời điểm bắt đầu huấn luyện.",
            "takeaway": r"Khi hoàn tất, có thể gộp thẳng $\Delta W$ vào $W_0$, không làm tăng thêm dù chỉ 1ms độ trễ suy luận.",
            "tags": [r"Khởi Tạo", r"Không Độ Trễ"]
        }
    ],

    "moe_routing": [
        {
            "id": "moe-gate",
            "title": r"1. Cơ Chế Định Tuyến Cổng (Top-K Gating)",
            "formula": r"H(x) = x \cdot W_g, \qquad G(x) = \operatorname{softmax}(\operatorname{TopK}(H(x), k))",
            "shape": r"W_g \in \mathbb{R}^{d \times E}, \; E = \text{số lượng chuyên gia}, \; k \ll E \text{ (ví dụ chọn 2 trong 8)}",
            "description": r"Một mạng nơ-ron cổng router chấm điểm xem token này phù hợp nhất với chuyên gia nào trong số $E$ chuyên gia.",
            "takeaway": r"Khai phá sức mạnh mô hình khổng lồ nhưng chi phí tính toán FLOPs mỗi token chỉ tương đương mô hình nhỏ.",
            "tags": [r"MoE", r"Routing"]
        },
        {
            "id": "moe-blend",
            "title": r"2. Tổng Hợp Đầu Ra Chuyên Gia",
            "formula": r"y = \sum_{i \in \operatorname{TopK}} G(x)_i \cdot \text{Expert}_i(x)",
            "shape": r"G(x)_i = \text{trọng số phần trăm đóng góp của chuyên gia } i",
            "description": r"Kết hợp đầu ra có trọng số từ $k$ chuyên gia được kích hoạt.",
            "takeaway": r"Kiến trúc nền tảng của Mixtral 8x7B, DeepSeek-V2/V3 và GPT-4.",
            "tags": [r"MoE", r"Tổng Hợp"]
        },
        {
            "id": "moe-aux",
            "title": r"3. Hàm Mất Mát Cân Bằng Tải (Load Balancing Loss)",
            "formula": r"\mathcal{L}_{\text{aux}} = \alpha \cdot E \sum_{i=1}^E f_i P_i",
            "shape": r"f_i = \text{tỉ lệ token định tuyến vào } i, \quad P_i = \text{xác suất trung bình gán cho } i",
            "description": r"Phạt nặng nếu router dồn toàn bộ công việc cho 1-2 chuyên gia yêu thích, bỏ rơi các chuyên gia còn lại.",
            "takeaway": r"Bắt buộc phải có để toàn bộ các chuyên gia cùng phát triển đồng đều.",
            "tags": [r"Auxiliary Loss", r"Cân Bằng"]
        }
    ],

    "activation_checkpointing": [
        {
            "id": "ac-trade",
            "title": r"1. Đánh Đổi Tính Toán Để Tiết Kiệm Bộ Nhớ VRAM",
            "formula": r"\text{Standard: } M_{\text{act}} = O(N) \implies \text{Checkpointing: } M_{\text{act}} = O(\sqrt{N})",
            "shape": r"N = \text{số lượng tầng của mô hình}",
            "description": r"Chỉ lưu kích hoạt tại $\sqrt{N}$ chốt kiểm soát. Ở lượt chạy ngược, tính toán lại (recompute) các tầng ở giữa.",
            "takeaway": r"Tiết kiệm 80% VRAM activations với cái giá chỉ tăng thêm khoảng 33% số phép tính FLOPs.",
            "tags": [r"VRAM", r"Checkpointing"]
        },
        {
            "id": "ac-opt",
            "title": r"2. Chiến Lược Đặt Chốt Tối Ưu Nhất",
            "formula": r"\text{Optimal Segment Length} = k^* = \sqrt{\frac{2 \times \text{MemoryPerLayer}}{\text{ComputeTime}}} \approx \sqrt{N}",
            "shape": r"\text{Chia mô hình thành các đoạn khối đều nhau}",
            "description": r"Chia đều các chốt kiểm soát giúp cực tiểu hóa diện tích đồ thị bộ nhớ đỉnh (Peak Memory).",
            "takeaway": r"Công nghệ bắt buộc giúp mở rộng batch size hoặc huấn luyện ngữ cảnh siêu dài.",
            "tags": [r"Tối Ưu", r"Bộ Nhớ Đỉnh"]
        }
    ],

    "mixed_precision": [
        {
            "id": "mp-loss-scale",
            "title": r"1. Kỹ Thuật Co Giãn Hàm Mất Mát Động (Dynamic Loss Scaling)",
            "formula": r"\mathcal{L}_{\text{scaled}} = \mathcal{L} \times S \implies g_{\text{scaled}} = g \times S, \qquad g_{\text{unscaled}} = \frac{g_{\text{scaled}}}{S}",
            "shape": r"S = \text{hệ số scale (ví dụ } 2^{15} = 32768\text{)}",
            "description": r"Trong FP16, các gradient nhỏ ($< 6 \times 10^{-8}$) bị hụt về 0 (underflow). Nhân $S$ giúp đẩy gradient vào vùng an toàn.",
            "takeaway": r"Trước khi cập nhật trọng số, chia ngược lại cho $S$ để bảo toàn độ lớn chính xác.",
            "tags": [r"Loss Scale", r"FP16"]
        },
        {
            "id": "mp-skip",
            "title": r"2. Tự Động Bỏ Qua Bước Lỗi (Skip Step On Inf/NaN)",
            "formula": r"\text{if } \operatorname{any\_is\_inf\_or\_nan}(g_{\text{scaled}}) \implies S \leftarrow S / 2, \quad \text{Skip Step!}",
            "shape": r"\text{Nếu 2000 bước liên tiếp an toàn } \implies S \leftarrow S \times 2",
            "description": r"Bộ điều khiển tự động hạ $S$ nếu xuất hiện số vô cực (tràn số) và tăng $S$ nếu mọi thứ êm đềm.",
            "takeaway": r"Cơ chế tự bảo vệ giúp quá trình huấn luyện mixed precision tự động vận hành trơn tru hàng tuần.",
            "tags": [r"Động", r"An Toàn"]
        },
        {
            "id": "mp-mem",
            "title": r"3. Phân Bổ Bộ Nhớ 16 Bytes / Tham Số Trong FP16 Adam",
            "formula": r"\text{Memory / Param} = 2_{\text{FP16 W}} + 2_{\text{FP16 G}} + 4_{\text{Master W}} + 4_{\text{Momentum}} + 4_{\text{Variance}} = 16 \text{ Bytes}",
            "shape": r"\text{Huấn luyện Mixed Precision KHÔNG làm giảm bộ nhớ trạng thái mô hình so với FP32!}",
            "description": r"Trọng số gốc FP32 và 2 trạng thái Adam bắt buộc phải lưu ở FP32 để chống tích lũy sai số.",
            "takeaway": r"Mixed precision chỉ giúp giảm bộ nhớ Activation và tăng tốc độ tính toán phần cứng Tensor Core.",
            "tags": [r"Systems", r"16 Bytes"]
        }
    ],

    "data_parallel_allreduce": [
        {
            "id": "dpar-ring",
            "title": r"1. Khối Lượng Truyền Thông Vòng Ring All-Reduce",
            "formula": r"V_{\text{comm}} = 2 \times \frac{N-1}{N} \times S \approx 2 S \quad (\text{khi } N \text{ lớn})",
            "shape": r"N = \text{số lượng GPU}, \; S = \text{kích thước gradients của mô hình (Bytes)}",
            "description": r"Chia gradients thành $N$ phần và truyền vòng tròn qua 2 giai đoạn: Scatter-Reduce và All-Gather.",
            "takeaway": r"Khối lượng truyền thông trên mỗi GPU không đổi dù tăng số lượng GPU lên hàng trăm card đồ họa.",
            "tags": [r"All-Reduce", r"Song Song"]
        },
        {
            "id": "dpar-sync",
            "title": r"2. Đồng Bộ Hóa Gradients Toàn Cục",
            "formula": r"g_{\text{global}} = \frac{1}{N} \sum_{i=1}^N g_i",
            "shape": r"\text{Mỗi GPU huấn luyện trên 1 phần dữ liệu riêng biệt (Data Parallel)}",
            "description": r"Sau khi tính xong backward cục bộ, các GPU đồng bộ và lấy trung bình gradient trước khi cập nhật trọng số.",
            "takeaway": r"Đảm bảo trọng số trên toàn bộ cụm GPU luôn đồng nhất 100% sau mỗi bước tối ưu.",
            "tags": [r"Đồng Bộ", r"Gradients"]
        }
    ],

    "zero_fsdp": [
        {
            "id": "z-stages",
            "title": r"1. Ba Cấp Độ Phân Mảnh Trạng Thái Bộ Nhớ (ZeRO Stages)",
            "formula": r"\text{ZeRO-1: Chia nhỏ Optimizer } (4\times) \quad \to \quad \text{ZeRO-2: Chia thêm Gradients } (8\times) \quad \to \quad \text{ZeRO-3 / FSDP: Chia toàn bộ Weights } (16\times)",
            "shape": r"\text{Bộ nhớ mỗi GPU} = \frac{2\Phi_{\text{weights}} + 2\Phi_{\text{grads}} + 12\Phi_{\text{optim}}}{N_d}",
            "description": r"Loại bỏ hoàn toàn việc nhân bản dữ liệu thừa thãi giữa các card đồ họa trong cụm phân tán.",
            "takeaway": r"Công nghệ then chốt của DeepSpeed và PyTorch FSDP giúp huấn luyện các siêu mô hình hàng trăm tỷ tham số.",
            "tags": [r"ZeRO", r"FSDP"]
        },
        {
            "id": "z-mem",
            "title": r"2. Công Thức Dung Lượng Bộ Nhớ Mỗi GPU Khi Áp Dụng FSDP",
            "formula": r"\text{VRAM}_{\text{GPU}} = \frac{16 \Phi}{N_d} + \text{Activations} + \text{Buffers}",
            "shape": r"\Phi = \text{tổng số tham số mô hình}, \; N_d = \text{số lượng GPU tham gia song song}",
            "description": r"Kích thước mô hình tối đa có thể huấn luyện tăng tỉ lệ thuận tuyến tính theo số lượng GPU.",
            "takeaway": r"16 card GPU có thể chứa mô hình lớn gấp 16 lần so với chạy Data Parallel thông thường.",
            "tags": [r"VRAM", r"Scaling"]
        }
    ],

    "roofline_arithmetic_intensity": [
        {
            "id": "rf-intensity",
            "title": r"1. Cường Độ Tính Toán (Operational / Arithmetic Intensity)",
            "formula": r"I = \frac{\text{FLOPs}}{\text{Bytes nạp / ghi từ DRAM}}",
            "shape": r"I = \text{số phép tính số học thực hiện được trên mỗi byte dữ liệu di chuyển}",
            "description": r"Đo lường mức độ tận dụng dữ liệu: một con số được nạp vào thì ta dùng nó để tính toán bao nhiêu lần.",
            "takeaway": r"Phép nhân ma trận GEMM có $I$ rất cao; phép cộng vector, chuẩn hóa LayerNorm có $I$ rất thấp.",
            "tags": [r"Roofline", r"Cường Độ"]
        },
        {
            "id": "rf-peak",
            "title": r"2. Mô Hình Giới Hạn Hiệu Năng Roofline",
            "formula": r"P_{\text{attainable}} = \min\left(P_{\text{peak}}, \; I \times \text{Bandwidth}_{\text{memory}}\right)",
            "shape": r"P_{\text{peak}} = \text{TFLOPS tối đa phần cứng}, \; \text{Bandwidth} = \text{băng thông GB/s}",
            "description": r"Nếu $I < I^* = \frac{P_{\text{peak}}}{\text{Bandwidth}}$: bài toán bị **nghẽn bộ nhớ (Memory-bound)**. Nếu $I > I^*$: bài toán bị **nghẽn tính toán (Compute-bound)**.",
            "takeaway": r"Kim chỉ nam tối thượng để xác định phương hướng tối ưu hóa kernel C++/CUDA.",
            "tags": [r"Hiệu Năng", r"Roofline"]
        }
    ]
}

def escape_tex_for_js_string(s):
    # Turn single backslash into double backslash so the output JS file has \\
    # AND escape single quotes so they don't break JS '...' string literals!
    return s.replace('\\', '\\\\').replace("'", "\\'")

def process_lesson(slug, formulas):
    index_path = f"lessons/{slug}/index.html"
    if not os.path.exists(index_path):
        print(f"[-] File not found: {index_path}")
        return False
    
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    # 1. Check if mount-formula-summary already exists
    if 'mount-formula-summary' not in html:
        comment_mount_pattern = r'(<div id="mount-comment-section"></div>)'
        if not re.search(comment_mount_pattern, html):
            print(f"[-] mount-comment-section not found in {slug}")
            return False
        html = re.sub(
            comment_mount_pattern,
            r'\1\n          <div id="mount-formula-summary" style="display: none;"></div>',
            html,
            count=1
        )

    # 2. Check if createFormulaSummary is imported
    if 'createFormulaSummary' not in html:
        import_match = re.search(r"(import \{ createCommentSection \} from '[^']+';)", html)
        if not import_match:
            print(f"[-] import createCommentSection not found in {slug}")
            return False
        html = html.replace(
            import_match.group(1),
            import_match.group(1) + "\n    import { createFormulaSummary } from '../../shared/components/FormulaSummary.js';"
        )

    # 3. Format FORMULAS JS array
    formulas_js = "    const FORMULAS = [\n"
    for i, item in enumerate(formulas):
        escaped_title = escape_tex_for_js_string(item['title'])
        escaped_formula = escape_tex_for_js_string(item['formula'])
        escaped_desc = escape_tex_for_js_string(item['description'])
        escaped_takeaway = escape_tex_for_js_string(item['takeaway'])
        escaped_shape = escape_tex_for_js_string(item.get('shape', ''))
        tags_str = ", ".join([f"'{escape_tex_for_js_string(t)}'" for t in item.get('tags', [])])

        formulas_js += f"      {{\n"
        formulas_js += f"        id: '{item['id']}',\n"
        formulas_js += f"        title: '{escaped_title}',\n"
        formulas_js += f"        formula: '{escaped_formula}',\n"
        if escaped_shape:
            formulas_js += f"        shape: '{escaped_shape}',\n"
        formulas_js += f"        description: '{escaped_desc}',\n"
        formulas_js += f"        takeaway: '{escaped_takeaway}',\n"
        formulas_js += f"        tags: [{tags_str}]\n"
        formulas_js += f"      }}" + (",\n" if i < len(formulas) - 1 else "\n")
    formulas_js += "    ];\n\n"

    # 4. Insert FORMULAS and createFormulaSummary call
    if 'const FORMULAS = ' in html:
        html = re.sub(r'    const FORMULAS = \[[\s\S]*?\];\n\n', lambda m: formulas_js, html, count=1)
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"[+] Re-injected escaped FORMULAS for {slug}")
        return True

    # Find where createCommentSection is called
    call_idx = html.find('createCommentSection(')
    if call_idx < 0:
        print(f"[-] createCommentSection call not found in {slug}")
        return False
    
    end_call = html.find(');', call_idx)
    if end_call < 0:
        print(f"[-] end of createCommentSection call not found in {slug}")
        return False
    
    line_start = html.rfind('\n', 0, call_idx) + 1

    mount_call = (
        f"\n\n    const formulaMount = document.getElementById('mount-formula-summary');\n"
        f"    if (formulaMount) {{\n"
        f"      createFormulaSummary(formulaMount, {{\n"
        f"        title: 'Tổng Hợp Công Thức Cốt Lõi Cần Nhớ',\n"
        f"        badge: 'Cheat Sheet • {len(formulas)} Công Thức',\n"
        f"        formulas: FORMULAS,\n"
        f"        initiallyExpanded: true\n"
        f"      }});\n"
        f"    }}"
    )

    new_html = html[:line_start] + formulas_js + html[line_start:end_call+2] + mount_call + html[end_call+2:]

    with open(index_path, "w", encoding="utf-8") as f:
        f.write(new_html)

    print(f"[+] Successfully updated {slug} with {len(formulas)} formulas")
    return True

def main():
    print(f"Starting population of FormulaSummary for {len(LESSON_FORMULAS)} lessons...")
    success = 0
    for slug, formulas in sorted(LESSON_FORMULAS.items()):
        if process_lesson(slug, formulas):
            success += 1
    print(f"\nDone! Successfully processed {success}/{len(LESSON_FORMULAS)} lessons.")

if __name__ == '__main__':
    main()
