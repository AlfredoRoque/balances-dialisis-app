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
import { MedicineService } from '../../../core/service/MedicineService';
import { Medicine } from '../../../shared/models/Medicine';
import { SnackbarService } from '../../../core/service/component/snackbar.service';

@Component({
  selector: 'app-medicine-form',
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
  templateUrl: './medicine-form.component.html',
  styleUrls: ['./medicine-form.component.scss']
})
export class MedicineFormComponent implements OnInit, AfterViewInit {
  @Output() created = new EventEmitter<Medicine>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  form: FormGroup;
  creating = false;
  submitError: string | null = null;
  loading = false;

  displayedColumns = ['name', 'actions'];
  medicines: Medicine[] = [];
  dataSource = new MatTableDataSource<Medicine>([]);
  rowForms: Record<string, FormGroup> = {};
  editingId: number | null = null;
  savingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private medicineService: MedicineService,
    private snackBar: SnackbarService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]]
    });
  }

  ngOnInit(): void {
    this.loadMedicines();
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

    const payload: Medicine = { name: trimmedName };

    this.medicineService.createMedicine(payload)
      .pipe(finalize(() => this.creating = false))
      .subscribe({
        next: (createdMedicine) => {
          this.prependMedicine(createdMedicine);
          this.created.emit(createdMedicine);
          this.form.reset({ name: '' });
          this.snackBar.openSuccess('Medicina registrada exitosamente');
        },
            error: () => {
            this.submitError = 'No fue posible registrar la medicina. Intenta nuevamente.';
            this.snackBar.openError('No fue posible registrar la medicina. Intenta nuevamente.');
        }
      });
  }

  startEdit(medicine: Medicine): void {
    const id = medicine.id;
    if (id == null) {
      return;
    }
    this.ensureRowForm(medicine);
    this.editingId = id;
  }

  cancelEdit(medicine: Medicine): void {
    const id = medicine.id;
    if (id == null) {
      return;
    }
    const form = this.rowForms[id.toString()];
    if (form) {
      form.patchValue({ name: medicine.name });
    }
    this.editingId = null;
  }

  save(medicine: Medicine): void {
    const id = medicine.id;
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
    this.medicineService.updateMedicine(id, { id, name: trimmedName })
      .pipe(finalize(() => this.savingId = null))
      .subscribe({
        next: (updated) => {
          this.applyMedicineUpdate(updated ?? { ...medicine, name: trimmedName });
          this.editingId = null;
          this.snackBar.openSuccess('Medicina actualizada exitosamente');
        },
        error: () => {
          form.patchValue({ name: medicine.name });
          this.snackBar.openError('No fue posible actualizar la medicina. Intenta nuevamente.');
        }
      });
  }

  delete(medicine: Medicine): void {
    const id = medicine.id;
    if (id == null) {
      return;
    }

    this.medicineService.deleteMedicine(id).subscribe({
      next: () => {
        this.removeMedicineFromTable(id);
        this.snackBar.openSuccess('Medicina eliminada exitosamente');
      },
      error: () => {
        this.snackBar.openError('No fue posible eliminar la medicina. Intenta nuevamente.');
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

  private loadMedicines(): void {
    this.loading = true;
    this.medicineService.getMedicines()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (medicines) => {
          this.medicines = medicines ?? [];
          this.refreshTable(true);
        },
        error: () => {
          this.medicines = [];
          this.refreshTable(true);
        }
      });
  }

  private refreshTable(resetPage = false): void {
    this.syncRowForms(this.medicines);
    this.dataSource.data = [...this.medicines];
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      if (resetPage) {
        this.paginator.firstPage();
      }
    }
  }

  private syncRowForms(medicines: Medicine[]): void {
    const existingIds = new Set(Object.keys(this.rowForms));
    medicines.forEach(medicine => {
      if (medicine.id == null) {
        return;
      }
      existingIds.delete(medicine.id.toString());
      this.ensureRowForm(medicine);
    });
    existingIds.forEach(id => delete this.rowForms[id]);
  }

  private ensureRowForm(medicine: Medicine): void {
    const id = medicine.id;
    if (id == null) {
      return;
    }
    const key = id.toString();
    const existing = this.rowForms[key];
    if (existing) {
      existing.setValue({ name: medicine.name }, { emitEvent: false });
      return;
    }
    this.rowForms[key] = this.fb.group({
      name: [medicine.name, [Validators.required, Validators.maxLength(80)]]
    });
  }

  private applyMedicineUpdate(updated: Medicine): void {
    if (updated.id == null) {
      return;
    }
    const index = this.medicines.findIndex(item => item.id === updated.id);
    if (index !== -1) {
      this.medicines[index] = { ...this.medicines[index], ...updated };
      this.refreshTable();
    }
  }

  private removeMedicineFromTable(id: number): void {
    this.medicines = this.medicines.filter(item => item.id !== id);
    delete this.rowForms[id.toString()];
    if (this.editingId === id) {
      this.editingId = null;
    }
    if (this.savingId === id) {
      this.savingId = null;
    }
    this.refreshTable(true);
  }

  private prependMedicine(medicine: Medicine): void {
    this.medicines = [medicine, ...this.medicines];
    this.refreshTable(true);
  }
}
