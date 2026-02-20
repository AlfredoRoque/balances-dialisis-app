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
import { Subject, finalize, takeUntil } from 'rxjs';
import { ExtraFluid } from '../../../../shared/models/ExtraFluid';
import { ExtraFluidService } from '../../../../core/service/ExtraFluidService';

interface ExtraFluidRecord extends ExtraFluid {
  id?: number;
  extraFluidId?: number;
}

@Component({
  selector: 'app-extra-fluid-panel',
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
    ReactiveFormsModule
  ],
  templateUrl: './extra-fluid-panel.component.html',
  styleUrls: ['./extra-fluid-panel.component.scss']
})
export class ExtraFluidPanelComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) patientId!: number;
  @Input() filterStart: Date | null = null;
  @Input() filterEnd: Date | null = null;

  displayedColumns = ['date', 'urine', 'ingested', 'actions'];
  dataSource = new MatTableDataSource<ExtraFluidRecord>([]);

  loading = false;
  creating = false;
  savingId: number | null = null;
  editingId: number | null = null;

  createForm: FormGroup;
  rowForms: Record<string, FormGroup> = {};

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly extraFluidService: ExtraFluidService,
    private readonly fb: FormBuilder,
    private readonly snackBar: MatSnackBar
  ) {
    this.createForm = this.fb.group({
      date: [new Date(), Validators.required],
      urine: [null, [Validators.required, Validators.min(0)]],
      ingested: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.patientId) {
      this.loadRecords();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const patientChanged = !!changes['patientId'] && !changes['patientId'].firstChange;
    const filterStartChanged = !!changes['filterStart'] && !this.areDatesEqual(changes['filterStart'].previousValue, changes['filterStart'].currentValue);
    const filterEndChanged = !!changes['filterEnd'] && !this.areDatesEqual(changes['filterEnd'].previousValue, changes['filterEnd'].currentValue);

    if (patientChanged || filterStartChanged || filterEndChanged) {
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
    const start = this.filterStart ? new Date(this.filterStart) : null;
    const end = this.filterEnd ? new Date(this.filterEnd) : null;
    const hasValidFilter = !!start && !!end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());
    const request$ = hasValidFilter
      ? this.extraFluidService.getExtraFluidBalancesByDates(this.patientId, start!, end!)
      : this.extraFluidService.getExtraFluidBalances(this.patientId);

    request$
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading = false))
      .subscribe({
        next: records => {
          this.dataSource.data = this.normalizeRecords(records);
          this.syncRowForms(this.dataSource.data);
        },
        error: () => this.openSnack('No pudimos cargar los registros de extra fluidos.', true)
      });
  }

  startEdit(record: ExtraFluidRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      this.openSnack('No pudimos editar este registro.', true);
      return;
    }
    this.ensureRowForm(record);
    this.editingId = id;
  }

  cancelEdit(record: ExtraFluidRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      return;
    }
    const form = this.rowForms[this.rowKey(id)];
    if (form) {
      form.setValue({
        date: record.date ? new Date(record.date) : null,
        urine: record.urine,
        ingested: record.ingested
      }, { emitEvent: false });
    }
    this.editingId = null;
  }

  saveRecord(record: ExtraFluidRecord): void {
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
    this.extraFluidService.updateExtraFluidBalance(id, payload)
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

  deleteRecord(record: ExtraFluidRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      this.openSnack('No pudimos eliminar este registro.', true);
      return;
    }

    this.extraFluidService.deleteExtraFluidBalance(id)
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
    this.extraFluidService.createExtraFluidBalance({ ...payload, patientId: this.patientId })
      .pipe(finalize(() => this.creating = false))
      .subscribe({
        next: () => {
          this.createForm.reset({
            date: new Date(),
            urine: null,
            ingested: null
          });
          this.openSnack('Registro agregado correctamente.');
          this.loadRecords();
        },
        error: () => this.openSnack('No pudimos agregar el registro.', true)
      });
  }

  isEditing(record: ExtraFluidRecord): boolean {
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

  getRowForm(record: ExtraFluidRecord): FormGroup | null {
    const id = this.extractRecordId(record);
    return id === null ? null : this.rowForms[this.rowKey(id)] ?? null;
  }

  private normalizeRecords(records: ExtraFluidRecord[]): ExtraFluidRecord[] {
    return records.map(record => ({
      ...record,
      date: record.date ? new Date(record.date) : null
    }));
  }

  private mapFormToPayload(formValue: any): ExtraFluid {
    const baseDate = formValue.date ? new Date(formValue.date) : null;
    return {
      patientId: formValue.patientId ?? this.patientId,
      urine: Number(formValue.urine),
      ingested: Number(formValue.ingested),
      date: baseDate ? baseDate : null
    };
  }

  private ensureRowForm(record: ExtraFluidRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      return;
    }

    const key = this.rowKey(id);
    if (!this.rowForms[key]) {
      this.rowForms[key] = this.fb.group({
        date: [record.date ? new Date(record.date) : null, Validators.required],
        urine: [record.urine, [Validators.required, Validators.min(0)]],
        ingested: [record.ingested, [Validators.required, Validators.min(0)]]
      });
    }
  }

  private syncRowForms(records: ExtraFluidRecord[]): void {
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
          urine: record.urine,
          ingested: record.ingested
        }, { emitEvent: false });
      } else {
        this.ensureRowForm(record);
      }
    });
    knownIds.forEach(id => delete this.rowForms[id]);
  }

  private extractRecordId(record: ExtraFluidRecord): number | null {
    const candidate = record.id ?? record.extraFluidId ?? (record as any).fluidId ?? null;
    return candidate == null ? null : Number(candidate);
  }

  private rowKey(id: number): string {
    return id.toString();
  }

  private areDatesEqual(a: unknown, b: unknown): boolean {
    if (!a && !b) {
      return true;
    }
    if (!a || !b) {
      return false;
    }
    const first = new Date(a as any);
    const second = new Date(b as any);
    if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) {
      return false;
    }
    return first.getTime() === second.getTime();
  }

  private openSnack(message: string, isError = false): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: [isError ? 'snackbar-error' : 'snackbar-success']
    });
  }
}
