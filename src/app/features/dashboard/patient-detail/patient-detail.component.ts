import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';
import { FluidBalance } from '../../../shared/models/FluidBalance';
import { FluidBalanceService } from '../../../core/service/FluidBalanceService';
import { FluidDateService } from "../../../core/service/FluidDateService";
import { ExtraFluidPanelComponent } from "./extra-fluid-panel/extra-fluid-panel.component";
import { VitalSignDetailPanelComponent } from "./vital-sign-detail-panel/vital-sign-detail-panel.component";
import { MedicineDetailPanelComponent } from "./medicine-detail-panel/medicine-detail-panel.component";
import { LogoutButtonComponent } from '../../../shared/components/logout-button/logout-button.component';
import { SnackbarService } from "../../../core/service/component/snackbar.service";

interface FluidBalanceRecord extends FluidBalance {
  id?: number;
  fluidBalanceId?: number;
}

interface ActiveSlot {
  date: Date;
  label: string;
  rawTime: string;
}

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSelectModule,
    ReactiveFormsModule,
    ExtraFluidPanelComponent,
    VitalSignDetailPanelComponent,
    MedicineDetailPanelComponent,
    LogoutButtonComponent
  ],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.scss']
})
export class PatientDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['date', 'description', 'infused', 'drained', 'actions'];
  dataSource = new MatTableDataSource<FluidBalanceRecord>([]);

  filterForm: FormGroup;
  createForm: FormGroup;
  editForm: FormGroup;
  editFormSlots: ActiveSlot[] = [];

  patientId!: number;
  patientLabel = 'Paciente';
  balances: FluidBalanceRecord[] = [];

  loading = false;
  creating = false;
  savingBalanceId: number | null = null;
  editingBalanceId: number | null = null;
  activeDatesLoading = false;
  activeSlots: ActiveSlot[] = [];
  private activeTimeStrings: string[] = [];
  readonly today = this.buildToday();

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: SnackbarService,
    private readonly fluidBalanceService: FluidBalanceService,
    private readonly fluidDateService: FluidDateService
  ) {
    this.filterForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    });

    this.createForm = this.fb.group({
      slotDay: [this.buildToday(), Validators.required],
      date: [null, Validators.required],
      infused: [null, [Validators.required, Validators.min(0)]],
      drained: [null, [Validators.required, Validators.min(0)]],
      descriptionFluid: ['', [Validators.maxLength(150)]]
    });

    this.editForm = this.fb.group({
      date: [null, Validators.required],
      infused: [null, [Validators.required, Validators.min(0)]],
      drained: [null, [Validators.required, Validators.min(0)]],
      descriptionFluid: ['', [Validators.maxLength(150)]]
    });

    this.createForm.get('date')?.disable({ emitEvent: false });
    this.createForm.get('slotDay')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.onSlotDayChange(value));
  }

  get hasActiveDates(): boolean {
    return this.activeSlots.length > 0;
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = Number(params.get('patientId'));
      if (!Number.isFinite(id) || id <= 0) {
        this.openSnack('Paciente no válido', true);
        this.router.navigate(['/dashboard']);
        return;
      }
      this.patientId = id;
      const labelFromQuery = this.route.snapshot.queryParamMap.get('patientName');
      const resolvedLabel = labelFromQuery ?? params.get('patientName');
      if (resolvedLabel) {
        this.patientLabel = resolvedLabel;
      }
      this.loadActiveDates();
      this.loadBalances();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBalances(): void {
    this.loading = true;
    this.fluidBalanceService.getFluidBalances(this.patientId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: balances => {
          this.balances = this.normalizeBalances(balances);
          this.refreshTable(true);
        },
        error: () => this.openSnack('No pudimos cargar los balances.', true)
      });
  }

  loadActiveDates(): void {
    this.activeDatesLoading = true;
    this.fluidDateService.getActiveDates()
      .pipe(finalize(() => this.activeDatesLoading = false))
      .subscribe({
        next: dates => this.setActiveDates(dates),
        error: () => {
          this.setActiveDates([]);
          this.openSnack('No pudimos cargar las fechas activas.', true);
        }
      });
  }

  applyDateFilter(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    const { startDate, endDate } = this.filterForm.value;
    if (startDate && endDate && startDate > endDate) {
      this.openSnack('La fecha inicial no puede ser mayor que la final.', true);
      return;
    }
    this.loading = true;
    this.fluidBalanceService.getFluidBalancesByDates(this.patientId, startDate, endDate)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: balances => {
          this.balances = this.normalizeBalances(balances);
          this.refreshTable(true);
        },
        error: () => this.openSnack('No pudimos aplicar el filtro.', true)
      });
  }

  clearDateFilter(): void {
    this.filterForm.reset();
    this.loadBalances();
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const rawValue = this.createForm.getRawValue();
    if (!this.isAllowedSlot(rawValue.date)) {
      this.createForm.get('date')?.setErrors({ inactiveDate: true });
      this.createForm.get('date')?.markAsTouched();
      this.openSnack('Selecciona una fecha activa disponible.', true);
      return;
    }

    const selectedSlot = this.findSlotForValue(rawValue.date);
    if (!selectedSlot) {
      this.openSnack('Selecciona un horario válido.', true);
      return;
    }
    const payload = this.mapFormToPayload({ ...rawValue, date: selectedSlot.date });
    this.creating = true;
    this.fluidBalanceService.createFluidBalance({ ...payload, patientId: this.patientId })
      .pipe(finalize(() => this.creating = false))
      .subscribe({
        next: () => {
          this.openSnack('Balance agregado correctamente');
          this.resetCreateForm();
          this.loadActiveDates();
          this.loadBalances();
        },
        error: () => this.openSnack('No pudimos agregar el balance.', true)
      });
  }

  resetCreateForm(): void {
    this.createForm.reset({
      slotDay: this.buildToday(),
      date: null,
      infused: null,
      drained: null,
      descriptionFluid: ''
    });
    this.createForm.get('date')?.disable({ emitEvent: false });
    this.refreshSlotsForCurrentDay();
    this.updateCreateDateControlState();
  }

  startEdit(balance: FluidBalanceRecord): void {
    this.editingBalanceId = this.extractBalanceId(balance);
    const availableSlots = this.buildSlotsForDateFromValue(balance.date);
    this.editFormSlots = availableSlots;
    const initialSlot = this.findSlotForValue(balance.date, availableSlots);

    this.editForm.reset({
      date: initialSlot?.date ?? balance.date ?? null,
      infused: balance.infused,
      drained: balance.drained,
      descriptionFluid: balance.descriptionFluid
    });
  }

  cancelEdit(): void {
    this.editForm.reset();
    this.editingBalanceId = null;
    this.editFormSlots = [];
  }

  submitEdit(): void {
    if (this.editForm.invalid || !this.editingBalanceId) {
      this.editForm.markAllAsTouched();
      return;
    }

    if (!this.isAllowedSlot(this.editForm.value.date, this.editFormSlots)) {
      this.editForm.get('date')?.setErrors({ inactiveDate: true });
      this.openSnack('Selecciona un horario válido para este balance.', true);
      return;
    }

    const selectedSlot = this.findSlotForValue(this.editForm.value.date, this.editFormSlots);
    const payload = this.mapFormToPayload({ ...this.editForm.value, date: selectedSlot?.date ?? this.editForm.value.date });
    this.savingBalanceId = this.editingBalanceId;
    this.fluidBalanceService.updateFluidBalance(this.editingBalanceId, { ...payload, patientId: this.patientId })
      .pipe(finalize(() => this.savingBalanceId = null))
      .subscribe({
        next: () => {
          this.openSnack('Balance actualizado.');
          this.cancelEdit();
          this.loadBalances();
        },
        error: () => this.openSnack('No pudimos actualizar el balance.', true)
      });
  }

  deleteBalance(balance: FluidBalanceRecord): void {
    const balanceId = this.extractBalanceId(balance);
    if (!balanceId) {
      this.openSnack('No pudimos eliminar este registro.', true);
      return;
    }
    this.snackBar.confirm('¿Seguro que deseas eliminar este balance?')
      .subscribe(confirmed => {
        if (!confirmed) {
          return;
        }
        this.fluidBalanceService.deleteFluidBalance(balanceId)
          .subscribe({
            next: () => {
              this.openSnack('Balance eliminado.');
              this.loadBalances();
            },
            error: () => this.openSnack('No pudimos eliminar el balance.', true)
          });
      });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToCalculatedBalance(): void {
    if (!this.patientId) {
      return;
    }

    const startValue = this.filterForm.get('startDate')?.value;
    const endValue = this.filterForm.get('endDate')?.value;
    const extras: { queryParams?: { startDate: string; endDate: string } } = {};

    if (startValue && endValue) {
      const startDate = new Date(startValue);
      const endDate = new Date(endValue);
      if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
        extras.queryParams = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
      }
    }

    this.router.navigate(['/dashboard/patient', this.patientId, this.patientLabel, 'calculated-balance'], extras);
  }

  formatBalanceDate24(value: Date | string | null): string {
    const date = this.normalizeToDate(value);
    return date ? this.formatAs24HourLabel(date) : 'Sin fecha disponible';
  }

  isEditingBalance(balance: FluidBalanceRecord): boolean {
    const id = this.extractBalanceId(balance);
    return id !== null && id === this.editingBalanceId;
  }

  shouldShowDateDivider(index: number): boolean {
    const current = this.getRenderedRow(index);
    const previous = this.getRenderedRow(index - 1);
    if (!current || !previous) {
      return false;
    }
    return this.buildDateKey(current.date) !== this.buildDateKey(previous.date);
  }

  private setActiveDates(times: string[]): void {
    this.activeTimeStrings = [...times];
    const previousValue = this.createForm.get('date')?.value ?? null;
    this.refreshSlotsForCurrentDay();
    this.updateCreateDateControlState(previousValue);
  }

  private updateCreateDateControlState(previousValue?: unknown): void {
    const control: AbstractControl | null = this.createForm.get('date');
    if (!control) {
      return;
    }

    if (!this.hasActiveDates) {
      control.setValue(null, { emitEvent: false });
      control.disable({ emitEvent: false });
      return;
    }

    control.enable({ emitEvent: false });
    const candidateSlot = this.findSlotForValue(previousValue ?? control.value);

    if (candidateSlot) {
      control.setValue(candidateSlot.date, { emitEvent: false });
      if (control.hasError('inactiveDate')) {
        control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      }
    } else {
      control.setValue(null, { emitEvent: false });
    }
  }

  private buildSlotsForDate(baseDate: Date): ActiveSlot[] {
    if (!this.activeTimeStrings.length) {
      return [];
    }
    return this.activeTimeStrings
      .map(time => this.composeSlot(baseDate, time))
      .filter((slot): slot is ActiveSlot => !!slot)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private composeSlot(baseDate: Date, rawTime: string): ActiveSlot | null {
    if (!rawTime) {
      return null;
    }

    const [hoursRaw, minutesRaw = '0'] = rawTime.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (!Number.isFinite(hours) || hours < 0 || hours > 23) {
      return null;
    }

    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 59) {
      return null;
    }

    const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
    const normalizedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return {
      date,
      rawTime: normalizedTime,
      label: this.formatAs24HourLabel(date)
    };
  }

  private findSlotForValue(value: unknown, sourceSlots: ActiveSlot[] = this.activeSlots): ActiveSlot | null {
    const comparable = this.normalizeToDate(value);
    if (!comparable) {
      return null;
    }

    const timestamp = comparable.getTime();
    return sourceSlots.find(slot => slot.date.getTime() === timestamp) ?? null;
  }

  private isAllowedSlot(value: unknown, sourceSlots: ActiveSlot[] = this.activeSlots): boolean {
    return !!this.findSlotForValue(value, sourceSlots);
  }

  private normalizeToDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return new Date(value.getTime());
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private formatAs24HourLabel(date: Date): string {
    const formatted = new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
    return formatted.replace(',', ' ·');
  }

  private normalizeBalances(balances: FluidBalanceRecord[]): FluidBalanceRecord[] {
    return balances.map(balance => ({
      ...balance,
      date: balance.date ? new Date(balance.date) : null
    }));
  }

  private refreshTable(reset = false): void {
    this.dataSource.data = [...this.balances];
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      if (reset) {
        this.paginator.firstPage();
      }
    }
  }

  private mapFormToPayload(formValue: any): FluidBalance {
    const normalizedDate = this.normalizeToDate(formValue.date);
    return {
      date: normalizedDate ? normalizedDate : null,
      infused: Number(formValue.infused),
      drained: Number(formValue.drained),
      descriptionFluid: formValue.descriptionFluid ?? '',
      patientId: this.patientId
    };
  }

  private extractBalanceId(balance: FluidBalanceRecord): number | null {
    return balance.id ?? (balance as any).fluidBalanceId ?? null;
  }

  private openSnack(message: string, isError = false): void {
    if (isError) {
      this.snackBar.openError(message);
    }else {
      this.snackBar.openSuccess(message);
    }
  }

  private buildSlotsForDateFromValue(value: Date | string | null): ActiveSlot[] {
    const date = this.normalizeToDate(value);
    if (!date) {
      return [];
    }
    return this.buildSlotsForDate(date);
  }

  private onSlotDayChange(raw: unknown): void {
    this.refreshSlotsForCurrentDay();
    this.updateCreateDateControlState(this.createForm.get('date')?.value ?? null);
  }

  private refreshSlotsForCurrentDay(): void {
    const selectedDay = this.normalizeToDate(this.createForm.get('slotDay')?.value) ?? this.buildToday();
    this.activeSlots = this.buildSlotsForDate(selectedDay);
  }

  private buildToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getRenderedRow(index: number): FluidBalanceRecord | null {
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
    const date = this.normalizeToDate(value);
    if (!date) {
      return 'invalid';
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
