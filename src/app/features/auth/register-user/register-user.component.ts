import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { UserService } from "../../dashboard/services/userService";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';


@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register-user.component.html'
})
export class RegisterUserComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      address: ['', Validators.required]
    });
  }

  register() {
    console.log(this.form.value);
    this.userService.guardar(this.form.value).subscribe(res => {
      console.log('User registered successfully', res);
      this.router.navigate(['/login']);
    });
  }
}
