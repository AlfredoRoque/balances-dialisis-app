import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/service/AuthService";
import { SnackbarService } from "../../../core/service/component/snackbar.service";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { JSEncrypt } from 'jsencrypt';
import { switchMap, throwError } from 'rxjs';
import { Utility } from "../../../core/service/util/utility";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: SnackbarService,
    private utility: Utility
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      isPatient: [false]
    });
  }

  login() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { username, password, isPatient } = this.form.value;
    const role = isPatient ? 'PATIENT' : 'ADMIN';
    this.authService.getPublicKey().pipe(
      switchMap(publicKey => {
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey.toString());
        const encryptedPassword = encryptor.encrypt(password ?? '');
        
        if (!encryptedPassword) {
          this.snackBar.openError('No pudimos proteger la contraseña.');
          return throwError(() => new Error('Password encryption failed'));
        }
        return this.authService.login({ username, password: encryptedPassword, role }, timeZone);
      })
    ).subscribe({
      next: (res) => {
        this.authService.handleLogin(res.token);
        this.redirectAfterLogin(res.token);
        this.snackBar.openSuccess('Inicio de sesión exitoso');
      },
      error: (error) => {
        console.log('Login error:', error); 
        const message = error?.error?.message || 'Error desconocido al iniciar sesión';
        this.snackBar.openError(message);
      }
    });
  }

  private redirectAfterLogin(token: string): void {
    const role = this.utility.getUserRoleFromToken(token);
    if (role === 'PATIENT') {
      const userId = this.utility.getUserIdFromToken(token);
      if (userId) {
        this.router.navigate(['/dashboard', 'patient', userId]);
        return;
      }
    }
    this.router.navigate(['/dashboard']);
  }

  register() {
    this.router.navigate(['/register']);
  }

  goToRecover() {
    this.router.navigate(['/recover-password']);
  }
}
