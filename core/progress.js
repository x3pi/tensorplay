/**
 * TensorPlay Progress Manager
 * Handles reading and writing learner progress in localStorage.
 */

const STORAGE_KEY = 'tensorplay:progress';

export class ProgressManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Cannot read localStorage progress:', e);
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Cannot write localStorage progress:', e);
    }
  }

  getLessonProgress(lessonId) {
    if (!this.data[lessonId]) {
      this.data[lessonId] = {
        lastStep: 1,
        completed: false,
        completedSteps: []
      };
    }
    return this.data[lessonId];
  }

  setLastStep(lessonId, stepNumber) {
    const prog = this.getLessonProgress(lessonId);
    prog.lastStep = stepNumber;
    this.save();
  }

  markStepCompleted(lessonId, stepNumber) {
    const prog = this.getLessonProgress(lessonId);
    if (!prog.completedSteps.includes(stepNumber)) {
      prog.completedSteps.push(stepNumber);
      this.save();
    }
  }

  markLessonCompleted(lessonId, isCompleted = true) {
    const prog = this.getLessonProgress(lessonId);
    prog.completed = isCompleted;
    this.save();
  }

  calculateGlobalProgress(registry) {
    if (!registry || !registry.lessons || registry.lessons.length === 0) return 0;
    
    let totalCompleted = 0;
    let totalPossible = 0;

    registry.lessons.forEach(l => {
      // Use estimated steps or 8 default
      const estimatedSteps = l.totalSteps || 8;
      totalPossible += estimatedSteps;
      const prog = this.data[l.id];
      if (prog) {
        if (prog.completed) {
          totalCompleted += estimatedSteps;
        } else if (prog.completedSteps) {
          totalCompleted += Math.min(prog.completedSteps.length, estimatedSteps);
        }
      }
    });

    if (totalPossible === 0) return 0;
    return Math.round((totalCompleted / totalPossible) * 100);
  }

  resetAll() {
    this.data = {};
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }
}

export const progress = new ProgressManager();
