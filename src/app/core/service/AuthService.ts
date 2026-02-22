import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { SessionTimerService } from "./session-timer.service";
import { Observable, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private API = 'http://localhost:8082/api/auth';
  private sessionExpiredNotified = false;

  constructor(private http: HttpClient,private router: Router,private sessionTimer: SessionTimerService) {}

  login(data: { username: string; password: string },timeZone: string) {
    return this.http.post<any>(`${this.API}/login`, { ...data, timeZone });
  }

  validateMail(email: string) {
    return this.http.get<any>(`${this.API}/validate/mail`, {
      params: { email }
    });
  }

  recoverPassword(email: string) {
    return this.http.get<any>(`${this.API}/recover/password`, {
      params: { email }
    });
  }

  getPublicKey(): Observable<string> {
    return this.http.get(`${this.API}/public-key`, { responseType: 'text' });
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    this.logoutBack().pipe(finalize(() => {
       this.handleLogout();
       this.router.navigate(['/login']);
    })).subscribe({
      next: () => {
        console.log('Logout successful');
      },
      error: (error) => {
        console.log('Logout failed', error);
      }
    });
  }

  logoutBack() {
    return this.http.get(`${this.API}/logout`);
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
