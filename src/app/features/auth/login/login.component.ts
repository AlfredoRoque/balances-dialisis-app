import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/service/AuthService";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    this.authService.login(this.form.value).subscribe(res => {
      this.authService.handleLogin(res.token);
      this.router.navigate(['/dashboard']);
    });
  }
}
