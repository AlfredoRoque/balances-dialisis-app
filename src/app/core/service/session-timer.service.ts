import { Injectable } from "@angular/core";
import { SnackbarService } from "./component/snackbar.service";

@Injectable({ providedIn: 'root' })
export class SessionTimerService {

  private warningTimeout?: any;
  private logoutTimeout?: any;

  constructor(private snackBar: SnackbarService) {}

  start(expirationTimeMs: number, onExpire: () => void) {
    this.stop();

    const expiresInMs = expirationTimeMs - Date.now();

    if (expiresInMs <= 0) return;

    // 🔔 Aviso 30s antes
    const warningTime = expiresInMs - 60_000;
    if (warningTime > 0) {
      this.warningTimeout = setTimeout(() => {
        this.snackBar.openInfo('Tu sesión está por expirar');
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
