import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Footer } from '../../../layout/footer/footer';
import { Nav } from '../../../layout/nav/nav';
import { LockUi } from '../lock-ui/lock-ui';
import { RateLimitService } from '../../../core/Services/rate-limit-service';
import { DirectionService } from '../../../core/Services/direction';

@Component({
  selector: 'app-main',
  imports: [Nav, RouterOutlet, Footer, LockUi],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {
  rateLimitService = inject(RateLimitService);
  dir = inject(DirectionService);
  private router = inject(Router);

  shouldShowHeaderFooter(): boolean {
    const url = this.router.url;
    // Hide header/footer if in GetAllQuestions, TestSession, or Result
    const isQuestionBank = url.includes('/QB/') && /\/QB\/[^/]+\/[^/]+/.test(url);
    const isTestSession = url.includes('/T/') && /\/T\/[^/]+/.test(url);
    const isResult = url.includes('/result');

    return !(isQuestionBank || isTestSession || isResult);
  }
}
