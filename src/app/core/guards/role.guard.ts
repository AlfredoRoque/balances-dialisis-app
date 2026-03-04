import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../service/AuthService';
import { Utility } from '../service/util/utility';

export const RoleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const utility = inject(Utility);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as string[] | undefined;
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const token = authService.getToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  const userRole = utility.getUserRoleFromToken(token);
  if (!userRole) {
    router.navigate(['/login']);
    return false;
  }

  if (!allowedRoles.includes(userRole)) {
    redirectByRole(userRole, router, utility, token);
    return false;
  }

  if (userRole === 'PATIENT' && route.paramMap.has('patientId')) {
    const requestedPatientId = Number(route.paramMap.get('patientId'));
    const ownPatientId = utility.getUserIdFromToken(token);
    if (!ownPatientId || !Number.isFinite(requestedPatientId) || requestedPatientId !== ownPatientId) {
      redirectByRole(userRole, router, utility, token);
      return false;
    }
  }

  return true;
};

function redirectByRole(role: string, router: Router, utility: Utility, token: string): void {
  if (role === 'PATIENT') {
    const patientId = utility.getUserIdFromToken(token);
    if (patientId) {
      router.navigate(['/dashboard', 'patient', patientId]);
    } else {
      router.navigate(['/login']);
    }
    return;
  }

  router.navigate(['/dashboard']);
}
