import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, Router } from '@angular/router';
import { CalculatedFluidBalanceService } from '../../../../core/service/CalculatedFluidBalanceService';
import { CalculatedFluidBalance } from '../../../../shared/models/CalculatedFluidBalance';
import { FluidBalanceReport } from '../../../../shared/models/FluidBalanceReport';
import { LogoutButtonComponent } from '../../../../shared/components/logout-button/logout-button.component';
import { Subject, combineLatest, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-calculated-fluid-balance',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    LogoutButtonComponent
  ],
  templateUrl: './calculated-fluid-balance.component.html',
  styleUrls: ['./calculated-fluid-balance.component.scss']
})
export class CalculatedFluidBalanceComponent implements OnInit, OnDestroy {
  displayedColumns = ['date', 'description', 'infused', 'drained', 'ultrafiltration'];

  patientId!: number;
  patientName!: string | null;
  startDate: Date | null = null;
  endDate: Date | null = null;
  summaries: CalculatedFluidBalance[] = [];

  private readonly MAX_BALANCES = 15;

  loading = false;
  downloading = false;
  emailing = false;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly calculatedService: CalculatedFluidBalanceService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, query]) => {
        const resolvedId = Number(params.get('patientId'));
        const patientName = params.get('patientLabel') ?? null;
        if (!Number.isFinite(resolvedId) || resolvedId <= 0) {
          this.openSnack('Paciente no válido.', true);
          this.router.navigate(['/dashboard']);
          return;
        }
        this.patientId = resolvedId;
        this.patientName = patientName;
        this.startDate = this.parseDate(query.get('startDate'));
        this.endDate = this.parseDate(query.get('endDate'));
        this.loadCalculatedBalance();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCalculatedBalance(): void {
    if (!this.patientId) {
      return;
    }

    this.loading = true;
    const startArg = this.startDate ?? null;
    const endArg = this.endDate ?? null;

    this.calculatedService.getFluidBalancesByDates(this.patientId, startArg ?? undefined, endArg ?? undefined)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loading = false))
      .subscribe({
        next: payload => {
          this.summaries = this.normalizeSummaries(payload)
            .slice(0, this.MAX_BALANCES)
            .map(entry => ({
              ...entry,
              fluidBalances: this.normalizeReports(entry.fluidBalances ?? [])
            }));

          if (!this.hasData) {
            this.openSnack('No hay registros para este rango.', false);
          }
        },
        error: () => this.openSnack('No pudimos obtener el balance calculado.', true)
      });
  }

  downloadPdf(): void {
    if (!this.patientId || this.downloading) {
      return;
    }

    this.downloading = true;
    const startArg = this.startDate ?? null;
    const endArg = this.endDate ?? null;

    this.calculatedService.getPDFFluidBalancesByDates(this.patientId, startArg ?? undefined, endArg ?? undefined)
      .pipe(takeUntil(this.destroy$), finalize(() => this.downloading = false))
      .subscribe({
        next: blob => this.triggerDownload(blob),
        error: () => this.openSnack('No pudimos generar el PDF.', true)
      });
  }

  sendPdfByEmail(): void {
    if (!this.patientId || this.emailing) {
      return;
    }

    this.emailing = true;
    const startArg = this.startDate ?? null;
    const endArg = this.endDate ?? null;

    this.calculatedService.getPDFFluidBalancesByDatesToEmail(this.patientId, startArg ?? undefined, endArg ?? undefined)
      .pipe(takeUntil(this.destroy$), finalize(() => this.emailing = false))
      .subscribe({
        next: () => this.openSnack('Enviamos el balance al correo configurado.'),
        error: () => this.openSnack('No pudimos enviar el correo.', true)
      });
  }

  goBack(): void {
    if (!this.patientId) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.router.navigate(['/dashboard/patient', this.patientId]);
  }

  formatDate(value: Date | string | null): string {
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

  formatRange(): string {
    if (this.startDate && this.endDate) {
      return `${this.formatShort(this.startDate)} – ${this.formatShort(this.endDate)}`;
    }
    return 'Último corte (hoy)';
  }

  get hasData(): boolean {
    return this.summaries.some(summary => (summary.fluidBalances?.length ?? 0) > 0);
  }

  private parseDate(raw: string | null): Date | null {
    if (!raw) {
      return null;
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private normalizeSummaries(response: CalculatedFluidBalance | CalculatedFluidBalance[] | null | undefined): CalculatedFluidBalance[] {
    if (Array.isArray(response)) {
      return response;
    }
    return response ? [response] : [];
  }

  private normalizeReports(reports: FluidBalanceReport[]): FluidBalanceReport[] {
    return reports.map(report => ({
      ...report,
      date: report.date ? new Date(report.date) : null
    }));
  }

  private formatShort(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  private openSnack(message: string, isError = false): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: [isError ? 'snackbar-error' : 'snackbar-success']
    });
  }

  private triggerDownload(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.buildPdfFileName();
    link.click();
    window.URL.revokeObjectURL(url);
    this.openSnack('PDF generado correctamente.');
  }

  private buildPdfFileName(): string {
    const prefix = `Balance_${this.patientName ? this.patientName.replace(/\s+/g, '_') : this.patientId}`;
    if (this.startDate && this.endDate) {
      return `${prefix}-${this.formatForFile(this.startDate)}-${this.formatForFile(this.endDate)}.pdf`;
    }
    return `${prefix}-${this.formatForFile(new Date())}.pdf`;
  }

  private formatForFile(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
