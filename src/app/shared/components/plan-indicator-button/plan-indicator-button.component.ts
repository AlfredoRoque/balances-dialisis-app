import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/service/AuthService';
import { Utility } from '../../../core/service/util/utility';
import { SubscriptionService } from '../../../core/service/SubscriptionService';

@Component({
  selector: 'app-plan-indicator-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="plan-indicator-wrapper" *ngIf="shouldShow">
      <button
        mat-stroked-button
        type="button"
        class="plan-indicator-button">
        <mat-icon>workspace_premium</mat-icon>
        Plan actual: {{ planLabel || 'Sin definir' }}
      </button>
      <span class="plan-indicator-tooltip">
        Actualiza o cancela tu plan en la sección Perfil
      </span>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .plan-indicator-wrapper {
      position: relative;
      display: inline-flex;
    }

    .plan-indicator-button {
      pointer-events: none;
      cursor: default;
      font-weight: 600;
      letter-spacing: 0.01em;
      gap: 0.4rem;
      color: #e2e8f0;
      border-color: rgba(226, 232, 240, 0.35);
      background: rgba(15, 23, 42, 0.45);
    }

    .plan-indicator-button mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .plan-indicator-tooltip {
      position: absolute;
      top: calc(100% + 0.35rem);
      right: 0;
      white-space: nowrap;
      background: rgba(15, 23, 42, 0.92);
      color: #e2e8f0;
      padding: 0.35rem 0.65rem;
      border-radius: 0.5rem;
      font-size: 0.78rem;
      letter-spacing: 0.01em;
      border: 1px solid rgba(148, 163, 184, 0.35);
      box-shadow: 0 12px 30px rgba(2, 6, 23, 0.4);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-4px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .plan-indicator-wrapper:hover .plan-indicator-tooltip,
    .plan-indicator-wrapper:focus-within .plan-indicator-tooltip {
      opacity: 1;
      transform: translateY(0);
    }
  `]
})
export class PlanIndicatorButtonComponent implements OnInit, OnDestroy {
  planLabel: string | null = null;
  shouldShow = false;
  private routerSubscription?: Subscription;
  private planSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly utility: Utility,
    private readonly router: Router,
    private readonly subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.refreshRole();
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.refreshRole());
    this.planSubscription = this.subscriptionService.planName$.subscribe(
      (name) => this.planLabel = name
    );
    this.subscriptionService.refreshPlanName();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.planSubscription?.unsubscribe();
  }

  private refreshRole(): void {
    const token = this.authService.getToken();
    const role = this.utility.getUserRoleFromToken(token);
    this.shouldShow = role === 'ADMIN';
  }
}
