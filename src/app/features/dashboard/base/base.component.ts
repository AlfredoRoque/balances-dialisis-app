import { Component } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterOutlet } from "@angular/router";
import { UserService } from "../../../features/dashboard/services/userService";
import { AuthService } from "../../../core/service/AuthService";

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [RouterOutlet,ReactiveFormsModule],
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})

export class BaseComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    const token = localStorage.getItem('token');
    if (!this.authService.isTokenValid(token)) {
        this.authService.handleLogout();
    }
    this.authService.initSessionFromStorage();
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      address: ['', Validators.required]
    });
  }

  guardar() {
    this.userService.guardar(this.form.value).subscribe(res => {
    });
  }

  logout() {
    this.authService.logout();
  }
}
