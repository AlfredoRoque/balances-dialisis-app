import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/service/AuthService';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-stroked-button color="accent" type="button" (click)="handleLogout()" class="logout-button">
      <mat-icon>logout</mat-icon>
      Cerrar sesión
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .logout-button {
      gap: 0.35rem;
      display: inline-flex;
      align-items: center;
      font-weight: 500;
    }
  `]
})
export class LogoutButtonComponent {
  constructor(private readonly authService: AuthService) {}

  handleLogout(): void {
    this.authService.logout();
  }
}
