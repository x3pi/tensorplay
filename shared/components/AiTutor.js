/**
 * TensorPlay AI Socratic Tutor Component (Gemini Flash)
 * Reusable, client-side AI study companion with local API key storage (localStorage).
 * Automatically context-aware of current lesson, step, and telemetry.
 */

import { renderInlineMath, renderMath } from '../katex-render.js';

const STORAGE_KEY = 'tensorplay:gemini_api_key';
const STORAGE_MODEL_KEY = 'tensorplay:gemini_model';
const STORAGE_SIZE_KEY = 'tensorplay:ai_drawer_size';
const STORAGE_DOCK_KEY = 'tensorplay:ai_dock_mode';
const STORAGE_DOCK_WIDTH_KEY = 'tensorplay:ai_dock_width';
const CHAT_HISTORY_PREFIX = 'tensorplay:chat_history:';
const DEFAULT_MODEL = 'gemini-flash-latest';

export function isValidGeminiKey(key) {
  if (!key || typeof key !== 'string') return false;
  const k = key.trim();
  // Loại bỏ chuỗi chỉ toàn số (mật khẩu/mã PIN do trình duyệt tự động điền đè)
  if (/^\d+$/.test(k)) return false;
  // Hỗ trợ cả chuẩn mới AQ.... (Google AI Studio 2025/2026) và chuẩn cũ AIzaSy...
  if (k.startsWith('AQ.') || k.startsWith('AIza')) {
    return k.length >= 10;
  }
  return k.length >= 25;
}

// Preset context-aware suggestion prompts per lesson topic
const LESSON_QUESTIONS = {
  bai_01: [
    'Tại sao trọng số âm lại đóng vai trò là "bằng chứng bác bỏ"?',
    'Công thức offset 1D index = r * N + c hoạt động thế nào trong C++?',
    'Phép nhân vô hướng (Dot Product) đo lường sự tương đồng ra sao?'
  ],
  bai_02: [
    'M = max(z) đây có phải là số lớn nhất của đầu ra không?',
    'Tại sao z > 88 lại gây tràn số (Overflow) trong chuẩn IEEE-754 float32?',
    'Chứng minh toán học: Tại sao trừ M không làm thay đổi xác suất Softmax?',
    'Làm thế nào để tránh chia cho 0 khi tính Cross-Entropy Loss?'
  ],
  bai_03: [
    'Tại sao vector sai số đạo hàm của Softmax Loss lại cực kỳ gọn: G = P - Iy?',
    'Ý nghĩa trực quan của gradient ma trận ∇W = X^T · G là gì?',
    'Tốc độ học (learning rate) quá lớn sẽ gây hiện tượng gì?'
  ],
  bai_04: [
    'Tại sao hàm kích hoạt phi tuyến (ReLU) lại là bắt buộc trong Deep Learning?',
    'Hiện tượng nơ-ron chết (Dead Neuron) xảy ra như thế nào khi z ≤ 0?',
    'Giải thích công thức dội ngược sai số qua tầng ẩn G1 = (G2 · W2^T) ⊙ M?'
  ],
  bai_05: [
    'Tại sao phép chuyển vị X^T lại tự động gom và cộng dồn Gradient của cả lô ảnh?',
    'Mini-batch B=2 khác gì so với huấn luyện từng ảnh đơn lẻ?',
    'Tại sao sai số trung bình lại cần chia cho B?'
  ],
  bai_06a: [
    'Tại sao hoán đổi thứ tự vòng lặp i-j-k lại thay đổi tốc độ chạy đến 10 lần?',
    'Bộ nhớ đệm CPU L1 Cache hoạt động theo nguyên lý Spatial Locality như thế nào?'
  ],
  bai_09: [
    'Internal Covariate Shift là gì và tại sao Batch Normalization giải quyết được?',
    'Tại sao cần tham số scale γ và shift β sau khi đã chuẩn hóa μ=0, σ=1?'
  ],
  bai_13: [
    'Tại sao trong Attention lại cần chia cho căn bậc hai của d_k (1/√d_k)?',
    'Mặt nạ nhân quả Causal Mask chặn nơ-ron nhìn trộm tương lai như thế nào?'
  ],
  bai_14: [
    'KV-Cache biến độ phức tạp tính toán từ O(N²) thành O(N) bằng cách nào?',
    'Tại sao KV-Cache lại là nút thắt cổ chai VRAM hàng đầu khi chạy LLM?'
  ],
  bai_15: [
    'FlashAttention tăng tốc bằng cách nào khi số phép tính FLOPs không hề giảm?',
    'Thuật toán Online Softmax cập nhật giá trị cực đại m và tổng e động ra sao?'
  ]
};

export class AiTutor {
  constructor() {
    const rawKey = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || '' : '';
    // Tự động dọn dẹp key hỏng do trình duyệt tự động điền mật khẩu/mã PIN (ví dụ chuỗi số "1235...")
    const isBogusAutofill = rawKey && !isValidGeminiKey(rawKey);
    if (isBogusAutofill) {
      console.warn('[AiTutor] Xóa key lỗi do browser autofill mật khẩu:', rawKey);
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      this.apiKey = '';
    } else {
      this.apiKey = rawKey;
    }

    let storedModel = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_MODEL_KEY) : null;
    if (!storedModel || storedModel === 'gemini-1.5-flash') {
      storedModel = DEFAULT_MODEL;
    }
    this.selectedModel = storedModel;
    this.availableModels = [];
    this.isOpen = false;
    this.isSettingsOpen = !this.apiKey;

