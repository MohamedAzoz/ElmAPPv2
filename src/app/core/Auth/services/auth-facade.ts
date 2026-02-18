import { inject, Injectable, signal } from '@angular/core';
import {
  AuthClient,
  AuthModelDto,
  ChangePasswordCommand,
  LoginCommand,
  ResultOfAuthModelDto,
} from '../../../core/api/clients';
import { catchError, Observable, tap } from 'rxjs';
import { PermissionFacade } from './permission-facade';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { LocalStorage } from '../../Services/local-storage';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private localStorage = inject(LocalStorage);
  public userDataStore = signal<AuthModelDto | null>(null);
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  private permissionFacade = inject(PermissionFacade);
  private authClient = inject(AuthClient);
  private http = inject(HttpClient);
  private router = inject(Router);

  login(dto: LoginCommand, onSuccess?: () => void) {
    this.isLoading.set(true);
    this.error.set(null);
    this.authClient.login(dto).subscribe({
      next: (res) => {
        const data = res.data!;
        if (data) {
          // 💡 التعديل هنا: تحويل البيانات إلى String قبل حفظها
          this.localStorage.set('fullName', data.fullName!);
          this.localStorage.set('roles', data.roles ?? []);
          this.localStorage.set('userName', data.userName!);
          this.localStorage.set('userId', data.userId!);
          this.localStorage.set('isAuthenticated', data.isAuthenticated!.toString());
          this.localStorage.set('access_token', data.token!);
          this.localStorage.set('expires_on', data.expiresOn!.toString());
          this.localStorage.set('refreshTokenExpiration', data.refreshTokenExpiration!.toString());

          this.permissionFacade.getPermissionsByUserId(data.userId!);
          this.userDataStore.set(data);
        }
        this.router.navigate(['/main/home']);
        if (onSuccess) onSuccess();
      },
      error: (err: ResultOfAuthModelDto) => {
        this.handleError(err);
      },
    });
  }

  refresh(): Observable<ResultOfAuthModelDto> {
    return this.http
      .post<ResultOfAuthModelDto>(
        `${environment.apiUrl}api/Auth/RefreshToken`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          const data = res.data;
          if (data) {
            // 💡 تحديث البيانات بنفس طريقة الـ login
            this.localStorage.set('fullName', data.fullName!);
            this.localStorage.set('roles', data.roles ?? []);
            this.localStorage.set('userName', data.userName!);
            this.localStorage.set('userId', data.userId!);
            this.localStorage.set('isAuthenticated', data.isAuthenticated!.toString());
            this.localStorage.set('access_token', data.token!);
            this.localStorage.set('expires_on', data.expiresOn!.toString());
            this.localStorage.set(
              'refreshTokenExpiration',
              data.refreshTokenExpiration!.toString(),
            );

            this.permissionFacade.getPermissionsByUserId(data.userId!);
            this.userDataStore.set(data);
            this.isLoading.set(false);
          }
        }),
        catchError((err) => {
          // 💡 التعديل الأهم: لا تستدعي this.logout() هنا أبداً!
          // امسح البيانات محلياً ووجهه لصفحة الدخول لكسر الحلقة اللانهائية
          this.clearState();
          this.router.navigate(['/main/login']);
          throw err;
        }),
      );
  }

  logout() {
    this.authClient.logout().subscribe({
      next: () => {
        this.clearState();
      },
      error: () => {
        this.clearState();
      },
      complete: () => {
        this.router.navigate(['/main/login']);
      },
    });
  }

  changePassword(changePasswordCommand: ChangePasswordCommand, onSuccess?: () => void) {
    this.executeAction(this.authClient.changePassword(changePasswordCommand), onSuccess);
  }

  private executeAction(obs$: any, onSuccess?: () => void) {
    this.isLoading.set(true);
    obs$.subscribe({
      next: () => {
        this.isLoading.set(false);
        if (onSuccess) onSuccess();
      },
      error: (err: any) => this.handleError(err),
    });
  }

  private handleError(err: ResultOfAuthModelDto) {
    this.isLoading.set(false);
    console.log(err);
    this.error.set(err?.errors?.at(0)?.errorMessage || 'حدث خطأ ما');
  }

  clearState() {
    this.localStorage.remove('fullName');
    this.localStorage.remove('roles');
    this.localStorage.remove('userName');
    this.localStorage.remove('userId');
    this.localStorage.remove('isAuthenticated');
    this.localStorage.remove('access_token'); // تم تصحيح الاسم ليتطابق مع الـ get
    this.localStorage.remove('expires_on');
    this.localStorage.remove('refreshTokenExpiration');
    this.localStorage.remove('permissions');
    this.userDataStore.set(null);
    this.isLoading.set(false);
  }
}
