import { describe, it, expect } from 'vitest';
import { isActionText, getStepCards, createStepWizard } from './components/StepWizard.js';

describe('shared/components/StepWizard.js - Socratic Taxonomy & Narrative Structure', () => {
  it('isActionText() recognizes interactive action prompts vs conceptual mechanisms', () => {
    // Action prompts
    expect(isActionText('Bấm nút "Chạy 1 Bước" ở Cột 2')).toBe(true);
    expect(isActionText('Nhấn nút "Forward Pass" để quan sát')).toBe(true);
    expect(isActionText('Kéo slider w để xem biến thiên')).toBe(true);
    expect(isActionText('Click vào 2 ô dưới của khuôn W')).toBe(true);
    expect(isActionText('Hãy click vào ô đầu tiên')).toBe(true);
    expect(isActionText('Quan sát cách chỉ số 2D được chuyển đổi')).toBe(true);
    expect(isActionText('Xem thẻ Telemetry để kiểm tra OOM')).toBe(true);
    expect(isActionText('Bật công tắc Safe Softmax')).toBe(true);

    // Pure mechanism/conceptual statements (NOT actions)
    expect(isActionText('Hàm mũ $e^z$ biến mọi con số thành dương tính')).toBe(false);
    expect(isActionText('CPU giải quyết bằng cách trang bị L1 Cache siêu tốc')).toBe(false);
    expect(isActionText('Trong C++, mảng 2D được lưu liên tục theo Row-Major')).toBe(false);
    expect(isActionText('Phép nhân ma trận $Z = X \\cdot W$ là bộ tiêu chí chấm điểm')).toBe(false);
    expect(isActionText('Độ phức tạp $O(M \\times N \\times K)$ với ma trận lớn')).toBe(false);
  });

  it('getStepCards() builds 4 clear cards when problem, mechanism, action, takeaway are provided', () => {
    const stepData = {
      problem: 'Làm sao biến con số thực bất kỳ thành xác suất?',
      mechanism: 'Hàm mũ $e^z$ và công thức Softmax $P_i = e^{z_i} / \\sum e^{z_j}$.',
      action: 'Kéo thử thanh trượt $z_0, z_1$ ở Cột 2 và xem xác suất $P$.',
      takeaway: 'Softmax vừa là bộ chuẩn hóa vừa là bộ khuếch đại.'
    };

    const cards = getStepCards(stepData);
    expect(cards).toHaveLength(4);

    expect(cards[0].type).toBe('problem');
    expect(cards[0].icon).toBe('🎯');
    expect(cards[0].title).toBe('Bối Cảnh & Vấn Đề');

    expect(cards[1].type).toBe('mechanism');
    expect(cards[1].icon).toBe('⚙️');
    expect(cards[1].title).toBe('Cơ Chế Vận Hành');

    expect(cards[2].type).toBe('action');
    expect(cards[2].icon).toBe('🧪');
    expect(cards[2].title).toBe('Thao Tác Trải Nghiệm');

    expect(cards[3].type).toBe('takeaway');
    expect(cards[3].icon).toBe('💡');
    expect(cards[3].title).toBe('Đúc Kết Cốt Lõi');
  });

  it('getStepCards() automatically classifies legacy challenge fields into action or mechanism without confusing titles', () => {
    // Legacy step with action prompt
    const legacyActionStep = {
      problem: 'Camera robot đọc 2 pixel.',
      challenge: 'Bấm nút "Đèn Pha Chói Lóa" để mô phỏng tình huống.',
      takeaway: 'Cần có bằng chứng bác bỏ.'
    };
    const cardsAction = getStepCards(legacyActionStep);
    expect(cardsAction).toHaveLength(3);
    expect(cardsAction[1].type).toBe('action');
    expect(cardsAction[1].icon).toBe('🧪');
    expect(cardsAction[1].title).toBe('Thao Tác Trải Nghiệm');
    expect(cardsAction[1].title).not.toContain('Thử Thách');

    // Legacy step with mechanism explanation
    const legacyMechStep = {
      problem: 'Bộ nhớ RAM cách CPU hàng trăm chu kỳ.',
      challenge: 'CPU giải quyết bằng cách trang bị L1 Cache siêu tốc ngay sát lõi chip.',
      takeaway: 'Cache quyết định tốc độ thực tế.'
    };
    const cardsMech = getStepCards(legacyMechStep);
    expect(cardsMech).toHaveLength(3);
    expect(cardsMech[1].type).toBe('mechanism');
    expect(cardsMech[1].icon).toBe('⚙️');
    expect(cardsMech[1].title).toBe('Cơ Chế Vận Hành');
    expect(cardsMech[1].title).not.toContain('Thử Thách');
  });

  it('getStepCards() respects custom title overrides', () => {
    const customStep = {
      problemTitle: 'Vấn Đề Phần Cứng',
      problem: 'Tràn số FP32',
      mechanismTitle: 'Nguyên Lý Bất Biến',
      mechanism: 'Shift invariance math',
      takeawayTitle: 'Quy Tắc Vàng',
      takeaway: 'Luôn dùng Safe Softmax'
    };

    const cards = getStepCards(customStep);
    expect(cards[0].title).toBe('Vấn Đề Phần Cứng');
    expect(cards[1].title).toBe('Nguyên Lý Bất Biến');
    expect(cards[2].title).toBe('Quy Tắc Vàng');
  });

  it('createStepWizard() manages step state and formats split action/observation cards', () => {
    const createMockNode = (tag = 'div') => {
      const listeners = {};
      return {
        tagName: tag.toUpperCase(),
        innerHTML: '',
        textContent: '',
        children: [],
        value: '1',
        disabled: false,
        addEventListener: (event, handler) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(handler);
        },
        dispatchEvent: (event) => {
          const type = typeof event === 'string' ? event : event.type;
          (listeners[type] || []).forEach(h => h(event));
        },
        closest: () => null,
        querySelectorAll: () => []
      };
    };

    const container = createMockNode('div');
    const selectMock = createMockNode('select');
    const badgeMock = createMockNode('span');
    const headingMock = createMockNode('h2');
    const cardsMock = createMockNode('div');
    const dotsMock = createMockNode('div');
    const prevMock = createMockNode('button');
    const nextMock = createMockNode('button');

    container.querySelector = (sel) => {
      if (sel === '.tp-step-select') return selectMock;
      if (sel === '.wizard-step-badge') return badgeMock;
      if (sel === '.wizard-heading') return headingMock;
      if (sel === '.wizard-cards') return cardsMock;
      if (sel === '.wizard-step-dots') return dotsMock;
      if (sel === '.btn-wizard-prev') return prevMock;
      if (sel === '.btn-wizard-next') return nextMock;
      return null;
    };

    const steps = [
      {
        heading: 'Bước 1: Giới Thiệu',
        problem: 'Bối cảnh ban đầu',
        mechanism: 'Công thức toán học $Z = X \\cdot W$',
        action: '👉 Thao tác (Cột 2): Bấm nút "Chạy 1 Bước" ở Cột 2.\n👁️ Quan sát (Cột 3): Xem giá trị Loss tụt giảm về 0.',
        takeaway: 'Ghi nhớ quy tắc vàng'
      },
      {
        heading: 'Bước 2: Nâng Cao',
        problem: 'Vấn đề nâng cao',
        mechanism: 'Cơ chế nâng cao',
        action: '👉 Thao tác (Cột 2): Chọn `preset` mới.',
        takeaway: 'Đúc kết bước 2'
      }
    ];

    let lastStep = 1;
    const wizard = createStepWizard(container, {
      steps,
      initialStep: 1,
      onStepChange: (s) => { lastStep = s; }
    });

    // 1. Verify initial step
    expect(wizard.getStep()).toBe(1);
    expect(selectMock.value).toBe(1);

    // 2. Verify split action and observation cards formatted in cardsMock.innerHTML
    expect(cardsMock.innerHTML).toContain('class="socratic-split-action"');
    expect(cardsMock.innerHTML).toContain('class="socratic-subbox action-subbox"');
    expect(cardsMock.innerHTML).toContain('class="socratic-subbox obs-subbox"');
    expect(cardsMock.innerHTML).toContain('class="socratic-target-btn"');
    expect(cardsMock.innerHTML).toContain('"Chạy 1 Bước"');

    // 3. Navigate to step 2 via select change event
    selectMock.value = 2;
    selectMock.dispatchEvent({ type: 'change', target: { value: 2 } });
    expect(wizard.getStep()).toBe(2);
    expect(lastStep).toBe(2);

    // 4. Clean up
    wizard.destroy();
  });

  it('safely renders multiline display math ($$..$$) without HTML corruption or cross-paragraph dollar bleed', () => {
    const createMockNode = (tag = 'div') => ({
      tagName: tag.toUpperCase(),
      innerHTML: '',
      textContent: '',
      value: '1',
      disabled: false,
      addEventListener: () => {},
      dispatchEvent: () => {},
      closest: () => null,
      querySelectorAll: () => []
    });

    const container = createMockNode('div');
    const cardsMock = createMockNode('div');
    container.querySelector = (sel) => {
      if (sel === '.wizard-cards') return cardsMock;
      return createMockNode();
    };

    const stepWithDisplayMath = {
      heading: 'Khuôn dập điểm',
      problem: 'Robot đọc ảnh $X$.',
      mechanism: 'Áp một "khuôn dập mẫu chuẩn" $W$. Lấy từng pixel nhân với trọng số (Tích vô hướng $Z = X \\cdot W$):\n$$Z = (x_0 w_0) + (x_1 w_1) + (x_2 w_2) + (x_3 w_3)$$\nKhi khớp chuẩn: $Z = (1 \\times 1) + (1 \\times 1) = +2.0$ điểm.',
      takeaway: 'Tích vô hướng đo tương quan.'
    };

    createStepWizard(container, { steps: [stepWithDisplayMath] });

    // 1. Must contain socratic-display-math container
    expect(cardsMock.innerHTML).toContain('class="socratic-display-math"');
    // 2. Must not contain raw unparsed tags inside text or broken dollar pairings
    expect(cardsMock.innerHTML).not.toContain('$</p>');
    expect(cardsMock.innerHTML).not.toContain('</p><p class="socratic-p">Khi khớp chuẩn: $');
  });

  it('safely renders math containing inequalities (<, >) without bleed into adjacent text', () => {
    const createMockNode = (tag = 'div') => ({
      tagName: tag.toUpperCase(),
      innerHTML: '',
      textContent: '',
      value: '1',
      disabled: false,
      addEventListener: () => {},
      dispatchEvent: () => {},
      closest: () => null,
      querySelectorAll: () => []
    });

    const container = createMockNode('div');
    const cardsMock = createMockNode('div');
    container.querySelector = (sel) => {
      if (sel === '.wizard-cards') return cardsMock;
      return createMockNode();
    };

    // Temporarily mock window.katex to verify formula rendering
    const origWindow = globalThis.window;
    globalThis.window = {
      addEventListener: () => {},
      removeEventListener: () => {},
      katex: {
        renderToString: (tex) => `<span class="katex-mock">${tex}</span>`
      }
    };

    try {
      const stepWithInequalities = {
        heading: 'Thử thách dính bụi ($Z > 1.0$)',
        problem: 'Camera bị nhiễu bụi ($x < 0.5$).',
        mechanism: 'Mô hình đặt ngưỡng an toàn ($Z > 1.0$). Khi dính bụi nhẹ ($Z = 1 + 1 + 0.5 \\times 0 = 2.0$ hoặc $Z = 1 + 0.5 = 1.5$), vẫn vượt ngưỡng nhận diện.',
        action: '👉 Thao tác (Cột 2): Thử "Ảnh Dính Bụi".\n👁️ Quan sát (Cột 3): Điểm số $Z = 1.5$ vẫn $> 1.0$ và đạt $> 75\\%$.',
        takeaway: 'Độ bền vững là tiêu chí cốt lõi.'
      };

      createStepWizard(container, { steps: [stepWithInequalities] });

      // 1. Math formulas with > and < must be parsed into KaTeX
      expect(cardsMock.innerHTML).toContain('<span class="katex-mock">Z &gt; 1.0</span>'.replace('&gt;', '>'));
      expect(cardsMock.innerHTML).toContain('<span class="katex-mock">> 1.0</span>');
      expect(cardsMock.innerHTML).toContain('<span class="katex-mock">> 75\\%</span>');

      // 2. Vietnamese text must NEVER be captured inside KaTeX tags
      expect(cardsMock.innerHTML).not.toContain('<span class="katex-mock">Khi dính bụi');
      expect(cardsMock.innerHTML).not.toContain('<span class="katex-mock"> hoặc ');

      // 3. Button cue must be highlighted correctly and not corrupt HTML attributes
      expect(cardsMock.innerHTML).toContain('<span class="socratic-target-btn">"Ảnh Dính Bụi"</span>');
      expect(cardsMock.innerHTML).not.toContain('class="<span');
    } finally {
      globalThis.window = origWindow;
    }
  });

  it('tạo slide hoàn toàn mới ở cuối dành riêng cho công thức toán học và ẩn ở các slide trước', () => {
    const createMockNode = (tag = 'div') => {
      const children = [];
      const listeners = {};
      const node = {
        tagName: tag.toUpperCase(),
        innerHTML: '',
        textContent: '',
        value: '1',
        disabled: false,
        style: { display: '' },
        parentElement: null,
        children,
        appendChild: (child) => {
          children.push(child);
          child.parentElement = node;
          return child;
        },
        addEventListener: (e, fn) => { listeners[e] = fn; },
        dispatchEvent: (e) => { if (listeners[e]) listeners[e](); },
        closest: () => null,
        querySelectorAll: () => []
      };
      return node;
    };

    const container = createMockNode('div');
    const cardsMock = createMockNode('div');
    const formulaSlideMock = createMockNode('div');
    const formulaMountPointMock = createMockNode('div');
    const formulaMountMock = createMockNode('div');

    container.querySelector = (sel) => {
      if (sel === '.wizard-cards') return cardsMock;
      if (sel === '.wizard-formula-slide') return formulaSlideMock;
      if (sel === '.wizard-formula-mount-point') return formulaMountPointMock;
      return createMockNode();
    };

    const origDoc = globalThis.document;
    globalThis.document = {
      getElementById: (id) => (id === 'mount-formula-summary' ? formulaMountMock : null)
    };

    try {
      const wizard = createStepWizard(container, {
        steps: [
          { heading: 'Bước 1', problem: 'P1' },
          { heading: 'Bước 2', problem: 'P2' },
          { heading: 'Bước 3', problem: 'P3' }
        ],
        initialStep: 1
      });

      // Ở bước 1 (slide đầu): thẻ slide công thức phải bị ẩn, thẻ bài học thường hiển thị
      expect(cardsMock.style.display).toBe('block');
      expect(formulaSlideMock.style.display).toBe('none');
      expect(formulaMountMock.style.display).toBe('none');

      // Chuyển sang bước 2: vẫn là slide bài học thường
      wizard.setStep(2);
      expect(cardsMock.style.display).toBe('block');
      expect(formulaSlideMock.style.display).toBe('none');
      expect(formulaMountMock.style.display).toBe('none');

      // Chuyển sang bước 3: vẫn là slide bài học thường
      wizard.setStep(3);
      expect(cardsMock.style.display).toBe('block');
      expect(formulaSlideMock.style.display).toBe('none');
      expect(formulaMountMock.style.display).toBe('none');

      // Chuyển sang bước 4 (slide công thức hoàn toàn mới ở cuối!):
      wizard.setStep(4);
      expect(cardsMock.style.display).toBe('none');
      expect(formulaSlideMock.style.display).toBe('block');
      expect(formulaMountMock.style.display).toBe('block');
      expect(formulaMountMock.parentElement).toBe(formulaMountPointMock);

      // Quay lại bước 3: slide công thức lại bị ẩn đi, slide 3 hiện lại
      wizard.prev();
      expect(cardsMock.style.display).toBe('block');
      expect(formulaSlideMock.style.display).toBe('none');
      expect(formulaMountMock.style.display).toBe('none');
    } finally {
      globalThis.document = origDoc;
    }
  });
});


