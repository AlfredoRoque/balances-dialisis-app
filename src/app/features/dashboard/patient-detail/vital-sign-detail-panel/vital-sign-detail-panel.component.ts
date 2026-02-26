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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, finalize, takeUntil } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { VitalSignDetail } from '../../../../shared/models/VitalSignDetail';
import { VitalSignDetailService } from '../../../../core/service/VitalSignDetailService';
import { VitalSign } from '../../../../shared/models/VitalSign';
import { VitalSignService } from '../../../../core/service/VitalSignService';
import { SnackbarService } from "../../../../core/service/component/snackbar.service";

interface VitalSignDetailRecord extends VitalSignDetail {
  id?: number;
  vitalSignDetailId?: number;
}

@Component({
  selector: 'app-vital-sign-detail-panel',
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
  templateUrl: './vital-sign-detail-panel.component.html',
  styleUrls: ['./vital-sign-detail-panel.component.scss']
})
export class VitalSignDetailPanelComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) patientId!: number;
  @Input() filterStart: Date | null = null;
  @Input() filterEnd: Date | null = null;

  displayedColumns = ['date', 'vitalSign', 'value', 'actions'];
  dataSource = new MatTableDataSource<VitalSignDetailRecord>([]);

  createForm: FormGroup;
  rowForms: Record<string, FormGroup> = {};

  loading = false;
  creating = false;
  savingId: number | null = null;
  editingId: number | null = null;

  vitalSigns: VitalSign[] = [];
  vitalSignsLoading = false;

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly fb: FormBuilder,
    private readonly vitalSignDetailService: VitalSignDetailService,
    private readonly vitalSignService: VitalSignService,
    private readonly snackBar: SnackbarService
  ) {
    this.createForm = this.fb.group({
      date: [new Date(), Validators.required],
      vitalSignId: [null, Validators.required],
      value: ['', [Validators.required, Validators.maxLength(120)]]
    });
  }

  ngOnInit(): void {
    this.loadVitalSigns();
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
      ? this.vitalSignDetailService.getRangeVitalSignDetails(this.patientId, start!, end!)
      : this.vitalSignDetailService.getActualVitalSignDetails(this.patientId);

    request$
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading = false))
      .subscribe({
        next: details => {
          this.dataSource.data = this.normalizeRecords(details);
          this.syncRowForms(this.dataSource.data);
        },
        error: () => this.openSnack('No pudimos cargar los signos vitales.', true)
      });
  }

  loadVitalSigns(): void {
    this.vitalSignsLoading = true;
    this.vitalSignService.getVitalSigns()
      .pipe(takeUntil(this.destroy$), finalize(() => this.vitalSignsLoading = false))
      .subscribe({
        next: signs => this.vitalSigns = signs ?? [],
        error: () => {
          this.vitalSigns = [];
          this.openSnack('No pudimos cargar el catálogo de signos vitales.', true);
        }
      });
  }

  startEdit(record: VitalSignDetailRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      this.openSnack('No pudimos editar este registro.', true);
      return;
    }
    this.ensureRowForm(record);
    this.editingId = id;
  }

  cancelEdit(record: VitalSignDetailRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      return;
    }
    const form = this.rowForms[this.rowKey(id)];
    if (form) {
      form.setValue({
        date: record.date ? new Date(record.date) : null,
        vitalSignId: this.extractVitalSignId(record),
        value: record.value ?? ''
      }, { emitEvent: false });
    }
    this.editingId = null;
  }

  saveRecord(record: VitalSignDetailRecord): void {
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
    this.vitalSignDetailService.updateVitalSignDetail(id, payload)
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

  deleteRecord(record: VitalSignDetailRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      this.openSnack('No pudimos eliminar este registro.', true);
      return;
    }
    this.snackBar.confirm('¿Seguro que deseas eliminar este signo vital registrado?')
      .subscribe(confirmed => {
        if (!confirmed) {
          return;
        }

        this.vitalSignDetailService.deleteVitalSignDetail(id)
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
    this.vitalSignDetailService.createVitalSignDetail(payload)
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
      vitalSignId: null,
      value: ''
    });
  }

  isEditing(record: VitalSignDetailRecord): boolean {
    const id = this.extractRecordId(record);
    return id !== null && id === this.editingId;
  }

  shouldShowDateDivider(index: number): boolean {
    const current = this.getRenderedRow(index);
    const previous = this.getRenderedRow(index - 1);
    if (!current || !previous) {
      return false;
    }
    return this.buildDateKey(current.date) !== this.buildDateKey(previous.date);
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

  getRowForm(record: VitalSignDetailRecord): FormGroup | null {
    const id = this.extractRecordId(record);
    return id === null ? null : this.rowForms[this.rowKey(id)] ?? null;
  }

  getVitalSignLabel(record: VitalSignDetailRecord): string {
    if (record?.vitalSign?.name) {
      return record.vitalSign.name;
    }
    const id = this.extractVitalSignId(record);
    if (id) {
      return this.findSignById(id)?.name ?? `Signo #${id}`;
    }
    return 'Sin signo';
  }

  private normalizeRecords(records: VitalSignDetailRecord[]): VitalSignDetailRecord[] {
    return records.map(record => ({
      ...record,
      date: record.date ? new Date(record.date) : null
    }));
  }

  private mapFormToPayload(formValue: any): VitalSignDetail {
    const baseDate = formValue.date ? new Date(formValue.date) : null;
    return {
      patientId: formValue.patientId ?? this.patientId,
      vitalSign: this.buildVitalSignPayload(formValue.vitalSignId),
      value: (formValue.value ?? '').toString().trim(),
      date: baseDate ? baseDate : null
    };
  }

  private ensureRowForm(record: VitalSignDetailRecord): void {
    const id = this.extractRecordId(record);
    if (id === null) {
      return;
    }

    const key = this.rowKey(id);
    if (!this.rowForms[key]) {
      this.rowForms[key] = this.fb.group({
        date: [record.date ? new Date(record.date) : null, Validators.required],
        vitalSignId: [this.extractVitalSignId(record), Validators.required],
        value: [record.value ?? '', [Validators.required, Validators.maxLength(120)]]
      });
    }
  }

  private syncRowForms(records: VitalSignDetailRecord[]): void {
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
          vitalSignId: this.extractVitalSignId(record),
          value: record.value ?? ''
        }, { emitEvent: false });
      } else {
        this.ensureRowForm(record);
      }
    });
    knownIds.forEach(id => delete this.rowForms[id]);
  }

  private extractRecordId(record: VitalSignDetailRecord): number | null {
    const candidate = (record as any).id ?? record.vitalSignDetailId ?? null;
    return candidate == null ? null : Number(candidate);
  }

  private extractVitalSignId(record: VitalSignDetailRecord): number | null {
    return record?.vitalSign?.id ?? null;
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
     if (isError) {
      this.snackBar.openError(message);
    }else {
      this.snackBar.openSuccess(message);
    }
  }

  private buildVitalSignPayload(rawId: unknown): VitalSign {
    const id = Number(rawId);
    const fallback: VitalSign = { name: '', userId: 0 };
    if (!Number.isFinite(id)) {
      return fallback;
    }
    return this.findSignById(id) ?? { id, name: '', userId: 0 };
  }

  private findSignById(id: number): VitalSign | undefined {
    return this.vitalSigns.find(sign => sign.id === id);
  }

  private getRenderedRow(index: number): VitalSignDetailRecord | null {
    if (index < 0) {
      return null;
    }
    const dataset = this.dataSource.filteredData ?? [];
    if (!dataset.length) {
      return null;
    }
    const pageSize = this.resolvePageSize(dataset.length);
    const pageIndex = this.paginator?.pageIndex ?? 0;
    const globalIndex = (pageIndex * pageSize) + index;
    if (globalIndex < 0 || globalIndex >= dataset.length) {
      return null;
    }
    return dataset[globalIndex] ?? null;
  }

  private resolvePageSize(fallback: number): number {
    const pageSize = this.paginator?.pageSize ?? fallback;
    return pageSize > 0 ? pageSize : fallback;
  }

  private buildDateKey(value: Date | string | null): string {
    const date = this.toDate(value);
    if (!date) {
      return 'invalid';
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDate(value: Date | string | null): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
