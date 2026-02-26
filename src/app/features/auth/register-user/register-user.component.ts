import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "../../../core/service/userService";
import { SnackbarService } from "../../../core/service/component/snackbar.service";
import { AuthService } from "../../../core/service/AuthService";
import { User } from "../../../shared/models/User";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { JSEncrypt } from 'jsencrypt';
import { switchMap, throwError } from 'rxjs';

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.scss']
})
export class RegisterUserComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private snackBar: SnackbarService
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password, email } = this.form.value;
    this.authService.getPublicKey().pipe(
      switchMap(publicKey => {
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey.toString());
        const encryptedPassword = encryptor.encrypt(password ?? '');

        if (!encryptedPassword) {
          this.snackBar.openError('No pudimos proteger la contraseña.');
          return throwError(() => new Error('Password encryption failed'));
        }

        const payload: User = {
          username: username ?? '',
          password: encryptedPassword,
          email: email ?? ''
        };
        return this.userService.guardar(payload);
      })
    ).subscribe({
      next: () => {
        this.router.navigate(['/login']);
        this.snackBar.openSuccess('Usuario registrado exitosamente');
      },
      error: (error) => {
        const message = error?.error?.message || 'Error desconocido al registrar usuario';
        this.snackBar.openError(message);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
