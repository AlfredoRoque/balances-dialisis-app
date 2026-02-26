import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { PatientDetailComponent } from "./patient-detail/patient-detail.component";
import { CalculatedFluidBalanceComponent } from "./patient-detail/calculated-fluid-balance/calculated-fluid-balance.component";

export const DASHBOARD_ROUTES: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'patient/:patientId', component: PatientDetailComponent },
  { path: 'patient/:patientId/:patientLabel/calculated-balance', component: CalculatedFluidBalanceComponent }
];
