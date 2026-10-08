import { describe, it, expect, beforeEach } from 'vitest';
import { AiTutor } from './AiTutor.js';

describe('AiTutor Component', () => {
  beforeEach(() => {
    // Mock localStorage and minimal document for node test environment
    const store = {};
    global.localStorage = {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = v; },
      removeItem: (k) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
  });

  it('khởi tạo AiTutor với giá trị lưu trữ trong localStorage và tự động nâng cấp model lên -latest', () => {
    localStorage.setItem('tensorplay:gemini_api_key', 'AIzaSyTestKey123');
    localStorage.setItem('tensorplay:gemini_model', 'gemini-1.5-flash');
    const tutor = new AiTutor();
    expect(tutor.apiKey).toBe('AIzaSyTestKey123');
    // Legacy 'gemini-1.5-flash' should be automatically migrated to 'gemini-flash-latest'
    expect(tutor.selectedModel).toBe('gemini-flash-latest');
  });

  it('chấp nhận định dạng key mới bắt đầu bằng AQ... của Google AI Studio', () => {
    localStorage.setItem('tensorplay:gemini_api_key', 'AQ.MockStudioKeyDummyForTesting123456789');
    const tutor = new AiTutor();
    expect(tutor.apiKey).toBe('AQ.MockStudioKeyDummyForTesting123456789');
  });

  it('định dạng markdown và công thức KaTeX không bị lỗi', () => {
    const tutor = new AiTutor();
    const raw = 'Đây là **in đậm** và công thức $M = \\max(z)$ cùng với code `x = 1`.';
    const formatted = tutor.formatMarkdown(raw);
    expect(formatted).toContain('<strong>in đậm</strong>');
    expect(formatted).toContain('<code>x = 1</code>');
    expect(formatted).toContain('$M = \\max(z)$');
  });

  it('xử lý công thức khối Display Math và ma trận KaTeX mà không bị lỗi &amp; hay <br>', () => {
    const tutor = new AiTutor();
    const raw = 'Ma trận Softmax:\n$$\\begin{bmatrix} 1 & -1 \\\\ 0 & 2 \\end{bmatrix}$$\nvới điều kiện $z > 88$ và $x < y$.';
    const formatted = tutor.formatMarkdown(raw);
    expect(formatted).toContain('tp-ai-math-display');
    expect(formatted).toContain('tp-ai-math-inline');
    // Đảm bảo ký tự & và < > trong toán không bị biến thành &amp; hay &lt; &gt;
    expect(formatted).toContain('1 & -1');
    expect(formatted).not.toContain('1 &amp; -1');
    expect(formatted).toContain('z > 88');
    expect(formatted).toContain('x < y');
  });

  it('chuẩn hóa các ký hiệu toán học chuẩn LaTeX \\[...\\] và \\(...\\) của mô hình AI', () => {
    const tutor = new AiTutor();
    const raw = 'Đạo hàm: \\[\\frac{\\partial L}{\\partial z_i} = P_i - y_i\\] và inline \\(z_i \\le 0\\)';
    const formatted = tutor.formatMarkdown(raw);
    expect(formatted).toContain('tp-ai-math-display');
    expect(formatted).toContain('tp-ai-math-inline');
    expect(formatted).toContain('\\frac{\\partial L}{\\partial z_i}');
  });

  it('xóa lịch sử chat và đặt lại lời chào thành công', () => {
    const tutor = new AiTutor();
    tutor.messages = [{ role: 'user', text: 'Hello' }];
    tutor.clearChat();
    expect(tutor.messages.length).toBe(1);
    expect(tutor.messages[0].role).toBe('bot');
  });

  it('hỗ trợ bật tắt chế độ phóng to / co giãn (toggleMaximize)', () => {
    const tutor = new AiTutor();
    expect(tutor.isMaximized).toBe(false);
    tutor.toggleMaximize();
    // In node environment without document, toggleMaximize safely handles missing DOM
    expect(tutor.isMaximized).toBe(false); // stays false since drawer is undefined in node
  });

  it('tự động phát hiện và xóa sạch key số lỗi do browser password autofill (ví dụ 1235...)', () => {
    localStorage.setItem('tensorplay:gemini_api_key', '12356789');
    const tutor = new AiTutor();
    expect(tutor.apiKey).toBe('');
    expect(localStorage.getItem('tensorplay:gemini_api_key')).toBe(null);
  });

  it('mặc định khởi tạo ở chế độ Ghép Cột (Docked Side-Panel) để không che bài học', () => {
    const tutor = new AiTutor();
    expect(tutor.isDocked).toBe(true);
    expect(tutor.dockWidth).toBe(440);
  });

  it('lưu và đọc tùy chọn chế độ Ghép Cột (Docked) hoặc Thả Nổi (Floating) từ localStorage', () => {
    localStorage.setItem('tensorplay:ai_dock_mode', 'false');
    localStorage.setItem('tensorplay:ai_dock_width', '520');
    const tutor = new AiTutor();
    expect(tutor.isDocked).toBe(false);
    expect(tutor.dockWidth).toBe(520);
  });

  it('lưu lịch sử hỏi đáp vào localStorage khi có tin nhắn từ người dùng', () => {
    const tutor = new AiTutor();
    tutor.addMessage('user', 'Softmax hoạt động ra sao?');
    tutor.addMessage('bot', 'Softmax chuyển đổi vector logit thành phân phối xác suất.');

    const key = tutor.getChatStorageKey();
    const stored = JSON.parse(localStorage.getItem(key));
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBe(2);
    expect(stored[0].role).toBe('user');
    expect(stored[0].text).toBe('Softmax hoạt động ra sao?');
    expect(stored[1].role).toBe('bot');
  });

  it('khôi phục lịch sử chat thành công qua restoreChatHistory', () => {
    const tutor = new AiTutor();
    const key = tutor.getChatStorageKey();
    const mockHistory = [
      { role: 'user', text: 'Tại sao cần trừ max(z)?' },
      { role: 'bot', text: 'Để chống tràn số mũ float32 khi z > 88.' }
    ];
    localStorage.setItem(key, JSON.stringify(mockHistory));

    const restored = tutor.restoreChatHistory();
    expect(restored).toBe(true);
    expect(tutor.messages.length).toBe(2);
    expect(tutor.messages[0].text).toContain('trừ max(z)');
    expect(tutor.messages[1].text).toContain('chống tràn số mũ');
  });

  it('xóa sạch lịch sử khỏi localStorage khi gọi clearChat', () => {
    const tutor = new AiTutor();
    tutor.addMessage('user', 'Câu hỏi thử nghiệm');
    const key = tutor.getChatStorageKey();
    expect(localStorage.getItem(key)).not.toBe(null);

    tutor.clearChat();
    expect(localStorage.getItem(key)).toBe(null);
    expect(tutor.messages.length).toBe(1); // Chỉ còn lời chào khởi tạo
    expect(tutor.messages[0].role).toBe('bot');
  });

  it('lọc bỏ thông báo lỗi tạm thời, không lưu vào lịch sử bền vững', () => {
    const tutor = new AiTutor();
    tutor.addMessage('user', 'Câu hỏi 1');
    tutor.addMessage('bot', 'Trả lời 1');
    tutor.addMessage('bot', '❌ **Lỗi gọi Gemini Flash**: HTTP 429');

    const key = tutor.getChatStorageKey();
    const stored = JSON.parse(localStorage.getItem(key));
    expect(stored.length).toBe(2);
    expect(stored.some(m => m.text.includes('❌ **Lỗi'))).toBe(false);
  });

  it('phân tách key lưu trữ theo từng bài học khác nhau', () => {
    global.window = {
      location: { pathname: '/examples/hw0_tensor_memory/bai_01_robot_vision.html' }
    };
    const tutor1 = new AiTutor();
    expect(tutor1.getChatStorageKey()).toBe('tensorplay:chat_history:bai_01_robot_vision');

    global.window.location.pathname = '/examples/hw0_tensor_memory/bai_02_softmax_loss.html';
    const tutor2 = new AiTutor();
    expect(tutor2.getChatStorageKey()).toBe('tensorplay:chat_history:bai_02_softmax_loss');

    global.window.location.pathname = '/lessons/robot_vision/';
    const tutor3 = new AiTutor();
    expect(tutor3.getChatStorageKey()).toBe('tensorplay:chat_history:robot_vision');

    global.window.location.pathname = '/lessons/flash_attention/index.html';
    const tutor4 = new AiTutor();
    expect(tutor4.getChatStorageKey()).toBe('tensorplay:chat_history:flash_attention');

    // Dọn dẹp mock window
    delete global.window;
  });
});
