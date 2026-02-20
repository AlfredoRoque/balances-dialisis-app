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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
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
    private snackBar: SnackbarService
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.authService.login(this.form.value, timeZone).subscribe({
      next: (res) => {
        this.authService.handleLogin(res.token);
        this.router.navigate(['/dashboard']);
         this.snackBar.openSuccess('Inicio de sesión exitoso');
      },
      error: (error) => {
        const message = error?.error?.message || 'Error desconocido al iniciar sesión';
        this.snackBar.openError(message);
      }
    });
  }

  register() {
    this.router.navigate(['/register']);
  }

  goToRecover() {
    this.router.navigate(['/recover-password']);
  }
}
