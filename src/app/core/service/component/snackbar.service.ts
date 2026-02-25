import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  constructor(private snackBar: MatSnackBar) {}

  openSuccess(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 10000,
      panelClass: ['snackbar-success']
    });
  }

  openError(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 10000,
      panelClass: ['snackbar-error']
    });
  }

  openInfo(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 10000,
      panelClass: ['snackbar-info']
    });
  }

  confirm(message: string, actionLabel = 'Confirmar', duration = 8000): Observable<boolean> {
    return new Observable<boolean>(observer => {
      const ref: MatSnackBarRef<TextOnlySnackBar> = this.snackBar.open(message, actionLabel, {
        duration,
        panelClass: ['snackbar-confirm']
      });

      const actionSub = ref.onAction().subscribe(() => {
        observer.next(true);
        observer.complete();
      });

      const dismissSub = ref.afterDismissed().subscribe(event => {
        if (!event.dismissedByAction) {
          observer.next(false);
          observer.complete();
        }
      });

      return () => {
        actionSub.unsubscribe();
        dismissSub.unsubscribe();
        ref.dismiss();
      };
    });
  }
}