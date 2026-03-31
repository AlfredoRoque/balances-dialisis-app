import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';
import { PaymentService } from '../../core/service/PaymentService';
import { SnackbarService } from '../../core/service/component/snackbar.service';
import { Utility } from '../../core/service/util/utility';
import { SubscriptionService } from '../../core/service/SubscriptionService';

@Component({
  selector: 'app-profile-center',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatButtonModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  cancellingSubscription = false;
  currentPlan: string | null = null;
  updatingPaymentMethod = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly paymentService: PaymentService,
    private readonly snackBar: SnackbarService,
    private readonly subscriptionService: SubscriptionService,
    private readonly utility: Utility
  ) {}

  ngOnInit(): void {
    this.subscriptionService.planName$
      .pipe(takeUntil(this.destroy$))
      .subscribe((name) => this.currentPlan = name);
    this.subscriptionService.refreshPlanName();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToUpdatePassword(): void {
    this.router.navigate(['/update-password']);
  }

  navigateToPlans(): void {
    this.router.navigate(['/dashboard', 'plans']);
  }

  updatePaymentMethod(): void {
    if (this.updatingPaymentMethod) {
      return;
    }

    this.updatingPaymentMethod = true;
    this.paymentService.changeCards()
      .pipe(finalize(() => this.updatingPaymentMethod = false))
      .subscribe({
        next: ({ paymentUrl }) => {
          if (paymentUrl) {
            this.snackBar.openInfo('Redirigiéndote a la pasarela para actualizar tu método de pago.');
            window.location.href = paymentUrl;
            return;
          }
          this.snackBar.openError('No recibimos la ruta para actualizar el método de pago.');
        },
        error: () => this.snackBar.openError('No pudimos abrir la actualización de pago. Intenta nuevamente.')
      });
  }

  confirmCancelSubscription(): void {
    if (this.cancellingSubscription) {
      return;
    }

    if (this.isFreePlan()) {
      this.snackBar.openInfo('Actualmente estás en el plan gratuito, no hay suscripción que cancelar.');
      return;
    }

    this.snackBar.confirm('¿Seguro que deseas cancelar tu suscripción?', 'Cancelar plan')
      .subscribe(confirmed => {
        if (!confirmed) {
          return;
        }

        this.cancellingSubscription = true;
        this.paymentService.cancelSubscription()
          .pipe(finalize(() => this.cancellingSubscription = false))
          .subscribe({
            next: ({ message }) => {
              this.subscriptionService.refreshPlanName();
              this.snackBar.openSuccess(message || 'La suscripción se canceló correctamente.');
            },
            error: () => this.snackBar.openError('No pudimos cancelar la suscripción. Inténtalo nuevamente.')
          });
      });
  }

  public isFreePlan(): boolean {
        return this.utility.isFreePlan(this.currentPlan);
    }

  public isSpecialPlan(): boolean {
    return this.currentPlan?.toUpperCase() === 'SPECIAL';
  }
}
