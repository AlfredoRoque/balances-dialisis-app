import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../service/AuthService';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token|| authService.isTokenExpired(token)) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  return true;
};