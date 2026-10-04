/**
 * CommentSection Component (Hệ Thống Bình Luận & Chú Giải Kiến Thức Tái Sử Dụng)
 * Reusable across all lessons. Displays curated expert commentary (Math, C++, Gotchas)
 * and allows learners to add/persist their own interactive notes per step in localStorage.
 */

import { renderInlineMath } from '../katex-render.js';

const STORAGE_PREFIX = 'tensorplay:comments:';

export function createCommentSection(container, options = {}) {
  const {
    lessonId = 'default_lesson',
    initialStep = 1,
    curatedComments = [], // Built-in pedagogical commentary
    allowUserNotes = true
  } = options;

  let currentStep = initialStep;
  let currentCurated = [...curatedComments];

  container.className = 'tp-comment-section';

  function getStorageKey() {
    return `${STORAGE_PREFIX}${lessonId}:step_${currentStep}`;
  }

  function loadUserNotes() {
    try {
      const raw = localStorage.getItem(getStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveUserNotes(notes) {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(notes));
    } catch (e) {}
  }

  function render() {
    const userNotes = loadUserNotes();
    const allComments = [...currentCurated, ...userNotes];

    container.innerHTML = `
      <div class="tp-comment-header">
        <div class="tp-comment-title">
          <span>💬 Chú Giải & Bình Luận Kiến Thức</span>
          <span class="tp-comment-count">${allComments.length}</span>
        </div>
        <span style="font-size: 0.7rem; color: var(--text-dim); font-family: var(--font-mono);">Bước ${currentStep}</span>
      </div>

      <div class="tp-comment-list">
        ${allComments.length === 0 ? `
          <div style="font-size: var(--text-xs); color: var(--text-dim); font-style: italic; padding: 8px 0;">
            Chưa có bình luận nào cho bước này. Hãy để lại ghi chú đầu tiên!
          </div>
        ` : ''}

        ${allComments.map((c, idx) => {
          const isUser = c.isUserNote;
          const cardType = c.type || (isUser ? 'user-note' : 'expert');
          const tagClass = c.tagType || (isUser ? 'note' : 'math');

          return `
            <div class="tp-comment-card ${cardType}" data-idx="${idx}">
              <div class="tp-comment-meta">
                <div class="tp-comment-author">
                  <span class="tp-comment-avatar">${c.avatar || (isUser ? '📝' : '💡')}</span>
                  <span>${c.author || (isUser ? 'Ghi chú của bạn' : 'Cố Vấn Kỹ Thuật')}</span>
                  <span class="tp-comment-tag ${tagClass}">${c.tag || 'Kiến thức'}</span>
                </div>
                ${isUser ? `
                  <button class="tp-btn-ghost btn-del-note" data-id="${c.id}" style="padding: 2px 6px; font-size: 0.65rem;" title="Xóa ghi chú này">✕</button>
                ` : `
                  <span style="font-size: 0.65rem; color: var(--text-dim);">${c.role || 'Expert'}</span>
                `}
              </div>
              <div class="tp-comment-body">
                ${renderInlineMath(c.content || '')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${allowUserNotes ? `
        <div class="tp-comment-input-wrap">
          <textarea class="tp-comment-textarea" placeholder="Viết ghi chú / câu hỏi cho bước này (hỗ trợ công thức $Z = X \\cdot W$)..."></textarea>
          <div class="tp-comment-form-actions">
            <button class="tp-btn tp-btn-secondary btn-add-note" style="padding: 6px 14px; font-size: var(--text-xs);">
              ➕ Thêm Ghi Chú
            </button>
          </div>
        </div>
      ` : ''}
    `;

    // Event handler: Add user note
    const addBtn = container.querySelector('.btn-add-note');
    const textarea = container.querySelector('.tp-comment-textarea');
    if (addBtn && textarea) {
      addBtn.addEventListener('click', () => {
        const text = textarea.value.trim();
        if (!text) return;

        const newNote = {
          id: `note_${Date.now()}`,
          isUserNote: true,
          type: 'user-note',
          tag: 'Ghi chú cá nhân',
          tagType: 'note',
          avatar: '✍️',
          author: 'Bạn',
          content: text,
          createdAt: new Date().toLocaleTimeString()
        };

        const existing = loadUserNotes();
        existing.push(newNote);
        saveUserNotes(existing);

        textarea.value = '';
        render();
      });
    }

    // Event handler: Delete user note
    container.querySelectorAll('.btn-del-note').forEach(btn => {
      btn.addEventListener('click', () => {
        const noteId = btn.getAttribute('data-id');
        const existing = loadUserNotes().filter(n => n.id !== noteId);
        saveUserNotes(existing);
        render();
      });
    });
  }

  render();

  return {
    setStep: (newStep, newCurated = []) => {
      currentStep = newStep;
      currentCurated = [...newCurated];
      render();
    },
    getComments: () => [...currentCurated, ...loadUserNotes()]
  };
}