    // Chế độ Ghép Cột bên phải (Docked Sidebar) đẩy bài học, không bao giờ che công thức
    const storedDock = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_DOCK_KEY) : null;
    this.isDocked = storedDock === null ? true : storedDock === 'true';

    let savedDockW = 440;
    try {
      if (typeof localStorage !== 'undefined') {
        const parsed = parseInt(localStorage.getItem(STORAGE_DOCK_WIDTH_KEY) || '440', 10);
        if (!isNaN(parsed) && parsed >= 320) savedDockW = parsed;
      }
    } catch {}
    this.dockWidth = savedDockW;

    this.isMaximized = false;
    this.savedSizeBeforeMax = null;
    this.savedDockWidthBeforeMax = null;
    this.messages = [];
    this.isLoading = false;

    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;
    this.injectStyles();
    this.renderWidget();
    this.restoreChatHistory();
  }

  injectStyles() {
    if (document.getElementById('tp-ai-tutor-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-ai-tutor-styles';
    style.textContent = `
      .tp-ai-launcher {
        position: fixed;
        bottom: 22px;
        right: 22px;
        z-index: 9999;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #0284c7 0%, #8b5cf6 100%);
        color: #ffffff;
        font-family: var(--font-sans, -apple-system, sans-serif);
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 24px rgba(2, 132, 199, 0.4), 0 0 16px rgba(139, 92, 246, 0.3);
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }
      .tp-ai-launcher:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 12px 30px rgba(2, 132, 199, 0.55), 0 0 20px rgba(139, 92, 246, 0.45);
      }
      .tp-ai-launcher-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #10b981;
        box-shadow: 0 0 8px #10b981;
      }
      .tp-ai-launcher-dot.inactive {
        background-color: #f59e0b;
        box-shadow: 0 0 8px #f59e0b;
      }

      .tp-ai-drawer {
        position: fixed;
        bottom: 78px;
        right: 22px;
        z-index: 9999;
        width: 480px;
        min-width: 340px;
        max-width: calc(100vw - 32px);
        height: 640px;
        min-height: 380px;
        max-height: calc(100vh - 96px);
        background: rgba(13, 17, 25, 0.96);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 18px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.75), 0 0 25px rgba(6, 182, 212, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: tpFadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: var(--font-sans, -apple-system, sans-serif);
        transition: width 0.18s ease, height 0.18s ease;
      }
      .tp-ai-drawer.open {
        display: flex;
      }
      .tp-ai-drawer.resizing {
        transition: none !important;
        user-select: none;
      }
      .tp-ai-drawer.maximized {
        width: min(920px, calc(100vw - 32px)) !important;
        height: calc(100vh - 96px) !important;
        border-radius: 18px !important;
      }

      /* Docked Side-Panel: Ghim cạnh phải, đẩy bài học sang trái (100% Không che nội dung) */
      .tp-ai-drawer.docked {
        top: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-height: 100vh !important;
        width: var(--ai-dock-width, 440px) !important;
        border-radius: 0 !important;
        border-left: 1px solid rgba(255, 255, 255, 0.14) !important;
        border-top: none !important;
        border-right: none !important;
        border-bottom: none !important;
        box-shadow: -8px 0 35px rgba(0, 0, 0, 0.7), 0 0 20px rgba(6, 182, 212, 0.08) !important;
        animation: tpSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .tp-ai-drawer.docked .tp-ai-resize-corner,
      .tp-ai-drawer.docked .tp-ai-resize-edge-top {
        display: none !important;
      }
      .tp-ai-drawer.docked .tp-ai-resize-edge-left {
        top: 0 !important;
        width: 8px !important;
        cursor: col-resize !important;
        background: transparent;
      }
      .tp-ai-drawer.docked .tp-ai-resize-edge-left:hover,
      .tp-ai-drawer.docked.resizing .tp-ai-resize-edge-left {
        background: rgba(6, 182, 212, 0.5) !important;
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.7) !important;
      }
      body.ai-tutor-docked .tp-ai-launcher {
        display: none !important;
      }
      @keyframes tpSlideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }

      /* Resize Handles (Co giãn giao diện) */
      .tp-ai-resize-corner {
        position: absolute;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        cursor: nwse-resize;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.35);
        border-top-left-radius: 18px;
        transition: all 0.15s ease;
        touch-action: none;
      }
      .tp-ai-resize-corner:hover {
        color: var(--color-info, #06b6d4);
        background: rgba(6, 182, 212, 0.2);
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
      }
      .tp-ai-resize-edge-top {
        position: absolute;
        top: 0;
        left: 24px;
        right: 0;
        height: 6px;
        cursor: ns-resize;
        z-index: 99;
        touch-action: none;
      }
      .tp-ai-resize-edge-top:hover {
        background: linear-gradient(to bottom, rgba(6, 182, 212, 0.4), transparent);
      }
      .tp-ai-resize-edge-left {
        position: absolute;
        top: 24px;
        left: 0;
        bottom: 0;
        width: 6px;
        cursor: ew-resize;
        z-index: 99;
        touch-action: none;
      }
      .tp-ai-resize-edge-left:hover {
        background: linear-gradient(to right, rgba(6, 182, 212, 0.4), transparent);
      }

      /* Thanh cuộn siêu gọn & tinh tế (Sleek Slim Scrollbars) */
      .tp-ai-drawer *::-webkit-scrollbar,
      .tp-ai-messages::-webkit-scrollbar,
      .tp-ai-suggestions::-webkit-scrollbar,
      .tp-ai-textarea::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .tp-ai-drawer *::-webkit-scrollbar-track,
      .tp-ai-messages::-webkit-scrollbar-track,
      .tp-ai-suggestions::-webkit-scrollbar-track,
      .tp-ai-textarea::-webkit-scrollbar-track {
        background: rgba(10, 15, 26, 0.3);
        border-radius: 9999px;
      }
      .tp-ai-drawer *::-webkit-scrollbar-thumb,
      .tp-ai-messages::-webkit-scrollbar-thumb,
      .tp-ai-suggestions::-webkit-scrollbar-thumb,
      .tp-ai-textarea::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.25);
        border-radius: 9999px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .tp-ai-drawer *::-webkit-scrollbar-thumb:hover,
      .tp-ai-messages::-webkit-scrollbar-thumb:hover,
      .tp-ai-suggestions::-webkit-scrollbar-thumb:hover,
      .tp-ai-textarea::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.6);
      }
      .tp-ai-messages,
      .tp-ai-suggestions,
      .tp-ai-textarea {
        scrollbar-width: thin;
        scrollbar-color: rgba(148, 163, 184, 0.28) rgba(10, 15, 26, 0.3);
      }

      @keyframes tpFadeInUp {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .tp-ai-header {
        padding: 12px 16px;
        background: rgba(24, 32, 48, 0.85);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .tp-ai-header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
        font-weight: 700;
        color: #ffffff;
      }
      .tp-ai-header-badge {
        font-size: 0.68rem;
        padding: 2px 7px;
        border-radius: 9999px;
        background: rgba(6, 182, 212, 0.15);
        color: var(--color-info, #06b6d4);
        border: 1px solid rgba(6, 182, 212, 0.3);
        font-family: var(--font-mono, monospace);
        font-weight: 600;
      }
      .tp-ai-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tp-ai-btn-icon {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-muted, #94a3b8);
        border-radius: 6px;
        padding: 5px 8px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .tp-ai-btn-icon:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.08);
      }
      .tp-ai-btn-icon.active {
        color: var(--color-info, #06b6d4) !important;
        background: rgba(6, 182, 212, 0.15) !important;
        border-color: rgba(6, 182, 212, 0.4) !important;
      }

      .tp-ai-settings-card {
        padding: 16px;
        background: rgba(20, 26, 40, 0.95);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        gap: 10px;
        animation: tpFadeIn 0.2s ease;
      }
      .tp-ai-settings-title {
        font-size: 0.85rem;
        font-weight: 700;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tp-ai-settings-desc {
        font-size: 0.8125rem;
        color: var(--text-muted, #94a3b8);
        line-height: 1.5;
      }
      .tp-ai-key-input-row {
        display: flex;
        gap: 8px;
      }
      .tp-ai-key-input {
        flex: 1;
        background: #090e17;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 8px;
        color: #ffffff;
        font-family: var(--font-mono, monospace);
        font-size: 0.85rem;
        padding: 8px 12px;
        outline: none;
      }
      .tp-ai-key-input:focus {
        border-color: var(--color-info, #06b6d4);
      }
      .tp-ai-key-input.masked {
        -webkit-text-security: disc;
        text-security: disc;
        letter-spacing: 2px;
      }

      .tp-ai-messages {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
      }
      .tp-ai-msg {
        max-width: 90%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 0.95rem;
        line-height: 1.65;
        word-break: break-word;
      }
      .tp-ai-msg.user {
        align-self: flex-end;
        background: linear-gradient(135deg, #0284c7, #0369a1);
        color: #ffffff;
        border-bottom-right-radius: 3px;
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
      }
      .tp-ai-msg.bot {
        align-self: flex-start;
        background: rgba(22, 28, 44, 0.9);
        color: #f1f5f9;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom-left-radius: 3px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      }
      .tp-ai-history-notice {
        text-align: center;
        margin: 4px 0 10px 0;
        user-select: none;
      }
      .tp-ai-history-notice span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        color: #38bdf8;
        background: rgba(6, 182, 212, 0.1);
        border: 1px dashed rgba(6, 182, 212, 0.35);
        padding: 3px 12px;
        border-radius: 9999px;
      }

      /* KaTeX Mathematical Typography Enhancements in AI Chat */
      .tp-ai-msg .katex {
        font-size: 1.18em !important;
        color: #f8fafc !important;
        line-height: 1.25 !important;
      }
      .tp-ai-msg .tp-ai-math-inline {
        display: inline-block;
        padding: 1px 5px;
        margin: 0 2px;
        background: rgba(6, 182, 212, 0.08);
        border-radius: 4px;
        vertical-align: middle;
        border-bottom: 1.5px solid rgba(6, 182, 212, 0.3);
      }
      .tp-ai-msg .tp-ai-math-display {
        margin: 12px 0 !important;
        padding: 12px 16px !important;
        background: rgba(10, 15, 26, 0.85) !important;
        border: 1px solid rgba(6, 182, 212, 0.22) !important;
        border-left: 4px solid var(--color-info, #06b6d4) !important;
        border-radius: 10px !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        text-align: center !important;
        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        scrollbar-width: thin;
      }
      .tp-ai-msg .tp-ai-math-display .katex-display {
        margin: 0 !important;
        padding: 2px 0 !important;
        font-size: 1.15em !important;
      }
      .tp-ai-msg .tp-ai-math-display .katex-display > .katex {
        font-size: 1em !important;
        color: #ffffff !important;
      }
      .tp-ai-msg .tp-ai-math-inline .katex {
        font-size: 1.12em !important;
        color: #ffffff !important;
      }
      .tp-ai-msg .katex .mbin, 
      .tp-ai-msg .katex .mrel {
        color: #38bdf8 !important; /* Crisp cyan operators */
      }
      .tp-ai-msg .katex .frac-line {
        border-bottom-width: 1.5px !important;
        border-color: rgba(255, 255, 255, 0.85) !important;
      }
      .tp-ai-msg .katex .mtable {
        margin: 0 auto;
      }

      /* Headings & list formatting in AI responses */
      .tp-ai-msg .tp-ai-h3 {
        font-size: 1.05rem;
        font-weight: 700;
        color: #ffffff;
        margin: 12px 0 6px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 4px;
      }
      .tp-ai-msg .tp-ai-h4 {
        font-size: 0.98rem;
        font-weight: 600;
        color: var(--color-info, #06b6d4);
        margin: 10px 0 4px 0;
      }
      .tp-ai-msg .tp-ai-list-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin: 4px 0;
      }
      .tp-ai-msg .tp-ai-bullet {
        color: var(--color-info, #06b6d4);
        font-weight: bold;
      }
      .tp-ai-msg .tp-ai-num {
        color: #38bdf8;
        font-weight: 600;
        font-family: var(--font-mono, monospace);
        min-width: 18px;
      }
      .tp-ai-msg .tp-ai-hr {
        border: none;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        margin: 10px 0;
      }
      .tp-ai-msg blockquote {
        border-left: 3px solid var(--color-info, #06b6d4);
        padding-left: 10px;
        margin: 8px 0;
        color: var(--text-muted, #94a3b8);
        font-style: italic;
      }
      .tp-ai-msg code {
        background: rgba(0, 0, 0, 0.4);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: var(--font-mono, monospace);
        font-size: 0.85em;
        color: #38bdf8;
      }
      .tp-ai-msg pre {
        background: #090e17;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 10px;
        overflow-x: auto;
        font-family: var(--font-mono, monospace);
        font-size: 0.85rem;
        margin: 8px 0;
      }

      .tp-ai-suggestions {
        padding: 8px 12px;
        background: rgba(16, 22, 34, 0.8);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-height: 110px;
        overflow-y: auto;
      }
      .tp-ai-chip {
        background: rgba(6, 182, 212, 0.1);
        border: 1px solid rgba(6, 182, 212, 0.25);
        color: var(--color-info, #06b6d4);
        font-size: 0.775rem;
        padding: 4px 10px;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.15s ease;
        line-height: 1.35;
      }
      .tp-ai-chip:hover {
        background: rgba(6, 182, 212, 0.22);
        border-color: var(--color-info, #06b6d4);
        transform: translateY(-1px);
      }

      .tp-ai-input-area {
        padding: 10px 12px;
        background: rgba(24, 32, 48, 0.85);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 8px;
        align-items: flex-end;
      }
      .tp-ai-textarea {
        flex: 1;
        background: #090e17;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 8px;
        color: #ffffff;
        font-family: inherit;
        font-size: 0.95rem;
        padding: 8px 12px;
        resize: none;
        min-height: 38px;
        max-height: 120px;
        outline: none;
      }
      .tp-ai-textarea:focus {
        border-color: var(--color-info, #06b6d4);
      }
      .tp-ai-btn-send {
        background: linear-gradient(135deg, #0284c7, var(--color-info, #06b6d4));
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
        height: 38px;
      }
      .tp-ai-btn-send:hover {
        filter: brightness(1.15);
      }
      .tp-ai-btn-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Mobile App-Style Full Sheet / Drawer (< 640px) */
      @media (max-width: 640px) {
        .tp-ai-launcher {
          bottom: 14px !important;
          right: 14px !important;
          padding: 8px 14px !important;
          font-size: 0.82rem !important;
          box-shadow: 0 4px 16px rgba(2, 132, 199, 0.4) !important;
        }

        .tp-ai-drawer {
          position: fixed !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          top: auto !important;
          width: 100vw !important;
          max-width: 100vw !important;
          height: 85vh !important;
          height: 85dvh !important;
          max-height: 85vh !important;
          max-height: 85dvh !important;
          border-radius: 20px 20px 0 0 !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: none !important;
          border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.85) !important;
        }

        .tp-ai-drawer.docked {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          max-height: 100vh !important;
          max-height: 100dvh !important;
          border-radius: 0 !important;
        }

        .tp-ai-drawer.maximized {
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          max-height: 100vh !important;
          max-height: 100dvh !important;
          border-radius: 0 !important;
        }

        .tp-ai-resize-corner,
        .tp-ai-resize-edge-top,
        .tp-ai-resize-edge-left {
          display: none !important;
        }

        #btn-toggle-dock-ai {
          display: none !important;
        }

        .tp-ai-header {
          padding: 8px 12px !important;
        }

        .tp-ai-header-title span:first-child {
          font-size: 0.88rem !important;
        }

        .tp-ai-header-actions {
          gap: 4px !important;
        }

        .tp-ai-btn-icon {
          padding: 4px 6px !important;
          font-size: 0.75rem !important;
        }

        .tp-ai-body {
          padding: 10px 12px !important;
        }

        .tp-ai-msg {
          max-width: 95% !important;
          font-size: 0.88rem !important;
          padding: 8px 11px !important;
        }

        .tp-ai-input-bar {
          padding: 8px 10px !important;
        }

        .tp-ai-input {
          font-size: 0.88rem !important;
          padding: 8px 10px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  renderWidget() {
    // 1. Floating Launcher Button
    const launcher = document.createElement('div');
    launcher.id = 'tp-ai-launcher';
    launcher.className = 'tp-ai-launcher';
    launcher.innerHTML = `
      <span class="tp-ai-launcher-dot ${this.apiKey ? '' : 'inactive'}"></span>
      <span>⚡ Hỏi Gia Sư AI</span>
    `;
    launcher.addEventListener('click', () => this.toggleDrawer());
    document.body.appendChild(launcher);

    // 2. Chat Drawer
    const drawer = document.createElement('div');
    drawer.id = 'tp-ai-drawer';
    drawer.className = `tp-ai-drawer ${this.isDocked ? 'docked' : ''}`;
    if (this.isDocked && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--ai-dock-width', `${this.dockWidth}px`);
      drawer.style.width = `${this.dockWidth}px`;
    }
    drawer.innerHTML = `
      <!-- Resize Handles (Co giãn góc & mép) -->
      <div class="tp-ai-resize-corner" id="tp-ai-resize-corner" title="Kéo góc để co giãn (Rộng & Cao)">
        <svg viewBox="0 0 10 10" width="10" height="10">
          <path d="M1 9 L9 1 M1 5 L5 1 M5 9 L9 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="tp-ai-resize-edge-top" id="tp-ai-resize-top" title="Kéo để co giãn chiều cao"></div>
      <div class="tp-ai-resize-edge-left" id="tp-ai-resize-left" title="Kéo để co giãn chiều rộng"></div>

      <div class="tp-ai-header">
        <div class="tp-ai-header-title">
          <span>🤖 Gia Sư AI Socratic</span>
          <span class="tp-ai-header-badge">Gemini Flash</span>
        </div>
        <div class="tp-ai-header-actions">
          <button class="tp-ai-btn-icon ${this.isDocked ? 'active' : ''}" id="btn-toggle-dock-ai" title="${this.isDocked ? 'Chuyển sang Cửa sổ nổi (Floating)' : 'Ghim vào Cột bên phải (Đẩy bài học không che)'}">${this.isDocked ? '🪟 Nổi' : '📌 Ghim'}</button>
          <button class="tp-ai-btn-icon" id="btn-maximize-ai-drawer" title="${this.isDocked ? 'Mở rộng 50% màn hình' : 'Phóng to / Thu nhỏ (Co giãn)'}">⛶</button>
          <button class="tp-ai-btn-icon" id="btn-toggle-ai-settings" title="Cài đặt API Key">⚙️ Key</button>
          <button class="tp-ai-btn-icon" id="btn-clear-ai-chat" title="Xóa lịch sử chat">↺ Xóa</button>
          <button class="tp-ai-btn-icon" id="btn-close-ai-drawer" title="Đóng Gia Sư AI">✕</button>
        </div>
      </div>

      <!-- Settings Panel (API Key Management) -->
      <div class="tp-ai-settings-card" id="tp-ai-settings-card" style="display: ${this.isSettingsOpen ? 'flex' : 'none'};">
        <div class="tp-ai-settings-title">
          <span>🔑 Cài Đặt Gemini API Key Miễn Phí</span>
        </div>
        <div class="tp-ai-settings-desc">
          Lấy API Key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="color: var(--color-info, #06b6d4); text-decoration: underline;">Google AI Studio</a>.
          Key được <strong>lưu 100% trên trình duyệt của bạn (localStorage)</strong>, không lưu ở bất kỳ máy chủ nào.
        </div>
        <div class="tp-ai-key-input-row">
          <input 
            type="text" 
            id="input-gemini-key" 
            name="tensorplay_gemini_token_noautofill"
            class="tp-ai-key-input masked" 
            placeholder="Dán API Key (AIzaSy...)" 
            value="${this.apiKey}"
            autocomplete="off" 
            autocorrect="off" 
            autocapitalize="off" 
            spellcheck="false" 
            data-lpignore="true" 
            data-1p-ignore="true" 
            data-form-type="other"
          >
          <button class="tp-ai-btn-icon" id="btn-toggle-key-visibility" title="Hiện/Ẩn key">👁️</button>
          <button class="tp-ai-btn-send" id="btn-save-gemini-key" style="height: auto; padding: 6px 12px; font-size: 0.85rem;">Lưu</button>
          <button class="tp-ai-btn-icon" id="btn-delete-gemini-key" title="Xóa Key khỏi trình duyệt" style="color: var(--color-danger, #ef4444);">🗑️ Xóa</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px;">
          <label for="tp-ai-model-select" style="font-size: 0.775rem; color: var(--text-muted, #94a3b8); white-space: nowrap;">Model:</label>
          <select id="tp-ai-model-select" class="tp-ai-key-input" style="padding: 4px 8px; font-size: 0.775rem; color: #38bdf8; cursor: pointer; flex: 1;">
            <option value="gemini-2.0-flash" ${this.selectedModel === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (Mới nhất, siêu nhanh)</option>
            <option value="gemini-2.0-flash-lite" ${this.selectedModel === 'gemini-2.0-flash-lite' ? 'selected' : ''}>gemini-2.0-flash-lite (Nhẹ, hạn mức cao)</option>
            <option value="gemini-1.5-flash-latest" ${this.selectedModel === 'gemini-1.5-flash-latest' ? 'selected' : ''}>gemini-1.5-flash-latest (Khuyên dùng)</option>
            <option value="gemini-1.5-flash-8b" ${this.selectedModel === 'gemini-1.5-flash-8b' ? 'selected' : ''}>gemini-1.5-flash-8b (Bản nhẹ, ít quá tải)</option>
            <option value="gemini-1.5-flash" ${this.selectedModel === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash</option>
            <option value="gemini-1.5-pro" ${this.selectedModel === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro (Suy luận sâu)</option>
          </select>
          <button class="tp-ai-btn-icon" id="btn-discover-models" title="Tự động dò danh sách Model hỗ trợ từ Google AI Studio">🔄 Dò Model</button>
        </div>
        <div id="tp-ai-key-status" style="font-size: 0.75rem; color: ${this.apiKey ? 'var(--color-positive, #10b981)' : 'var(--color-warning, #f59e0b)'}; font-weight: 600;">
          ${this.apiKey ? `✓ Đang kết nối Key: ${this.apiKey.slice(0, 6)}...${this.apiKey.slice(-4)} (Model: ${this.selectedModel})` : '⚠️ Chưa cài đặt Key (Vui lòng dán Key để bắt đầu)'}
        </div>
      </div>

      <!-- Chat Messages List -->
      <div class="tp-ai-messages" id="tp-ai-messages"></div>

      <!-- Quick Suggestion Chips -->
      <div class="tp-ai-suggestions" id="tp-ai-suggestions"></div>

      <!-- Input Area -->
      <div class="tp-ai-input-area">
        <textarea id="tp-ai-input" class="tp-ai-textarea" rows="1" placeholder="Hỏi Gia sư AI (ví dụ: M = max(z) có phải số lớn nhất đầu ra?)..."></textarea>
        <button id="btn-send-ai-msg" class="tp-ai-btn-send" title="Gửi câu hỏi">Gửi ▶</button>
      </div>
    `;
    document.body.appendChild(drawer);

    this.bindEvents();
    this.renderSuggestions();
    if (this.apiKey) {
      this.fetchAvailableModels(false);
    }
  }

  bindEvents() {
    const drawer = document.getElementById('tp-ai-drawer');
    const closeBtn = document.getElementById('btn-close-ai-drawer');
    const clearBtn = document.getElementById('btn-clear-ai-chat');
    const maxBtn = document.getElementById('btn-maximize-ai-drawer');
    const settingsToggleBtn = document.getElementById('btn-toggle-ai-settings');
    const saveKeyBtn = document.getElementById('btn-save-gemini-key');
    const deleteKeyBtn = document.getElementById('btn-delete-gemini-key');
    const toggleEyeBtn = document.getElementById('btn-toggle-key-visibility');
    const keyInput = document.getElementById('input-gemini-key');
    const modelSelect = document.getElementById('tp-ai-model-select');
    const discoverBtn = document.getElementById('btn-discover-models');
    const sendBtn = document.getElementById('btn-send-ai-msg');
    const textInput = document.getElementById('tp-ai-input');

    const dockBtn = document.getElementById('btn-toggle-dock-ai');

    closeBtn?.addEventListener('click', () => this.toggleDrawer(false));
    clearBtn?.addEventListener('click', () => {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        const hasHistory = this.messages.some(m => m.role === 'user');
        if (hasHistory) {
          const ok = window.confirm('Bạn có muốn xóa toàn bộ lịch sử hỏi đáp của bài học này?');
          if (!ok) return;
        }
      }
      this.clearChat();
    });
    maxBtn?.addEventListener('click', () => this.toggleMaximize());
    dockBtn?.addEventListener('click', () => this.toggleDockMode());
    
    settingsToggleBtn?.addEventListener('click', () => {
      this.isSettingsOpen = !this.isSettingsOpen;
      const card = document.getElementById('tp-ai-settings-card');
      if (card) card.style.display = this.isSettingsOpen ? 'flex' : 'none';
      if (this.isSettingsOpen && this.apiKey) {
        this.fetchAvailableModels(false);
      }
    });

    toggleEyeBtn?.addEventListener('click', () => {
      if (keyInput) {
        keyInput.classList.toggle('masked');
        const isMasked = keyInput.classList.contains('masked');
        toggleEyeBtn.textContent = isMasked ? '👁️' : '🔒';
        toggleEyeBtn.title = isMasked ? 'Hiện API Key' : 'Ẩn API Key';
      }
    });

    deleteKeyBtn?.addEventListener('click', () => {
      this.apiKey = '';
      if (keyInput) keyInput.value = '';
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      const statusEl = document.getElementById('tp-ai-key-status');
      const dot = document.querySelector('.tp-ai-launcher-dot');
      if (statusEl) {
        statusEl.textContent = '⚠️ Đã xóa Key khỏi trình duyệt';
        statusEl.style.color = 'var(--color-warning, #f59e0b)';
      }
      if (dot) dot.classList.add('inactive');
    });

    modelSelect?.addEventListener('change', (e) => {
      const selected = e.target.value;
      this.selectedModel = selected;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_MODEL_KEY, selected);
      }
      this.updateModelBadge(selected);
      const statusEl = document.getElementById('tp-ai-key-status');
      if (statusEl && this.apiKey) {
        statusEl.textContent = `✓ Đang kết nối Model: ${selected}`;
      }
    });

    discoverBtn?.addEventListener('click', () => {
      this.fetchAvailableModels(true);
    });

    saveKeyBtn?.addEventListener('click', async () => {
      if (!keyInput) return;
      const val = keyInput.value.trim();
      const statusEl = document.getElementById('tp-ai-key-status');
      const dot = document.querySelector('.tp-ai-launcher-dot');

      if (!val) {
        this.apiKey = '';
        if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        if (statusEl) {
          statusEl.textContent = '⚠️ Đã xóa Key';
          statusEl.style.color = 'var(--color-warning, #f59e0b)';
        }
        if (dot) dot.classList.add('inactive');
        return;
      }

      // Kiểm tra định dạng API Key chuẩn Google AI Studio (hỗ trợ cả AQ... và AIzaSy...)
      if (!isValidGeminiKey(val)) {
        if (statusEl) {
          statusEl.innerHTML = '❌ <strong>Key không đúng định dạng Google AI Studio!</strong><br>Key hợp lệ thường bắt đầu bằng <code>AQ...</code> hoặc <code>AIzaSy...</code>. Có thể trình duyệt vừa tự động điền mật khẩu/PIN cá nhân của bạn. Vui lòng copy chính xác Key từ Google AI Studio!';
          statusEl.style.color = 'var(--color-danger, #ef4444)';
        }
        return;
      }

      this.apiKey = val;
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, val);

      const maskedHint = val.slice(0, 6) + '...' + val.slice(-4);
      if (statusEl) {
        statusEl.textContent = `⏳ Đang kiểm tra Key (${maskedHint}) & dò model...`;
        statusEl.style.color = 'var(--color-info, #06b6d4)';
      }
      const discovered = await this.fetchAvailableModels(true);
      if (statusEl) {
        statusEl.textContent = `✓ Đã lưu Key: ${maskedHint} (Đang dùng: ${this.selectedModel})`;
        statusEl.style.color = 'var(--color-positive, #10b981)';
      }
      if (dot) dot.classList.remove('inactive');
      setTimeout(() => {
        this.isSettingsOpen = false;
        const card = document.getElementById('tp-ai-settings-card');
        if (card) card.style.display = 'none';
      }, 1500);
    });

    sendBtn?.addEventListener('click', () => this.handleSend());
    textInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    if (drawer) {
      this.setupResizing(drawer);
    }
  }

  toggleDockMode(forceState) {
    if (typeof document === 'undefined') return;
    this.isDocked = forceState !== undefined ? forceState : !this.isDocked;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_DOCK_KEY, this.isDocked ? 'true' : 'false');
    }

    const drawer = document.getElementById('tp-ai-drawer');
    const dockBtn = document.getElementById('btn-toggle-dock-ai');
    const maxBtn = document.getElementById('btn-maximize-ai-drawer');
    if (!drawer) return;

    if (this.isDocked) {
      drawer.classList.add('docked');
      drawer.classList.remove('maximized');
      this.isMaximized = false;
      if (maxBtn) {
        maxBtn.innerHTML = '⛶';
        maxBtn.title = 'Mở rộng 50% màn hình';
      }
      document.documentElement.style.setProperty('--ai-dock-width', `${this.dockWidth}px`);
      drawer.style.width = `${this.dockWidth}px`;
      drawer.style.height = '';
      drawer.style.top = '';
      drawer.style.bottom = '';
      drawer.style.right = '';

      if (this.isOpen) {
        document.body.classList.add('ai-tutor-docked');
      }
      if (dockBtn) {
        dockBtn.innerHTML = '🪟 Nổi';
        dockBtn.title = 'Chuyển sang Cửa sổ nổi (Floating)';
        dockBtn.classList.add('active');
      }
    } else {
      drawer.classList.remove('docked');
      document.body.classList.remove('ai-tutor-docked');
      this.isMaximized = false;
      if (maxBtn) {
        maxBtn.innerHTML = '⛶';
        maxBtn.title = 'Phóng to cửa sổ (Co giãn)';
      }

      // Khôi phục kích thước Floating đã lưu hoặc kích thước mặc định
      let floatW = 480;
      let floatH = 640;
      try {
        const saved = localStorage.getItem(STORAGE_SIZE_KEY);
        if (saved) {
          const { w, h } = JSON.parse(saved);
          if (w && h) {
            floatW = w;
            floatH = h;
          }
        }
      } catch {}

      const maxW = Math.min(1000, window.innerWidth - 32);
      const maxH = window.innerHeight - 90;
      drawer.style.width = `${Math.min(Math.max(340, floatW), maxW)}px`;
      drawer.style.height = `${Math.min(Math.max(380, floatH), maxH)}px`;

      if (dockBtn) {
        dockBtn.innerHTML = '📌 Ghim';
        dockBtn.title = 'Ghim vào Cột bên phải (Không che bài học)';
        dockBtn.classList.remove('active');
      }
    }
  }

  toggleMaximize() {
    if (typeof document === 'undefined') return;
    const drawer = document.getElementById('tp-ai-drawer');
    const maxBtn = document.getElementById('btn-maximize-ai-drawer');
    if (!drawer) return;

    if (this.isDocked) {
      this.isMaximized = !this.isMaximized;
      if (maxBtn) {
        maxBtn.innerHTML = this.isMaximized ? '🗗' : '⛶';
        maxBtn.title = this.isMaximized ? 'Thu nhỏ về độ rộng chuẩn' : 'Mở rộng 50% màn hình';
      }
      if (this.isMaximized) {
        this.savedDockWidthBeforeMax = this.dockWidth;
        const wideW = Math.round(Math.min(900, Math.max(500, window.innerWidth * 0.48)));
        this.dockWidth = wideW;
      } else {
        this.dockWidth = this.savedDockWidthBeforeMax || 440;
      }
      drawer.style.width = `${this.dockWidth}px`;
      document.documentElement.style.setProperty('--ai-dock-width', `${this.dockWidth}px`);
      try {
        localStorage.setItem(STORAGE_DOCK_WIDTH_KEY, this.dockWidth.toString());
      } catch {}
      return;
    }

    this.isMaximized = !this.isMaximized;
    drawer.classList.toggle('maximized', this.isMaximized);
    if (maxBtn) {
      maxBtn.innerHTML = this.isMaximized ? '🗗' : '⛶';
      maxBtn.title = this.isMaximized ? 'Thu nhỏ về kích thước cũ' : 'Phóng to cửa sổ (Co giãn)';
    }
    if (this.isMaximized) {
      this.savedSizeBeforeMax = { w: drawer.style.width, h: drawer.style.height };
      drawer.style.width = '';
      drawer.style.height = '';
    } else if (this.savedSizeBeforeMax) {
      drawer.style.width = this.savedSizeBeforeMax.w;
      drawer.style.height = this.savedSizeBeforeMax.h;
    }
  }

  setupResizing(drawer) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const corner = document.getElementById('tp-ai-resize-corner');
    const edgeTop = document.getElementById('tp-ai-resize-top');
    const edgeLeft = document.getElementById('tp-ai-resize-left');
    if (!corner || !edgeTop || !edgeLeft) return;

    if (this.isDocked) {
      document.documentElement.style.setProperty('--ai-dock-width', `${this.dockWidth}px`);
      drawer.style.width = `${this.dockWidth}px`;
    } else {
      // Restore saved custom dimensions
      try {
        const saved = localStorage.getItem(STORAGE_SIZE_KEY);
        if (saved) {
          const { w, h } = JSON.parse(saved);
          if (w && h) {
            const maxW = Math.min(1000, window.innerWidth - 32);
            const maxH = window.innerHeight - 96;
            drawer.style.width = `${Math.min(Math.max(340, w), maxW)}px`;
            drawer.style.height = `${Math.min(Math.max(380, h), maxH)}px`;
          }
        }
      } catch {}
    }

    let isResizing = false;
    let resizeType = null;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;

    const onPointerDown = (e, type) => {
      e.preventDefault();
      isResizing = true;
      resizeType = type;
      startX = e.clientX;
      startY = e.clientY;
      startW = drawer.offsetWidth;
      startH = drawer.offsetHeight;

      if (this.isMaximized) {
        this.isMaximized = false;
        drawer.classList.remove('maximized');
        const maxBtn = document.getElementById('btn-maximize-ai-drawer');
        if (maxBtn) {
          maxBtn.innerHTML = '⛶';
          maxBtn.title = 'Phóng to cửa sổ (Co giãn)';
        }
      }

      drawer.classList.add('resizing');
      document.body.classList.add('ai-resizing');
      document.body.style.userSelect = 'none';

      const onPointerMove = (ev) => {
        if (!isResizing) return;
        const deltaX = startX - ev.clientX; // Dragging left increases width
        const deltaY = startY - ev.clientY; // Dragging up increases height

        if (this.isDocked) {
          const minDockW = 320;
          const maxDockW = Math.min(850, window.innerWidth - 380);
          const newDockW = Math.max(minDockW, Math.min(maxDockW, startW + deltaX));
          this.dockWidth = newDockW;
          drawer.style.width = `${newDockW}px`;
          document.documentElement.style.setProperty('--ai-dock-width', `${newDockW}px`);
          try {
            localStorage.setItem(STORAGE_DOCK_WIDTH_KEY, newDockW.toString());
          } catch {}
          return;
        }

        const maxW = Math.min(1000, window.innerWidth - 32);
        const minW = Math.min(340, window.innerWidth - 32);
        const maxH = window.innerHeight - 90;
        const minH = 380;

        let newW = startW;
        let newH = startH;

        if (resizeType === 'corner' || resizeType === 'left') {
          newW = Math.max(minW, Math.min(maxW, startW + deltaX));
          drawer.style.width = `${newW}px`;
        }
        if (resizeType === 'corner' || resizeType === 'top') {
          newH = Math.max(minH, Math.min(maxH, startH + deltaY));
          drawer.style.height = `${newH}px`;
        }

        try {
          localStorage.setItem(STORAGE_SIZE_KEY, JSON.stringify({ w: newW, h: newH }));
        } catch {}
      };

      const onPointerUp = () => {
        if (!isResizing) return;
        isResizing = false;
        drawer.classList.remove('resizing');
        document.body.classList.remove('ai-resizing');
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    };

    corner.addEventListener('pointerdown', (e) => onPointerDown(e, 'corner'));
    edgeTop.addEventListener('pointerdown', (e) => onPointerDown(e, 'top'));
    edgeLeft.addEventListener('pointerdown', (e) => onPointerDown(e, 'left'));
  }

  toggleDrawer(forceState) {
    const drawer = document.getElementById('tp-ai-drawer');
    if (!drawer) return;
    this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
    if (this.isOpen) {
      drawer.classList.add('open');
      if (this.isDocked) {
        drawer.classList.add('docked');
        document.documentElement.style.setProperty('--ai-dock-width', `${this.dockWidth}px`);
        drawer.style.width = `${this.dockWidth}px`;
        drawer.style.height = '';
        if (typeof document !== 'undefined') {
          document.body.classList.add('ai-tutor-docked');
        }
      } else {
        drawer.classList.remove('docked');
        if (typeof document !== 'undefined') {
          document.body.classList.remove('ai-tutor-docked');
        }
      }
      document.getElementById('tp-ai-input')?.focus();
      this.renderSuggestions();
    } else {
      drawer.classList.remove('open');
      if (typeof document !== 'undefined') {
        document.body.classList.remove('ai-tutor-docked');
      }
    }
  }

  setupInitialGreeting() {
    const title = typeof document !== 'undefined' ? (document.title ? document.title.split('-')[0].trim() : 'TensorPlay') : 'TensorPlay';
    this.addMessage('bot', `Xin chào! Tôi là **Gia Sư AI Socratic** của bạn tại **${title}**.\n\nTôi có thể giải đáp trực quan bản chất toán học, công thức KaTeX, cơ chế phần cứng C++ hoặc giải thích các hiện tượng bạn đang quan sát. Hãy chọn một câu hỏi gợi ý bên dưới hoặc gõ thắc mắc của bạn nhé!`, { save: false });
  }

  renderSuggestions() {
    const mount = document.getElementById('tp-ai-suggestions');
    if (!mount) return;

    const path = window.location.pathname;
    let questions = [
      'Giải thích bản chất trực quan của bài học này?',
      'Ý nghĩa toán học cốt lõi ở bước hiện tại là gì?'
    ];

    for (const [key, qList] of Object.entries(LESSON_QUESTIONS)) {
      if (path.includes(key)) {
        questions = qList;
        break;
      }
    }

    mount.innerHTML = questions.map(q => `
      <button class="tp-ai-chip" data-q="${q}">${renderInlineMath(q)}</button>
    `).join('');

    mount.querySelectorAll('.tp-ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-q');
        const input = document.getElementById('tp-ai-input');
        if (input) input.value = q;
        this.handleSend();
      });
    });
  }

  gatherLessonContext() {
    let context = `Ngữ cảnh học viên đang xem:\n- Trang: ${document.title}\n`;
    
    // Step wizard info
    const heading = document.querySelector('.wizard-heading')?.textContent;
    const badge = document.querySelector('.wizard-step-badge')?.textContent;
    if (heading || badge) {
      context += `- Vị trí: ${badge || ''} - ${heading || ''}\n`;
    }

    // Telemetry text readouts on page
    const banner = document.getElementById('verdict-banner')?.textContent;
    if (banner) context += `- Trạng thái viễn trắc/đánh giá: "${banner.trim()}"\n`;

    return context;
  }

  async handleSend() {
    const input = document.getElementById('tp-ai-input');
    const text = input ? input.value.trim() : '';
    if (!text || this.isLoading) return;

    if (!this.apiKey) {
      this.isSettingsOpen = true;
      document.getElementById('tp-ai-settings-card').style.display = 'flex';
      this.addMessage('bot', '⚠️ Bạn chưa cài đặt **Gemini API Key**. Vui lòng lấy API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey) rồi dán vào ô cài đặt phía trên để bắt đầu trò chuyện nhé!');
      return;
    }

    input.value = '';
    this.addMessage('user', text);
    this.isLoading = true;
    this.updateLoadingState(true);

    try {
      const lessonContext = this.gatherLessonContext();
      const promptWithContext = `${lessonContext}\nCâu hỏi của học viên: ${text}`;

      const reply = await this.callGeminiApi(promptWithContext);
      this.addMessage('bot', reply);
    } catch (err) {
      console.error('Gemini API call failed:', err);
      let errorMsg = `❌ **Lỗi gọi Gemini Flash**: ${err.message}`;
      if (err.message.includes('prepayment credits are depleted') || err.status === 402) {
        errorMsg = `💳 **Tài khoản Google AI Studio đã hết hạn mức trả trước (Credits Depleted)**\n\nGoogle phản hồi: *"Your prepayment credits are depleted"*\n\n👉 **Cách khắc phục để dùng Free 100%:**\n1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey).\n2. Bấm **"Create API key"** và chọn **"Create API key in new project"** (Tạo key trong dự án mới hoàn toàn).\n3. Không gắn thẻ thanh toán vào dự án mới đó để được dùng gói **Free Tier mặc định** của Google.\n4. Copy Key mới và dán vào TensorPlay là xong!`;
      } else if (err.message.includes('API_KEY_INVALID') || err.message.includes('400')) {
        errorMsg += '\n\n*Gợi ý: API Key của bạn có thể không chính xác hoặc đã hết hạn. Hãy bấm ⚙️ Key để kiểm tra lại.*';
      } else if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')) {
        errorMsg += '\n\n*Gợi ý: Đã chạm giới hạn yêu cầu (Rate Limit/Quota). Vui lòng đợi khoảng 1 phút rồi thử lại nhé.*';
      }
      this.addMessage('bot', errorMsg);
    } finally {
      this.isLoading = false;
      this.updateLoadingState(false);
    }
  }

  async callGeminiApi(prompt) {
    const candidateModels = [
      this.selectedModel,
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
    // Remove duplicates and falsy values while keeping priority order
    const queue = [...new Set(candidateModels.filter(Boolean))];

    let lastError = null;
    for (const model of queue) {
      try {
        const reply = await this.executeGenerateContent(model, prompt);
        if (model !== this.selectedModel) {
          console.log(`[AiTutor] Tự động luân chuyển sang model hoạt động tốt: ${model}`);
          this.selectedModel = model;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_MODEL_KEY, model);
          }
          this.updateModelBadge(model);
          const select = document.getElementById('tp-ai-model-select');
          if (select) select.value = model;
        }
        return reply;
      } catch (err) {
        lastError = err;
        const msg = err.message || '';
        const isModelNotFound = msg.includes('not found') || 
                                msg.includes('not supported') || 
                                msg.includes('Call ModelService.ListModels') ||
                                err.status === 404;
        const isOverloadedOrRateLimit = msg.includes('high demand') ||
                                        msg.includes('temporarily') ||
                                        msg.includes('overloaded') ||
                                        msg.includes('Spikes in demand') ||
                                        msg.includes('RESOURCE_EXHAUSTED') ||
                                        msg.includes('quota') ||
                                        msg.includes('rate limit') ||
                                        err.status === 503 ||
                                        err.status === 429 ||
                                        err.status === 500;
        if (isModelNotFound || isOverloadedOrRateLimit) {
          console.warn(`[AiTutor] Model '${model}' đang bận/quá tải (${msg}), đang tự động luân chuyển sang model tiếp theo trong hàng đợi...`);
          continue;
        }
        // If it's an authorization error, throw immediately
        throw err;
      }
    }

    // If static fallback queue failed, try dynamic ListModels to discover supported models for this key
    try {
      const discovered = await this.fetchAvailableModels(false);
      for (const model of discovered) {
        if (!queue.includes(model)) {
          try {
            const reply = await this.executeGenerateContent(model, prompt);
            this.selectedModel = model;
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(STORAGE_MODEL_KEY, model);
            }
            this.updateModelBadge(model);
            const select = document.getElementById('tp-ai-model-select');
            if (select) select.value = model;
            return reply;
          } catch {}
        }
      }
    } catch {}

    throw lastError || new Error('Không tìm thấy model Gemini nào hỗ trợ generateContent cho API Key này.');
  }

  async executeGenerateContent(model, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const systemPrompt = `Bạn là Gia Sư AI Socratic chuyên sâu về Deep Learning Systems & Toán Học AI cho nền tảng TensorPlay.
Quy chuẩn trả lời:
1. Giải thích các khái niệm toán học (Softmax, Cross-Entropy Loss, Gradient Descent, Backprop, Cache Locality, CUDA, FlashAttention) một cách TRỰC QUAN, DỄ HIỂU NHẤT.
2. Dùng các con số mẫu nhỏ, tròn trịa (0, 1, 2, -1, 0.5, 0.1) để người học dễ nhẩm tính trong 1-2 phút.
3. LUÔN viết công thức toán học dưới chuẩn KaTeX:
   - Dùng $...$ cho công thức ngắn nằm trong dòng (ví dụ $M = \\max(z)$, $z_i \\le 0$, $L = -\\log(P_y)$).
   - Dùng $$...$$ trên một dòng riêng cho công thức khối lớn hoặc phương trình quan trọng (ví dụ tính xác suất Softmax, ma trận gradient, phép nhân ma trận).
   - Tuyệt đối KHÔNG dùng ký tự gạch dưới trần trong toán học (tránh lỗi KaTeX parse error).
   - Với ma trận, dùng \\begin{bmatrix} ... \\end{bmatrix} với kích thước nhỏ (2x2 hoặc vector 2-4 phần tử).
4. Tránh học vẹt công thức khô khan, luôn trả lời câu hỏi cốt lõi "Bản chất đằng sau là gì?" và liên hệ với lập trình C++ hoặc Framework AI thực tế (PyTorch/CUDA).
5. Trả lời bằng tiếng Việt thân thiện, súc tích, truyền cảm hứng.`;

    const contents = [];
    const prior = this.messages.slice(0, -1).slice(-6);
    const validPrior = prior.filter(m => {
      if (!m || !m.text) return false;
      if (m.text.startsWith('❌') || m.text.startsWith('⚠️')) return false;
      return true;
    });

    let lastRole = null;
    for (const m of validPrior) {
      const role = m.role === 'user' ? 'user' : 'model';
      if (contents.length === 0 && role === 'model') continue;
      if (role === lastRole) continue;
      contents.push({
        role: role,
        parts: [{ text: m.text }]
      });
      lastRole = role;
    }

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents.pop();
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200
        }
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson.error?.message || `HTTP ${response.status} ${response.statusText}`;
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const replyText = candidate?.content?.parts?.[0]?.text;
    if (!replyText) {
      throw new Error('Gemini không trả về phản hồi văn bản.');
    }
    return replyText;
  }

  async fetchAvailableModels(notifyUser = false) {
    if (!this.apiKey || typeof fetch === 'undefined') return [];
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.models || !Array.isArray(data.models)) return [];

      const validModels = data.models
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));

      if (validModels.length > 0) {
        this.availableModels = validModels;
        this.populateModelSelect(validModels);

        // If current selectedModel is not in validModels, choose the best one
        if (!validModels.includes(this.selectedModel)) {
          const preferred = validModels.find(m => m.includes('3.8-flash')) ||
                            validModels.find(m => m.includes('flash-latest')) ||
                            validModels.find(m => m.includes('3.5-flash')) ||
                            validModels.find(m => m.includes('2.5-flash')) ||
                            validModels.find(m => m.includes('2.0-flash')) ||
                            validModels.find(m => m.includes('flash')) ||
                            validModels[0];
          if (preferred) {
            this.selectedModel = preferred;
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(STORAGE_MODEL_KEY, preferred);
            }
            this.updateModelBadge(preferred);
          }
        }

        if (notifyUser && typeof document !== 'undefined') {
          const statusEl = document.getElementById('tp-ai-key-status');
          if (statusEl) {
            statusEl.textContent = `✓ Tìm thấy ${validModels.length} models khả dụng! Đang dùng: ${this.selectedModel}`;
            statusEl.style.color = 'var(--color-positive, #10b981)';
          }
        }
      }
      return validModels;
    } catch (err) {
      console.warn('Lỗi khi dò danh sách Model từ Google AI:', err);
      return [];
    }
  }

  populateModelSelect(models) {
    if (typeof document === 'undefined') return;
    const select = document.getElementById('tp-ai-model-select');
    if (!select || !models || models.length === 0) return;

    select.innerHTML = '';
    models.forEach(modelName => {
      const opt = document.createElement('option');
      opt.value = modelName;
      let display = modelName;
      if (modelName.includes('flash-latest') || modelName.includes('3.8-flash')) display += ' (Khuyên dùng)';
      opt.textContent = display;
      if (modelName === this.selectedModel) opt.selected = true;
      select.appendChild(opt);
    });
  }

  updateModelBadge(model) {
    if (typeof document === 'undefined') return;
    const badge = document.querySelector('.tp-ai-header-badge');
    if (badge) {
      let label = 'Gemini Flash';
      if (model.includes('2.0')) label = 'Gemini 2.0';
      else if (model.includes('pro')) label = 'Gemini Pro';
      else if (model.includes('1.5-flash')) label = 'Gemini 1.5 Flash';
      badge.textContent = label;
      badge.title = `Đang kết nối: ${model}`;
    }
  }

  addMessage(role, text, options = { save: true }) {
    this.messages.push({ role, text });
    if (typeof document === 'undefined') {
      if (options?.save !== false) {
        this.saveChatHistory();
      }
      return;
    }
    const mount = document.getElementById('tp-ai-messages');
    if (!mount) return;

    const msgEl = document.createElement('div');
    msgEl.className = `tp-ai-msg ${role}`;
    
    // Format markdown and render math
    const formatted = this.formatMarkdown(text);
    msgEl.innerHTML = formatted;
    mount.appendChild(msgEl);

    // If KaTeX was not loaded when formatMarkdown ran or there are unrendered data-tex elements,
    // ensure they are rendered now or when KaTeX finishes loading
    this.renderMathInElement(msgEl);

    // Scroll to bottom
    mount.scrollTop = mount.scrollHeight;

    if (options?.save !== false) {
      this.saveChatHistory();
    }
  }

  renderMathInElement(container) {
    if (typeof window === 'undefined' || !container) return;
    if (!window.katex) {
      setTimeout(() => this.renderMathInElement(container), 80);
      return;
    }
    try {
      const mathDisplays = container.querySelectorAll('.tp-ai-math-display');
      mathDisplays.forEach(block => {
        const tex = block.getAttribute('data-tex');
        if (tex && (!block.querySelector('.katex') || block.textContent.includes('$$'))) {
          try {
            window.katex.render(tex, block, { displayMode: true, throwOnError: false });
          } catch {}
        }
      });

      const mathInlines = container.querySelectorAll('.tp-ai-math-inline');
      mathInlines.forEach(inline => {
        const tex = inline.getAttribute('data-tex');
        if (tex && (!inline.querySelector('.katex') || inline.textContent.includes('$'))) {
          try {
            window.katex.render(tex, inline, { displayMode: false, throwOnError: false });
          } catch {}
        }
      });
    } catch (err) {
      console.warn('Lỗi render KaTeX trong tin nhắn AI:', err);
    }
  }

  formatMarkdown(text) {
    if (!text || typeof text !== 'string') return '';

    // Step 0: Chuẩn hóa ký hiệu LaTeX hay được LLM sinh ra
    let normalized = text
      .replace(/\\\[([\s\S]+?)\\\]/g, '$$$$$1$$$$')
      .replace(/\\\(([\s\S]+?)\\\)/g, '$$$1$$');

    // Khử bớt escape thừa cho các lệnh LaTeX phổ biến (ví dụ: \\frac -> \frac)
    normalized = normalized.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

    // Step 1: Tách và bảo vệ khối Code (Blocks & Inlines) để không bị regex markdown hay math phá hỏng
    const codeBlocks = [];
    const codeInlines = [];
    
    let shielded = normalized.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang, code });
      return `___TP_CODE_BLOCK_${idx}___`;
    });

    shielded = shielded.replace(/```([\s\S]*?)```/g, (match, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: '', code });
      return `___TP_CODE_BLOCK_${idx}___`;
    });

    shielded = shielded.replace(/`([^`\n]+)`/g, (match, code) => {
      const idx = codeInlines.length;
      codeInlines.push(code);
      return `___TP_CODE_INLINE_${idx}___`;
    });

    // Step 2: Tách và bảo vệ công thức toán học Display Math ($$...$$) và Inline Math ($...$)
    const mathBlocks = [];
    const mathInlines = [];

    // Bắt Display Math $$...$$
    shielded = shielded.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      const idx = mathBlocks.length;
      mathBlocks.push(formula.trim());
      return `___TP_MATH_BLOCK_${idx}___`;
    });

    // Bắt Inline Math $...$ (chỉ trên 1 dòng, bỏ qua tiền tệ thuần số như $10 hay $ 100)
    shielded = shielded.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      if (/^\s*\d+([\.,]\d+)?\s*$/.test(formula)) {
        return match;
      }
      const idx = mathInlines.length;
      mathInlines.push(formula.trim());
      return `___TP_MATH_INLINE_${idx}___`;
    });

    // Step 3: Xử lý định dạng Markdown cho phần văn bản thuần còn lại
    let out = shielded
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Tiêu đề
      .replace(/^### (.*$)/gim, '<div class="tp-ai-h4">$1</div>')
      .replace(/^## (.*$)/gim, '<div class="tp-ai-h3">$1</div>')
      // In đậm & in nghiêng
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Đường kẻ ngang
      .replace(/^---+$/gim, '<hr class="tp-ai-hr">')
      // Trích dẫn blockquote
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Danh sách gạch đầu dòng
      .replace(/^[ \t]*[-*][ \t]+(.*)$/gim, '<div class="tp-ai-list-item"><span class="tp-ai-bullet">•</span><span>$1</span></div>')
      // Danh sách số
      .replace(/^[ \t]*(\d+)\.[ \t]+(.*)$/gim, '<div class="tp-ai-list-item"><span class="tp-ai-num">$1.</span><span>$2</span></div>')
      // Xuống dòng
      .replace(/\n\n+/g, '<br><br>')
      .replace(/\n/g, '<br>');

    // Step 4: Khôi phục Code
    out = out.replace(/___TP_CODE_BLOCK_(\d+)___/g, (match, idx) => {
      const item = codeBlocks[parseInt(idx, 10)];
      if (!item) return '';
      const safeCode = item.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre><code>${safeCode}</code></pre>`;
    });

    out = out.replace(/___TP_CODE_INLINE_(\d+)___/g, (match, idx) => {
      const code = codeInlines[parseInt(idx, 10)];
      if (code === undefined) return '';
      const safeCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<code>${safeCode}</code>`;
    });

    // Step 5: Render và khôi phục công thức KaTeX
    const hasKatex = typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function';

    out = out.replace(/___TP_MATH_BLOCK_(\d+)___/g, (match, idx) => {
      const formula = mathBlocks[parseInt(idx, 10)];
      if (formula === undefined) return '';
      const safeFormulaAttr = formula.replace(/"/g, '&quot;');
      if (hasKatex) {
        try {
          const rendered = window.katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
            trust: true
          });
          return `<div class="tp-ai-math-display" data-tex="${safeFormulaAttr}">${rendered}</div>`;
        } catch (e) {
          return `<div class="tp-ai-math-display" data-tex="${safeFormulaAttr}">$$${formula}$$</div>`;
        }
      }
      return `<div class="tp-ai-math-display" data-tex="${safeFormulaAttr}">$$${formula}$$</div>`;
    });

    out = out.replace(/___TP_MATH_INLINE_(\d+)___/g, (match, idx) => {
      const formula = mathInlines[parseInt(idx, 10)];
      if (formula === undefined) return '';
      const safeFormulaAttr = formula.replace(/"/g, '&quot;');
      if (hasKatex) {
        try {
          const rendered = window.katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
            trust: true
          });
          return `<span class="tp-ai-math-inline" data-tex="${safeFormulaAttr}">${rendered}</span>`;
        } catch (e) {
          return `<span class="tp-ai-math-inline" data-tex="${safeFormulaAttr}">$${formula}$</span>`;
        }
      }
      return `<span class="tp-ai-math-inline" data-tex="${safeFormulaAttr}">$${formula}$</span>`;
    });

    return out;
  }

  updateLoadingState(isLoading) {
    const sendBtn = document.getElementById('btn-send-ai-msg');
    const mount = document.getElementById('tp-ai-messages');
    if (sendBtn) sendBtn.disabled = isLoading;

    const existingLoader = document.getElementById('tp-ai-loading-bubble');
    if (isLoading && !existingLoader && mount) {
      const loader = document.createElement('div');
      loader.id = 'tp-ai-loading-bubble';
      loader.className = 'tp-ai-msg bot';
      loader.style.fontStyle = 'italic';
      loader.style.color = 'var(--text-muted, #94a3b8)';
      loader.innerHTML = `⚡ Gia Sư AI đang nhẩm tính và suy luận...`;
      mount.appendChild(loader);
      mount.scrollTop = mount.scrollHeight;
    } else if (!isLoading && existingLoader) {
      existingLoader.remove();
    }
  }

  getChatStorageKey() {
    if (typeof window === 'undefined' || !window.location) return `${CHAT_HISTORY_PREFIX}default`;
    const path = window.location.pathname || '';
    const filename = path.split('/').filter(Boolean).pop() || 'index';
    const cleanId = filename.replace(/\.html$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${CHAT_HISTORY_PREFIX}${cleanId || 'default'}`;
  }

  saveChatHistory() {
    try {
      if (typeof localStorage === 'undefined') return;
      const key = this.getChatStorageKey();
      
      // Lọc bỏ tin nhắn lỗi tạm thời
      const validMessages = this.messages.filter(m => {
        if (!m || !m.text) return false;
        if (m.text.startsWith('❌ **Lỗi') || m.text.startsWith('⚠️ Bạn chưa')) {
          return false;
        }
        return true;
      });

      const hasUserMsg = validMessages.some(m => m.role === 'user');
      if (!hasUserMsg) {
        localStorage.removeItem(key);
        return;
      }

      // Giới hạn 30 tin nhắn gần nhất
      const toSave = validMessages.slice(-30);
      localStorage.setItem(key, JSON.stringify(toSave));
    } catch (err) {
      console.warn('[AiTutor] Không thể lưu lịch sử chat vào localStorage:', err);
    }
  }

  restoreChatHistory() {
    try {
      if (typeof localStorage === 'undefined') {
        this.setupInitialGreeting();
        return false;
      }
      const key = this.getChatStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) {
        this.setupInitialGreeting();
        return false;
      }

      let saved = null;
      try {
        saved = JSON.parse(raw);
      } catch {
        saved = null;
      }

      if (!Array.isArray(saved) || saved.length === 0) {
        this.setupInitialGreeting();
        return false;
      }

      this.messages = [];
      const mount = typeof document !== 'undefined' ? document.getElementById('tp-ai-messages') : null;
      if (mount) mount.innerHTML = '';

      saved.forEach(m => {
        if (m && m.role && m.text) {
          this.addMessage(m.role, m.text, { save: false });
        }
      });

      const userQuestionsCount = saved.filter(m => m.role === 'user').length;
      if (mount && userQuestionsCount > 0) {
        const notice = document.createElement('div');
        notice.className = 'tp-ai-history-notice';
        notice.innerHTML = `<span>📜 Đã khôi phục ${userQuestionsCount} câu hỏi từ phiên học trước</span>`;
        mount.insertBefore(notice, mount.firstChild);
      }

      return true;
    } catch (err) {
      console.warn('[AiTutor] Lỗi đọc lịch sử chat:', err);
      this.setupInitialGreeting();
      return false;
    }
  }

  clearChat() {
    this.messages = [];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.getChatStorageKey());
      }
    } catch {}
    if (typeof document !== 'undefined') {
      const mount = document.getElementById('tp-ai-messages');
      if (mount) mount.innerHTML = '';
    }
    this.setupInitialGreeting();
  }
}

// Global auto-mount on DOM readiness
let tutorInstance = null;
export function initAiTutor() {
  if (typeof window === 'undefined' || tutorInstance) return tutorInstance;
  tutorInstance = new AiTutor();
  window.__tpAiTutor = tutorInstance;
  return tutorInstance;
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAiTutor());
  } else {
    setTimeout(() => initAiTutor(), 60);
  }
}
