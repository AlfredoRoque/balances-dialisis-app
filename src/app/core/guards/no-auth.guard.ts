import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/AuthService';

export const NoAuthGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token && !authService.isTokenExpired(token)) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
