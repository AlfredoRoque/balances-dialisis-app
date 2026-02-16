import { Component } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SnackbarService } from "../../../core/service/component/snackbar.service";
import { AuthService } from "../../../core/service/AuthService";
import { Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent {
  form: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: SnackbarService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  recover() {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { email } = this.form.value;

      this.authService.validateMail(email)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
          next: () => {
              this.authService.recoverPassword(email)
                  .pipe(finalize(() => this.isSubmitting = false))
                  .subscribe({
                      next: () => {
                          this.form.reset();
                          this.snackBar.openSuccess('Revisa tu correo se restableció la contraseña.');
                      },
                      error: (error) => {
                          const message = error?.error?.message || 'No pudimos procesar tu solicitud.';
                          this.snackBar.openError(message);
                      }
                  });
          },
          error: (error) => {
              const message = error?.error?.message || 'No pudimos procesar tu solicitud.';
              this.snackBar.openError(message);
          }
      });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
