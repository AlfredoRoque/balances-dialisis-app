import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs/operators';
import { VitalSignService } from '../../../core/service/VitalSignService';
import { VitalSign } from '../../../shared/models/VitalSign';
import { SnackbarService } from '../../../core/service/component/snackbar.service';
import { AuthService } from '../../../core/service/AuthService';
import { Utility } from '../../../core/service/util/utility';

@Component({
  selector: 'app-vital-sign-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule
  ],
  templateUrl: './vital-sign-form.component.html',
  styleUrls: ['./vital-sign-form.component.scss']
})
export class VitalSignFormComponent implements OnInit, AfterViewInit {
  @Output() created = new EventEmitter<VitalSign>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  form: FormGroup;
  creating = false;
  submitError: string | null = null;
  loading = false;

  displayedColumns = ['name', 'actions'];
  vitalSigns: VitalSign[] = [];
  dataSource = new MatTableDataSource<VitalSign>([]);
  rowForms: Record<string, FormGroup> = {};
  editingId: number | null = null;
  savingId: number | null = null;
  decodedToken: any = null;

  constructor(
    private fb: FormBuilder,
    private vitalSignService: VitalSignService,
    private snackBar: SnackbarService,
     private authService: AuthService,
     private utility: Utility
  ) {
    const token = this.authService.getToken();
    if (token) {
      this.decodedToken = this.utility.decodeToken(token);
    }
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]]
    });
  }

  ngOnInit(): void {
    this.loadVitalSigns();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const trimmedName = (this.form.value.name as string).trim();
    if (!trimmedName) {
      this.form.get('name')?.setErrors({ required: true });
      return;
    }

    this.creating = true;
    this.submitError = null;

    const payload: VitalSign = { name: trimmedName, userId: this.decodedToken?.userId ?? 0 };

    this.vitalSignService.createVitalSign(payload)
      .pipe(finalize(() => this.creating = false))
      .subscribe({
        next: (createdVitalSign) => {
          this.prependVitalSign(createdVitalSign);
          this.created.emit(createdVitalSign);
          this.form.reset({ name: '' });
          this.snackBar.openSuccess('Signo vital registrado exitosamente');
        },
        error: () => {
          this.submitError = 'No fue posible registrar el signo vital. Intenta nuevamente.';
          this.snackBar.openError('No fue posible registrar el signo vital. Intenta nuevamente.');
        }
      });
  }

  startEdit(vitalSign: VitalSign): void {
    const id = vitalSign.id;
    if (id == null) {
      return;
    }
    this.ensureRowForm(vitalSign);
    this.editingId = id;
  }

  cancelEdit(vitalSign: VitalSign): void {
    const id = vitalSign.id;
    if (id == null) {
      return;
    }
    const form = this.rowForms[id.toString()];
    if (form) {
      form.patchValue({ name: vitalSign.name });
    }
    this.editingId = null;
  }

  save(vitalSign: VitalSign): void {
    const id = vitalSign.id;
    if (id == null) {
      return;
    }

    const form = this.rowForms[id.toString()];
    if (!form || form.invalid) {
      form?.markAllAsTouched();
      return;
    }

    const trimmedName = (form.value.name as string).trim();
    if (!trimmedName) {
      form.get('name')?.setErrors({ required: true });
      return;
    }

    this.savingId = id;
    this.vitalSignService.updateVitalSign(id, { id, name: trimmedName, userId: this.decodedToken?.userId ?? 0 })
      .pipe(finalize(() => this.savingId = null))
      .subscribe({
        next: (updated) => {
          this.applyVitalSignUpdate(updated ?? { ...vitalSign, name: trimmedName });
          this.editingId = null;
          this.snackBar.openSuccess('Signo vital actualizado exitosamente');
        },
        error: () => {
          form.patchValue({ name: vitalSign.name });
          this.snackBar.openError('No fue posible actualizar el signo vital. Intenta nuevamente.');
        }
      });
  }

  delete(vitalSign: VitalSign): void {
    const id = vitalSign.id;
    if (id == null) {
      return;
    }

    this.vitalSignService.deleteVitalSign(id).subscribe({
      next: () => {
        this.removeVitalSignFromTable(id);
        this.snackBar.openSuccess('Signo vital eliminado exitosamente');
      },
      error: () => {
        this.snackBar.openError('No fue posible eliminar el signo vital. Intenta nuevamente.');
      }
    });
  }

  isEditing(id: number | undefined | null): boolean {
    if (id == null) {
      return false;
    }
    return this.editingId === id;
  }

  getRowForm(id: number | undefined | null): FormGroup | null {
    if (id == null) {
      return null;
    }
    return this.rowForms[id.toString()] ?? null;
  }

  private loadVitalSigns(): void {
    this.loading = true;
    this.vitalSignService.getVitalSigns()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (signs) => {
          this.vitalSigns = signs ?? [];
          this.refreshTable(true);
        },
        error: () => {
          this.vitalSigns = [];
          this.refreshTable(true);
        }
      });
  }

  private refreshTable(resetPage = false): void {
    this.syncRowForms(this.vitalSigns);
    this.dataSource.data = [...this.vitalSigns];
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      if (resetPage) {
        this.paginator.firstPage();
      }
    }
  }

  private syncRowForms(signs: VitalSign[]): void {
    const existingIds = new Set(Object.keys(this.rowForms));
    signs.forEach(sign => {
      if (sign.id == null) {
        return;
      }
      existingIds.delete(sign.id.toString());
      this.ensureRowForm(sign);
    });
    existingIds.forEach(id => delete this.rowForms[id]);
  }

  private ensureRowForm(sign: VitalSign): void {
    const id = sign.id;
    if (id == null) {
      return;
    }
    const key = id.toString();
    const existing = this.rowForms[key];
    if (existing) {
      existing.setValue({ name: sign.name }, { emitEvent: false });
      return;
    }
    this.rowForms[key] = this.fb.group({
      name: [sign.name, [Validators.required, Validators.maxLength(80)]]
    });
  }

  private applyVitalSignUpdate(updated: VitalSign): void {
    if (updated.id == null) {
      return;
    }
    const index = this.vitalSigns.findIndex(sign => sign.id === updated.id);
    if (index !== -1) {
      this.vitalSigns[index] = { ...this.vitalSigns[index], ...updated };
      this.refreshTable();
    }
  }

  private removeVitalSignFromTable(id: number): void {
    this.vitalSigns = this.vitalSigns.filter(sign => sign.id !== id);
    delete this.rowForms[id.toString()];
    if (this.editingId === id) {
      this.editingId = null;
    }
    if (this.savingId === id) {
      this.savingId = null;
    }
    this.refreshTable(true);
  }

  private prependVitalSign(sign: VitalSign): void {
    this.vitalSigns = [sign, ...this.vitalSigns];
    this.refreshTable(true);
  }
}
