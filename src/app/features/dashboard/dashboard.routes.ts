import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { PatientDetailComponent } from "./patient-detail/patient-detail.component";
import { CalculatedFluidBalanceComponent } from "./patient-detail/calculated-fluid-balance/calculated-fluid-balance.component";
import { RoleGuard } from "../../core/guards/role.guard";

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'patient/:patientId',
    component: PatientDetailComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'PATIENT'] }
  },
  {
    path: 'patient/:patientId/:patientLabel/calculated-balance',
    component: CalculatedFluidBalanceComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'PATIENT'] }
  }
];
