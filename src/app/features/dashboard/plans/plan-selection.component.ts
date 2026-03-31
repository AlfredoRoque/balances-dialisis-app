import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, Subject, takeUntil, switchMap, EMPTY } from 'rxjs';
import { PlansService } from '../../../core/service/PlansService';
import { PaymentService } from '../../../core/service/PaymentService';
import { SnackbarService } from '../../../core/service/component/snackbar.service';
import { Plan } from '../../../shared/models/Plan';
import { PaymentSubscription } from '../../../shared/models/PaymentSuscription';
import { SubscriptionService } from '../../../core/service/SubscriptionService';

const resolvePlanKey = (plan: Plan): string =>
  plan?.priceId || String(plan?.id ?? '') || (plan?.name ?? '');

@Component({
  selector: 'app-plan-selection',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './plan-selection.component.html',
  styleUrls: ['./plan-selection.component.scss']
})
export class PlanSelectionComponent implements OnInit, OnDestroy {
  plans: Plan[] = [];
  loadingPlans = false;
  errorMessage: string | null = null;
  selectingPlanKey: string | null = null;
  currentPlanName: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly plansService: PlansService,
    private readonly paymentService: PaymentService,
    private readonly subscriptionService: SubscriptionService,
    private readonly snackBar: SnackbarService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptionService.planName$
      .pipe(takeUntil(this.destroy$))
      .subscribe((name) => this.currentPlanName = name);
    this.subscriptionService.refreshPlanName();
    this.fetchPlans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchPlans(): void {
    this.loadingPlans = true;
    this.errorMessage = null;
    this.plansService.getPlans()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingPlans = false)
      )
      .subscribe({
        next: (plans) => {
          this.plans = plans ?? [];
        },
        error: () => {
          this.plans = [];
          this.errorMessage = 'No pudimos cargar los planes disponibles. Intenta de nuevo.';
        }
      });
  }

  selectPlan(plan: Plan): void {
    if (!plan) {
      return;
    }

    const targetIsFree = this.isFreePlan(plan.name);

    if (targetIsFree) {
      this.handleFreePlanSelection(plan);
      return;
    }

    if (!plan.priceId) {
      this.snackBar.openError('Este plan no tiene un identificador de pago configurado.');
      return;
    }

    if (this.isFreePlan(this.currentPlanName)) {
      this.handlePaidSelectionFromFree(plan);
      return;
    }

    this.handlePaidPlanChange(plan);
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }

  trackByPlanId(_: number, plan: Plan): number | string {
    return resolvePlanKey(plan);
  }

  isProcessing(plan: Plan): boolean {
    return this.selectingPlanKey === resolvePlanKey(plan);
  }

  private handlePaidSelectionFromFree(plan: Plan): void {
    this.setSelectingPlan(plan);
    this.subscriptionService.existSubscription()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(exists => {
          if (!exists.isExistSubscription) {
            return this.paymentService.createPayment(plan.priceId!);
          }

          if (this.arePlansEqual(this.currentPlanName, plan.name)) {
            this.snackBar.openInfo(`Ya cuentas con el plan ${plan.name}.`);
            return EMPTY;
          }

          return this.requestPlanChange(plan);
        }),
        finalize(() => this.clearSelectingPlan())
      )
      .subscribe({
        next: (response) => this.handlePaymentResponse(response),
        error: () => this.snackBar.openError('No pudimos procesar tu solicitud. Por favor, inténtalo nuevamente.')
      });
  }

  private handlePaidPlanChange(plan: Plan): void {
    if (this.arePlansEqual(this.currentPlanName, plan.name)) {
      this.snackBar.openInfo(`Ya cuentas con el plan ${plan.name}.`);
      return;
    }

    this.setSelectingPlan(plan);
    this.requestPlanChange(plan)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.clearSelectingPlan())
      )
      .subscribe({
        next: (response) => this.handlePaymentResponse(response),
        error: () => this.snackBar.openError('No pudimos cambiar tu suscripción. Inténtalo nuevamente.')
      });
  }

  private handleFreePlanSelection(plan: Plan): void {
    if (this.isFreePlan(this.currentPlanName)) {
      this.snackBar.openInfo('Ya estás en el plan gratuito.');
      return;
    }

    this.snackBar.confirm(
      'Cambiar al plan gratuito cancelará tu suscripción actual. ¿Deseas continuar?',
      'Sí, cancelar'
    ).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.setSelectingPlan(plan);
      this.paymentService.cancelSubscription()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.clearSelectingPlan())
        )
        .subscribe({
          next: ({ message }) => {
            this.snackBar.openSuccess(message || 'Cancelamos tu suscripción correctamente.');
            this.subscriptionService.refreshPlanName();
          },
          error: () => this.snackBar.openError('No pudimos cancelar la suscripción. Intenta nuevamente.')
        });
    });
  }

  private handlePaymentResponse(response: PaymentSubscription | undefined): void {
    if (!response) {
      this.snackBar.openError('No recibimos respuesta del servidor. Intenta nuevamente.');
      return;
    }

    if (response.paymentUrl) {
      this.snackBar.openInfo('Redirigiéndote al checkout seguro.');
      window.location.href = response.paymentUrl;
      return;
    }

    this.subscriptionService.refreshPlanName();
    this.snackBar.openSuccess(response.message || 'Actualizamos tu suscripción exitosamente.');
  }

  private setSelectingPlan(plan: Plan): void {
    this.selectingPlanKey = resolvePlanKey(plan);
  }

  private clearSelectingPlan(): void {
    this.selectingPlanKey = null;
  }

  private requestPlanChange(plan: Plan) {
    return this.promptPlanChangeConfirmation(plan.name)
      .pipe(
        switchMap(confirmed => {
          if (!confirmed) {
            this.snackBar.openInfo('No realizamos cambios en tu plan.');
            return EMPTY;
          }
          return this.paymentService.changeSubscription(plan.priceId!);
        })
      );
  }

  private isFreePlan(value: string | null | undefined): boolean {
    return this.normalizePlanName(value) === 'FREE';
  }

  private arePlansEqual(a: string | null | undefined, b: string | null | undefined): boolean {
    const normalizedA = this.normalizePlanName(a);
    const normalizedB = this.normalizePlanName(b);
    return !!normalizedA && normalizedA === normalizedB;
  }

  private normalizePlanName(value: string | null | undefined): string {
    return (value ?? '').trim().toUpperCase();
  }

  private promptPlanChangeConfirmation(planName: string | null | undefined) {
    const label = planName ?? 'este plan';
    return this.snackBar.confirm(
      `¿Seguro que deseas actualizar tu suscripción al plan ${label}?`,
      'Actualizar'
    );
  }
}
