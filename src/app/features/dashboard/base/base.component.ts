import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AuthService } from "../../../core/service/AuthService";

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})

export class BaseComponent {

  constructor(
    private authService: AuthService
  ) {
    const token = localStorage.getItem('token');
    if (!this.authService.isTokenValid(token)) {
        this.authService.handleLogout();
    }
    this.authService.initSessionFromStorage();
  }

  logout() {
    this.authService.logout();
  }
}
