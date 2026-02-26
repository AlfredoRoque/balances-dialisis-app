import { Component } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/service/AuthService';
import { UserService } from '../../../core/service/userService';
import { SnackbarService } from '../../../core/service/component/snackbar.service';
import { Utility } from '../../../core/service/util/utility';
import { LogoutButtonComponent } from '../../../shared/components/logout-button/logout-button.component';
import { switchMap, throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { JSEncrypt } from 'jsencrypt';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LogoutButtonComponent
  ],
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.scss']
})
export class UpdatePasswordComponent {
  form: FormGroup;
  submitting = false;
  private userId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly utility: Utility,
    private readonly snackBar: SnackbarService,
    private readonly router: Router
  ) {
    this.form = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]],
      newPassword: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]]
    });

    this.userId = this.resolveUserId();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.form.value;
    if ((currentPassword ?? '').trim() === '' || (newPassword ?? '').trim() === '') {
      this.snackBar.openError('Ambas contraseñas son obligatorias.');
      return;
    }

    if (currentPassword === newPassword) {
      this.form.get('newPassword')?.setErrors({ sameAsCurrent: true });
      this.snackBar.openError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    const userId = this.ensureUserId();
    if (!userId) {
      this.handleInvalidSession();
      return;
    }

    this.submitting = true;
    this.authService.getPublicKey().pipe(
      switchMap(publicKey => {
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey.toString());
        const encryptedCurrent = encryptor.encrypt(currentPassword ?? '');
        const encryptedNew = encryptor.encrypt(newPassword ?? '');

        if (!encryptedCurrent || !encryptedNew) {
          this.snackBar.openError('No pudimos proteger la contraseña.');
          return throwError(() => new Error('Password encryption failed'));
        }

        return this.userService.updatePassword(encryptedCurrent, encryptedNew, userId);
      }),
      finalize(() => this.submitting = false)
    ).subscribe({
      next: () => {
        this.form.reset();
        this.snackBar.openSuccess('Contraseña actualizada exitosamente. Inicia sesión nuevamente.');
        this.authService.handleLogout();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        const message = error?.error?.message || 'No pudimos actualizar la contraseña.';
        this.snackBar.openError(message);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private ensureUserId(): number | null {
    if (this.userId != null) {
      return this.userId;
    }
    this.userId = this.resolveUserId();
    return this.userId;
  }

  private resolveUserId(): number | null {
    const token = this.authService.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = this.utility.decodeToken(token);
      const candidate = Number(decoded?.userId ?? decoded?.id ?? decoded?.sub);
      return Number.isFinite(candidate) ? candidate : null;
    } catch {
      return null;
    }
  }

  private handleInvalidSession(): void {
    this.snackBar.openError('Tu sesión expiró, vuelve a iniciar sesión.');
    this.authService.handleLogout();
    this.router.navigate(['/login']);
  }
}
