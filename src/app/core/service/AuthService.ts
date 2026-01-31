import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { SessionTimerService } from "./session-timer.service";

@Injectable({ providedIn: 'root' })
export class AuthService {

  private API = 'http://localhost:8080/auth';
  private sessionExpiredNotified = false;

  constructor(private http: HttpClient,private router: Router,private sessionTimer: SessionTimerService) {}

  login(data: { username: string; password: string }) {
    return this.http.post<any>(`${this.API}/login`, data);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    this.handleLogout();
    this.router.navigate(['/login']);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // segundos → ms
      return Date.now() > exp;
    } catch {
      return true;
    }
  }

  getTokenExpiration(token: string): number {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // segundos → ms
  }

  isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;

    if (!exp) return false;

    // exp viene en segundos
    const expirationDate = exp * 1000;

    return expirationDate > Date.now();
  } catch {
    return false;
  }
}


  getTimeLeft(): number {
    const token = this.getToken();
    if (!token) return 0;
    return this.getTokenExpiration(token) - Date.now();
  }

  canNotifySessionExpired(): boolean {
    if (this.sessionExpiredNotified) return false;
    this.sessionExpiredNotified = true;
    return true;
  }

  handleLogin(token: string) {
    localStorage.setItem('token', token);
    const expiration = this.getTokenExpiration(token);
    if (expiration) {
      this.sessionTimer.start(expiration, () => {
              this.handleLogout();
              this.router.navigate(['/login']);
        });
    }
  }

  handleLogout() {
    this.sessionExpiredNotified = false;
    localStorage.removeItem('token');
    this.sessionTimer.stop();
  }

  initSessionFromStorage() {
    const token = localStorage.getItem('token');
    if (token) {
      const expiration = this.getTokenExpiration(token);
      if (expiration) {
        this.sessionTimer.start(expiration, () => {
                this.handleLogout();
                this.router.navigate(['/login']);
        });
      }
    }
  }
}
