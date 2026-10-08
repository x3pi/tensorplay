/**
 * Conv2D & Thần Chú Im2col (Needle HW2)
 * Biến đổi phép chập tích chập không gian (spatial convolution) thành phép nhân ma trận GEMM.
 * Ảnh 3x3, Kernel 2x2, Stride=1, Pad=0 -> Output 2x2.
 * Ma trận Im2col kích thước 4x4 (4 vị trí trượt x 4 phần tử mỗi vùng đón nhận).
 */

export class LessonLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      // Ảnh 3x3 (mảng 9 phần tử)
      image: [
        1, 2, 0,
        0, 1, 1,
        2, 0, 1
      ],
      // Kernel 2x2 (mảng 4 phần tử)
      kernel: [
        1, 0,
        0, 1
      ],
      selectedPatch: 0 // 0, 1, 2, 3
    };
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
    const { image, kernel, selectedPatch } = this.state;
    // Kích thước: H=3, W=3, K=2, S=1, P=0
    // H_out = (3 - 2)/1 + 1 = 2
    // W_out = (3 - 2)/1 + 1 = 2
    const H = 3, W = 3, K = 2;
    const H_out = 2, W_out = 2;

    // Trích xuất 4 patch mở cuộn (Im2col matrix: 4 hàng, 4 cột)
    // Hàng i là 4 phần tử của patch thứ i
    const im2colMatrix = [];
    const directConvOutputs = [];

    for (let r = 0; r < H_out; r++) {
      for (let c = 0; c < W_out; c++) {
        const patch = [
          image[r * W + c],           // (r, c)
          image[r * W + (c + 1)],       // (r, c+1)
          image[(r + 1) * W + c],       // (r+1, c)
          image[(r + 1) * W + (c + 1)]  // (r+1, c+1)
        ];
        im2colMatrix.push(patch);

        // Tích vô hướng patch với kernel
        const val = patch.reduce((sum, p, i) => sum + p * kernel[i], 0);
        directConvOutputs.push(val);
      }
    }

    // Nhân ma trận Im2col (4x4) với Kernel vector (4x1)
    const gemmOutputs = im2colMatrix.map(row =>
      row.reduce((sum, val, idx) => sum + val * kernel[idx], 0)
    );

    // Kiểm tra tính tương đồng tuyệt đối giữa Conv2D truyền thống và GEMM
    const isGemmExactMatch = directConvOutputs.every((v, i) => v === gemmOutputs[i]);

    return {
      image,
      kernel,
      selectedPatch,
      im2colMatrix,
      directConvOutputs,
      gemmOutputs,
      isGemmExactMatch,
      formulaIm2colKaTeX: `A_{\\text{im2col}} = \\begin{bmatrix}
        ${im2colMatrix[0].join(" & ")} \\\\
        ${im2colMatrix[1].join(" & ")} \\\\
        ${im2colMatrix[2].join(" & ")} \\\\
        ${im2colMatrix[3].join(" & ")}
      \\end{bmatrix}, \\quad W = \\begin{bmatrix} ${kernel.join(" \\\\ ")} \\end{bmatrix}`,
      formulaOutKaTeX: `Y = A_{\\text{im2col}} \\cdot W = \\begin{bmatrix} ${gemmOutputs.join(" \\\\ ")} \\end{bmatrix} \\implies \\text{Reshape} \\begin{bmatrix} ${gemmOutputs[0]} & ${gemmOutputs[1]} \\\\ ${gemmOutputs[2]} & ${gemmOutputs[3]} \\end{bmatrix}`
    };
  }
}

export const PRESETS = [
  {
    id: "identity_diagonal",
    label: "Kernel Đường Chéo (Phát hiện góc)",
    state: {
      kernel: [1, 0, 0, 1]
    }
  },
  {
    id: "edge_horizontal",
    label: "Kernel Cạnh Ngang (Sobel Mini)",
    state: {
      kernel: [1, 1, -1, -1]
    }
  },
  {
    id: "box_blur",
    label: "Kernel Làm Mờ Đều (Mean Blur)",
    state: {
      kernel: [1, 1, 1, 1]
    }
  }
];
