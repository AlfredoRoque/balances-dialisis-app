import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';

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
      import('./features/dashboard/base.routes')
        .then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
