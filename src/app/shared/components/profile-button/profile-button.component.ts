import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/service/AuthService';
import { Utility } from '../../../core/service/util/utility';

@Component({
  selector: 'app-profile-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <button
      mat-flat-button
      color="primary"
      type="button"
      class="profile-button"
      *ngIf="shouldShow"
      (click)="goToProfile()">
      <mat-icon>account_circle</mat-icon>
      Perfil
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .profile-button {
      gap: 0.4rem;
      display: inline-flex;
      align-items: center;
      font-weight: 600;
      letter-spacing: 0.01em;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.35);
      border-radius: 999px;
      padding-inline: 1.25rem;
    }

    .profile-button mat-icon {
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
    }
  `]
})
export class ProfileButtonComponent implements OnInit, OnDestroy {
  shouldShow = false;
  private routerSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly utility: Utility,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.refreshVisibility();
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.refreshVisibility());
    window.addEventListener('storage', this.handleStorageEvent);
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    window.removeEventListener('storage', this.handleStorageEvent);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === 'token') {
      this.refreshVisibility();
    }
  };

  private refreshVisibility(): void {
    const token = this.authService.getToken();
    const role = this.utility.getUserRoleFromToken(token);
    this.shouldShow = role === 'ADMIN';
  }
}
