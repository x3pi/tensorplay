/**
 * TensorPlay Hash Router
 * Parses and synchronizes deep links: /#/<lesson_id>?step=<N>&preset=<preset_id>
 */

export class Router {
  constructor(engine) {
    this.engine = engine;
    this.isUpdatingProgrammatically = false;
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => {
      if (this.isUpdatingProgrammatically) {
        this.isUpdatingProgrammatically = false;
        return;
      }
      this.handleHashChange();
    });
  }

  parseHash() {
    const rawHash = window.location.hash.replace(/^#\/?/, '');
    if (!rawHash) {
      return { lessonId: null, step: null, preset: null };
    }

    const [pathPart, queryPart] = rawHash.split('?');
    const lessonId = pathPart || null;

    let step = null;
    let preset = null;

    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      if (params.has('step')) {
        const stepNum = parseInt(params.get('step'), 10);
        if (!isNaN(stepNum) && stepNum > 0) {
          step = stepNum;
        }
      }
      if (params.has('preset')) {
        preset = params.get('preset');
      }
    }

    return { lessonId, step, preset };
  }

  handleHashChange() {
    const { lessonId, step, preset } = this.parseHash();
    if (lessonId) {
      this.engine.navigateTo(lessonId, step, preset);
    }
  }

  updateUrl(lessonId, step = 1, preset = null) {
    if (!lessonId) return;

    let newHash = `#/${lessonId}`;
    const params = new URLSearchParams();
    if (step && step > 1) {
      params.set('step', step);
    }
    if (preset) {
      params.set('preset', preset);
    }

    const queryString = params.toString();
    if (queryString) {
      newHash += `?${queryString}`;
    }

    if (window.location.hash !== newHash) {
      this.isUpdatingProgrammatically = true;
      history.replaceState(null, '', newHash);
    }
  }
}
