/**
 * TensorPlay Layout Manager
 * Handles 3-column resizers and mobile tab navigation switching.
 */

export class LayoutManager {
  constructor() {
    this.workspaceGrid = document.getElementById('workspace-grid');
    this.resizer1 = document.getElementById('resizer-1');
    this.resizer2 = document.getElementById('resizer-2');
    this.mobileTabBtns = document.querySelectorAll('.mobile-tab-btn');
    this.zoneColumns = document.querySelectorAll('.zone-column');

    this.isMobile = window.matchMedia('(max-width: 900px)').matches;
    this.activeTab = 'zone-narrative';

    this.initMobileWatcher();
    this.initResizers();
    this.initMobileTabs();
  }

  initMobileWatcher() {
    const mq = window.matchMedia('(max-width: 900px)');
    const handleMQ = (e) => {
      this.isMobile = e.matches;
      if (this.isMobile) {
        this.switchMobileTab(this.activeTab);
      } else {
        // Clear mobile active classes so grid returns to desktop 3 columns
        this.zoneColumns.forEach(col => col.classList.remove('mobile-active'));
        if (this.workspaceGrid) {
          this.workspaceGrid.style.display = 'grid';
        }
      }
    };

    if (mq.addEventListener) {
      mq.addEventListener('change', handleMQ);
    } else {
      mq.addListener(handleMQ);
    }

    if (this.isMobile) {
      this.switchMobileTab(this.activeTab);
    }
  }

  initMobileTabs() {
    this.mobileTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        if (targetTab) {
          this.switchMobileTab(targetTab);
        }
      });
    });
  }

  switchMobileTab(tabId) {
    this.activeTab = tabId;
    this.zoneColumns.forEach(col => {
      if (col.id === tabId) {
        col.classList.add('mobile-active');
      } else {
        col.classList.remove('mobile-active');
      }
    });

    this.mobileTabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  initResizers() {
    if (!this.workspaceGrid || !this.resizer1 || !this.resizer2) return;

    let currentResizer = null;
    let startX = 0;
    let startCol1Width = 0;
    let startCol2Width = 0;

    const col1 = document.getElementById('zone-narrative');
    const col2 = document.getElementById('zone-sandbox');
    const col3 = document.getElementById('zone-telemetry');

    const onMouseDown = (e, resizer) => {
      if (this.isMobile) return;
      currentResizer = resizer;
      startX = e.clientX;
      startCol1Width = col1.getBoundingClientRect().width;
      startCol2Width = col2.getBoundingClientRect().width;

      currentResizer.classList.add('resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!currentResizer) return;
      const dx = e.clientX - startX;

      if (currentResizer === this.resizer1) {
        const newCol1 = Math.max(260, Math.min(startCol1Width + dx, 550));
        this.workspaceGrid.style.gridTemplateColumns = `${newCol1}px var(--splitter-width) 1fr var(--splitter-width) minmax(260px, 25%)`;
      } else if (currentResizer === this.resizer2) {
        const newCol2 = Math.max(300, startCol2Width + dx);
        this.workspaceGrid.style.gridTemplateColumns = `minmax(280px, 30%) var(--splitter-width) ${newCol2}px var(--splitter-width) 1fr`;
      }
    };

    const onMouseUp = () => {
      if (currentResizer) {
        currentResizer.classList.remove('resizing');
        currentResizer = null;
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    this.resizer1.addEventListener('mousedown', (e) => onMouseDown(e, this.resizer1));
    this.resizer2.addEventListener('mousedown', (e) => onMouseDown(e, this.resizer2));
  }
}
