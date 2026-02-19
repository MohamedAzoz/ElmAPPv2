import { Injectable, signal, effect, computed, inject } from '@angular/core';
import { LocalStorage } from '../../../core/Services/local-storage';

@Injectable({ providedIn: 'root' })
export class QuizStateService {
  private localStorage = inject(LocalStorage);
  userAnswers = signal<Map<number, number>>(new Map());
  timeLeft = signal<number>(0.1);
  timerString = signal<string>('00:00');
  private timerInterval: any;

  examResult = signal<any>(null);

  private readonly KEYS = {
    ANSWERS: 'quiz_answers',
    RESULT: 'quiz_last_result',
    START_TIME: 'session_start_time',
    TIMER_EXPIRE: 'quiz_timer_expire',
  };

  constructor() {
    const savedAnswers = this.localStorage.get(this.KEYS.ANSWERS);
    if (savedAnswers) this.userAnswers.set(new Map(savedAnswers));

    const savedResult = this.localStorage.get(this.KEYS.RESULT);
    if (savedResult) this.examResult.set(savedResult);

    effect(() => {
      const answersObj = Array.from(this.userAnswers().entries());
      this.localStorage.set(this.KEYS.ANSWERS, answersObj);
    });
  }

  saveTestResult(data: any) {
    let finalData;
    if (Array.isArray(data)) {
      const questions = data;
      let correct = 0;
      const answers = this.userAnswers();
      questions.forEach((q) => {
        const selectedOptionId = answers.get(q.id);
        const correctOption = q.options?.find((o: any) => o.isCorrect);
        if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
          correct++;
        }
      });
      finalData = {
        score: questions.length > 0 ? (correct / questions.length) * 100 : 0,
        correct: correct,
        total: questions.length,
      };
    } else {
      finalData = {
        score: data.gradePercentage ?? data.score,
        correct: data.correctAnswers ?? data.correct,
        total: data.totalQuestions ?? data.total,
        details: data.details,
      };
    }

    this.examResult.set(finalData);
    this.localStorage.set(this.KEYS.RESULT, finalData);
    this.stopTimer();
  }

  startTimer() {
    this.stopTimer();
    const startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(diff / 60)
        .toString()
        .padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      this.timerString.set(`${m}:${s}`);
    }, 1000);
  }

  // التعديل هنا: نمرر مدة الاختبار بالثواني
  startCountdown(totalSeconds: number) {
    this.stopTimer();

    let expiryTime = this.localStorage.get(this.KEYS.TIMER_EXPIRE);

    if (!expiryTime) {
      expiryTime = Date.now() + totalSeconds * 1000;
      this.localStorage.set(this.KEYS.TIMER_EXPIRE, expiryTime);
    }

    const expiry = Number(expiryTime);

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((expiry - now) / 1000);
      
      if (diff <= 0) {
        this.timeLeft.set(0);
        this.stopTimer();
        // لاحظ: لا نحذف quiz_timer_expire هنا، نتركه للـ Component ليتأكد من انتهاء الوقت
      } else {
        this.timeLeft.set(diff);
      }
    }, 1000);
  }

  timerTest = computed(() => {
    const totalSeconds = this.timeLeft();
    if (totalSeconds <= 0) return '00:00';

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const hoursPart = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
    return `${hoursPart}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  clearAll() {
    this.stopTimer();
    this.userAnswers.set(new Map());
    this.examResult.set(null);
    this.timerString.set('00:00');
    this.timeLeft.set(0);
    this.localStorage.remove(this.KEYS.ANSWERS);
    this.localStorage.remove(this.KEYS.RESULT);
    this.localStorage.remove(this.KEYS.TIMER_EXPIRE);
  }

  getAnswer(questionId: number) {
    return this.userAnswers().get(questionId);
  }

  saveAnswer(qId: number, oId: number) {
    this.userAnswers.update((m) => {
      const newMap = new Map(m);
      newMap.set(qId, oId);
      return newMap;
    });
  }
}