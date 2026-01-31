import { AuthService } from "./AuthService";
import { Injectable } from "@angular/core";
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SessionTimerService {

  private warningTimeout?: any;
  private logoutTimeout?: any;

  constructor(private snackBar: MatSnackBar) {}

  start(expirationTimeMs: number, onExpire: () => void) {
    this.stop();

    const expiresInMs = expirationTimeMs - Date.now();

    if (expiresInMs <= 0) return;

    // 🔔 Aviso 30s antes
    const warningTime = expiresInMs - 60_000;
    if (warningTime > 0) {
      this.warningTimeout = setTimeout(() => {
        this.snackBar.open(
          'Tu sesión está por expirar',
          'Aceptar',
          { duration: 5000 }
        );
      }, warningTime);
    }

    // 🔴 Logout EXACTO al expirar
    this.logoutTimeout = setTimeout(() => {
      onExpire();
    }, expiresInMs);
  }

  stop() {
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }
    if (this.logoutTimeout) {
      clearTimeout(this.logoutTimeout);
      this.logoutTimeout = null;
    }
  }
}
