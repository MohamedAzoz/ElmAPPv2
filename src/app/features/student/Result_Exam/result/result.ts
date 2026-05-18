import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizStateService } from '../quiz-state-service';
import { DecimalPipe, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-result',
  imports: [CommonModule, ButtonModule, TooltipModule, DecimalPipe, CommonModule],
  templateUrl: './result.html',
})
export class Result implements OnInit {
  public quizState = inject(QuizStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // استخدام computed لقراءة النتيجة مباشرة من السيرفس لضمان التحديث عند الرفريش
  scoreData = computed(() => this.quizState.examResult());
  showReview = signal<boolean>(false);

  ngOnInit() {
    // التحقق من وجود نتيجة، إذا لم توجد نعود للرئيسية
    if (!this.scoreData()) {
      this.router.navigate(['../../'], { relativeTo: this.route });
    }
  }

  toggleReview() {
    this.showReview.update((v) => !v);
  }

  goBack() {
    this.quizState.clearAll();
    // العودة لمسار الموارد
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  goHome() {
    this.quizState.clearAll();
    this.router.navigate(['/'], { relativeTo: this.route });
  }
}
