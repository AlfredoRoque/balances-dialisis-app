import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { Subject, finalize, takeUntil } from 'rxjs';
import { MedicineDetail } from '../../../../shared/models/MedicineDetail';
import { MedicineDetailService } from '../../../../core/service/MedicineDetailService';
import { Medicine } from '../../../../shared/models/Medicine';
import { MedicineService } from '../../../../core/service/MedicineService';

interface MedicineDetailRecord extends MedicineDetail {
  id?: number;
  medicineDetailId?: number;
}

@Component({
  selector: 'app-medicine-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './medicine-detail-panel.component.html',
  styleUrls: ['./medicine-detail-panel.component.scss']
})
export class MedicineDetailPanelComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) patientId!: number;

  displayedColumns = ['date', 'medicine', 'dose', 'frequency', 'actions'];
  dataSource = new MatTableDataSource<MedicineDetailRecord>([]);

  createForm: FormGroup;
  rowForms: Record<string, FormGroup> = {};

  loading = false;
  creating = false;
  savingId: number | null = null;
  editingId: number | null = null;

  medicines: Medicine[] = [];
  medicinesLoading = false;

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly fb: FormBuilder,
    private readonly medicineDetailService: MedicineDetailService,
    private readonly medicineService: MedicineService,
    private readonly snackBar: MatSnackBar
  ) {
    this.createForm = this.fb.group({
      date: [new Date(), Validators.required],
      medicineId: [null, Validators.required],
      dose: ['', [Validators.required, Validators.maxLength(120)]],
      frequency: ['', [Validators.required, Validators.maxLength(120)]]
    });
  }

  ngOnInit(): void {
    this.loadMedicines();
    if (this.patientId) {
      this.loadRecords();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange) {
      this.loadRecords();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRecords(): void {
    if (!this.patientId) {
      return;
    }
    this.loading = true;
    this.medicineDetailService.getMedicineDetails(this.patientId)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading = false))
      .subscribe({
        next: details => {
          this.dataSource.data = this.normalizeRecords(details);
          this.syncRowForms(this.dataSource.data);
        },
        error: () => this.openSnack('No pudimos cargar los medicamentos.', true)
      });
  }

  loadMedicines(): void {
    this.medicinesLoading = true;
    this.medicineService.getMedicines()
      .pipe(takeUntil(this.destroy$), finalize(() => this.medicinesLoading = false))
      .subscribe({
        next: meds => this.medicines = meds ?? [],
        error: () => {
          this.medicines = [];
          this.openSnack('No pudimos cargar el catálogo de medicamentos.', true);
        }
      });
  }

  startEdit(record: MedicineDetailRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      this.openSnack('No pudimos editar este registro.', true);
      return;
    }
    this.ensureRowForm(record);
    this.editingId = id;
  }

  cancelEdit(record: MedicineDetailRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      return;
    }
    const form = this.rowForms[this.rowKey(id)];
    if (form) {
      form.setValue({
        date: record.date ? new Date(record.date) : null,
        medicineId: this.extractMedicineId(record),
        dose: record.dose ?? '',
        frequency: record.frequency ?? ''
      }, { emitEvent: false });
    }
    this.editingId = null;
  }

  saveRecord(record: MedicineDetailRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      this.openSnack('No pudimos actualizar este registro.', true);
      return;
    }

    const form = this.rowForms[this.rowKey(id)];
    if (!form) {
      return;
    }

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const payload = this.mapFormToPayload(form.value);
    this.savingId = id;
    this.medicineDetailService.updateMedicineDetail(id, payload)
      .pipe(finalize(() => this.savingId = null))
      .subscribe({
        next: () => {
          this.editingId = null;
          this.openSnack('Registro actualizado.');
          this.loadRecords();
        },
        error: () => this.openSnack('No pudimos actualizar el registro.', true)
      });
  }

  deleteRecord(record: MedicineDetailRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      this.openSnack('No pudimos eliminar este registro.', true);
      return;
    }

    this.medicineDetailService.deleteMedicineDetail(id)
      .subscribe({
        next: () => {
          if (this.editingId === id) {
            this.editingId = null;
          }
          this.openSnack('Registro eliminado.');
          this.loadRecords();
        },
        error: () => this.openSnack('No pudimos eliminar este registro.', true)
      });
  }

  submitCreate(): void {
    if (!this.patientId) {
      this.openSnack('Paciente no válido.', true);
      return;
    }

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const payload = this.mapFormToPayload({ ...this.createForm.value, patientId: this.patientId });
    this.creating = true;
    this.medicineDetailService.createMedicineDetail(payload)
      .pipe(finalize(() => this.creating = false))
      .subscribe({
        next: () => {
          this.resetCreateForm();
          this.openSnack('Registro agregado correctamente.');
          this.loadRecords();
        },
        error: () => this.openSnack('No pudimos agregar el registro.', true)
      });
  }

  resetCreateForm(): void {
    this.createForm.reset({
      date: new Date(),
      medicineId: null,
      dose: '',
      frequency: ''
    });
  }

  isEditing(record: MedicineDetailRecord): boolean {
    const id = this.extractRecordId(record);
    return id !== null && id === this.editingId;
  }

  formatRecordDate(value: Date | string | null): string {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return 'Sin fecha';
    }
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date).replace(',', ' ·');
  }

  getRowForm(record: MedicineDetailRecord): FormGroup | null {
    const id = this.extractRecordId(record);
    return id === null ? null : this.rowForms[this.rowKey(id)] ?? null;
  }

  getMedicineLabel(record: MedicineDetailRecord): string {
    if (record?.medicine?.name) {
      return record.medicine.name;
    }
    const id = this.extractMedicineId(record);
    if (id) {
      return this.findMedicineById(id)?.name ?? `Medicamento #${id}`;
    }
    return 'Sin medicamento';
  }

  private normalizeRecords(records: MedicineDetailRecord[]): MedicineDetailRecord[] {
    return records.map(record => ({
      ...record,
      date: record.date ? new Date(record.date) : null
    }));
  }

  private mapFormToPayload(formValue: any): MedicineDetail {
    const baseDate = formValue.date ? new Date(formValue.date) : null;
    return {
      patientId: formValue.patientId ?? this.patientId,
      medicine: this.buildMedicinePayload(formValue.medicineId),
      dose: (formValue.dose ?? '').toString().trim(),
      frequency: (formValue.frequency ?? '').toString().trim(),
      date: baseDate ? this.toUtcIsoString(baseDate) : null
    };
  }

  private ensureRowForm(record: MedicineDetailRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      return;
    }

    const key = this.rowKey(id);
    if (!this.rowForms[key]) {
      this.rowForms[key] = this.fb.group({
        date: [record.date ? new Date(record.date) : null, Validators.required],
        medicineId: [this.extractMedicineId(record), Validators.required],
        dose: [record.dose ?? '', [Validators.required, Validators.maxLength(120)]],
        frequency: [record.frequency ?? '', [Validators.required, Validators.maxLength(120)]]
      });
    }
  }

  private syncRowForms(records: MedicineDetailRecord[]): void {
    const knownIds = new Set(Object.keys(this.rowForms));
    records.forEach(record => {
      const id = this.extractRecordId(record);
      if (id === null) {
        return;
      }
      const key = this.rowKey(id);
      knownIds.delete(key);
      const form = this.rowForms[key];
      if (form) {
        form.setValue({
          date: record.date ? new Date(record.date) : null,
          medicineId: this.extractMedicineId(record),
          dose: record.dose ?? '',
          frequency: record.frequency ?? ''
        }, { emitEvent: false });
      } else {
        this.ensureRowForm(record);
      }
    });
    knownIds.forEach(id => delete this.rowForms[id]);
  }

  private extractRecordId(record: MedicineDetailRecord): number | null {
    const candidate = (record as any).id ?? record.medicineDetailId ?? null;
    return candidate == null ? null : Number(candidate);
  }

  private extractMedicineId(record: MedicineDetailRecord): number | null {
    return record?.medicine?.id ?? null;
  }

  private rowKey(id: number): string {
    return id.toString();
  }

  private toUtcIsoString(date: Date): string {
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      0,
      0
    ));
    return utcDate.toISOString();
  }

  private buildMedicinePayload(rawId: unknown): Medicine {
    const id = Number(rawId);
    const fallback: Medicine = { name: '', userId: 0 };
    if (!Number.isFinite(id)) {
      return fallback;
    }
    return this.findMedicineById(id) ?? { id, name: '', userId: 0 };
  }

  private findMedicineById(id: number): Medicine | undefined {
    return this.medicines.find(med => med.id === id);
  }

  private openSnack(message: string, isError = false): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: [isError ? 'snackbar-error' : 'snackbar-success']
    });
  }
}
