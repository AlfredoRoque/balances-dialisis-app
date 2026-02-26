import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-update-password-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-stroked-button color="accent" type="button" (click)="goToUpdatePassword()" class="update-password-button">
      <mat-icon>lock_reset</mat-icon>
      Actualizar contraseña
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .update-password-button {
      gap: 0.35rem;
      display: inline-flex;
      align-items: center;
      font-weight: 500;
    }
  `]
})
export class UpdatePasswordButtonComponent {
  constructor(private readonly router: Router) {}

  goToUpdatePassword(): void {
    this.router.navigate(['/update-password']);
  }
}
