import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../service/AuthService';
import { SnackbarService } from '../service/component/snackbar.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(SnackbarService);

  // 🔹 No interceptar endpoints públicos
  if (req.url.includes('/auth/login')|| req.url.includes('/user/save')) {
    return next(req);
  }

  const token = authService.getToken();
  let authReq = req;

  // 🔐 Adjuntar token si existe
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError(err => {

      if (err.status === 401) {

        authService.logout();

        if (authService.canNotifySessionExpired()) {
          snackBar.openInfo('Tu sesión ha expirado');
        }

        router.navigate(['/login']);
      }

      return throwError(() => err);
    })
  );
};
