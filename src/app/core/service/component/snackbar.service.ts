import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

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
}