import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/AuthService';
import { Utility } from '../service/util/utility';

export const NoAuthGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const utility = inject(Utility);
  const token = authService.getToken();

  if (token && !authService.isTokenExpired(token)) {
    const role = utility.getUserRoleFromToken(token);
    if (role === 'PATIENT') {
      const patientId = utility.getUserIdFromToken(token);
      if (patientId) {
        router.navigate(['/dashboard', 'patient', patientId]);
        return false;
      }
    }
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
