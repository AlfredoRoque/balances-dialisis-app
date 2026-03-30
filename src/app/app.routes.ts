import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { PaymentSuccessComponent } from './features/payments/payment-success/payment-success.component';
import { PaymentFailureComponent } from './features/payments/payment-failure/payment-failure.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [NoAuthGuard],
    loadChildren: () =>
      import('./features/auth/login/auth.routes')
        .then(m => m.AUTH_ROUTES)
  },
  {
    path: 'register',
    canActivate: [NoAuthGuard],
    loadChildren: () =>
      import('./features/auth/register-user/register.routes')
        .then(m => m.AUTH_ROUTES)
  },
  {
    path: 'recover-password',
    canActivate: [NoAuthGuard],
    loadChildren: () =>
      import('./features/auth/recover-password/recover.routes')
        .then(m => m.RECOVER_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes')
        .then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () =>
      import('./features/profile/profile.routes')
        .then(m => m.PROFILE_ROUTES)
  },
  {
    path: 'update-password',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/auth/update-password/update-password.routes')
        .then(m => m.UPDATE_PASSWORD_ROUTES)
  },
  {
    path: 'payment-success',
    component: PaymentSuccessComponent
  },
  {
    path: 'payment-failure',
    component: PaymentFailureComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
