import { AfterViewInit, Component, ViewChild } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from "../../../core/service/AuthService";
import { PatientService } from "../../../core/service/patientService";
import { Utility } from "../../../core/service/util/utility";
import { PatientResponse } from "../../../shared/models/patients/patientResponse";
import { PatientRequest } from "../../../shared/models/patients/patientRequest";
import { BagType } from "../../../shared/models/BagType";
import { BagTypeService } from "../../../core/service/bagTypeService";
import { VitalSignFormComponent } from "../vital-sign-form/vital-sign-form.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    VitalSignFormComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements AfterViewInit {
  displayedColumns = ['patient', 'age', 'bagType', 'actions'];

  patients: PatientResponse[] = [];
  dataSource = new MatTableDataSource<PatientResponse>([]);
  bagTypes: BagType[] = [];
  bagTypesLoading = false;
  newPatientForm: FormGroup;
  creatingPatient = false;
  currentUserId: number | null = null;

  rowForms: Record<string, FormGroup> = {};
  editingPatientId: string | null = null;
  savingPatientId: string | null = null;
  decodedToken: any = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private authService: AuthService,
    private utility: Utility,
    private patientService: PatientService,
    private bagTypeService: BagTypeService,
    private fb: FormBuilder
  ) {
    this.newPatientForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      age: [null, [Validators.required, Validators.min(0), Validators.max(120)]],
      bagTypeId: [null, [Validators.required]]
    });

    const token = this.authService.getToken();
    if (token) {
      this.decodedToken = this.utility.decodeToken(token);
      const derivedUserId = Number(this.decodedToken?.jti ?? this.decodedToken?.id ?? this.decodedToken?.sub);
      this.currentUserId = Number.isFinite(derivedUserId) ? derivedUserId : null;
      this.patientService.getPatients(this.decodedToken.jti).subscribe({
        next: (data) => {
          this.patients = data;
          this.refreshTable(true);
        }
      });
    }

    this.loadBagTypes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  logout(): void {
    this.authService.logout();
  }

  startEdit(patient: PatientResponse): void {
    this.ensureRowForm(patient);
    this.editingPatientId = patient.id;
  }

  cancelEdit(patient: PatientResponse): void {
    const form = this.rowForms[patient.id];
    if (form) {
      form.patchValue({
        name: patient.name,
        age: patient.age,
        bagTypeId: patient.bagType?.id ?? null
      });
    }
    this.editingPatientId = null;
  }

  savePatient(patient: PatientResponse): void {
    const form = this.rowForms[patient.id];
    if (!form || form.invalid) {
      form?.markAllAsTouched();
      return;
    }

    const { name, age, bagTypeId } = form.value;
    if (bagTypeId == null || bagTypeId === '') {
      form.get('bagTypeId')?.setErrors({ required: true });
      form.get('bagTypeId')?.markAsTouched();
      return;
    }
    const normalizedBagTypeId = Number(bagTypeId);
    const payload: PatientRequest = {
      name,
      age,
      userId: patient.userId,
      bagTypeId: normalizedBagTypeId,
      status: patient.status
    };

    this.savingPatientId = patient.id;
    this.patientService.updatePatient(patient.id, payload)
      .pipe(finalize(() => this.savingPatientId = null))
      .subscribe({
        next: (updated) => {
          const resolvedBagType = updated?.bagType
            || this.bagTypes.find(b => b.id === normalizedBagTypeId)
            || patient.bagType
            || { id: normalizedBagTypeId, type: 'Sin asignar', description: '' };
          this.applyPatientUpdate(updated ?? { ...patient, name, age, bagType: resolvedBagType });
          this.editingPatientId = null;
        },
        error: () => {
          form.patchValue({
            name: patient.name,
            age: patient.age,
            bagTypeId: patient.bagType?.id ?? null
          });
        }
      });
  }

  deletePatient(patient: PatientResponse): void {
    this.patientService.deletePatient(patient.id).subscribe({
      next: () => this.removePatientFromTable(patient)
    });
  }

  private removePatientFromTable(patient: PatientResponse): void {
    this.patients = this.patients.filter(p => p.id !== patient.id);
    delete this.rowForms[patient.id];
    if (this.editingPatientId === patient.id) {
      this.editingPatientId = null;
    }
    if (this.savingPatientId === patient.id) {
      this.savingPatientId = null;
    }
    this.refreshTable(true);
  }

  addPatient(): void {
    this.submitNewPatient();
  }

  isEditing(patientId: string): boolean {
    return this.editingPatientId === patientId;
  }

  private refreshTable(resetPage = false): void {
    this.syncRowForms(this.patients);
    this.dataSource.data = [...this.patients];
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      if (resetPage) {
        this.paginator.firstPage();
      }
    }
  }

  private syncRowForms(patients: PatientResponse[]): void {
    const knownIds = new Set(Object.keys(this.rowForms));
    patients.forEach(patient => {
      knownIds.delete(patient.id);
      this.ensureRowForm(patient);
    });
    // Remove forms for patients no longer present
    knownIds.forEach(id => delete this.rowForms[id]);
  }

  private ensureRowForm(patient: PatientResponse): void {
    const existing = this.rowForms[patient.id];
    if (existing) {
      existing.setValue({
        name: patient.name,
        age: patient.age,
        bagTypeId: patient.bagType?.id ?? null
      }, { emitEvent: false });
      return;
    }
    this.rowForms[patient.id] = this.fb.group({
      name: [patient.name, [Validators.required, Validators.maxLength(80)]],
      age: [patient.age, [Validators.required, Validators.min(0), Validators.max(120)]],
      bagTypeId: [patient.bagType?.id ?? null, [Validators.required]]
    });
  }

  private applyPatientUpdate(updated: PatientResponse): void {
    const index = this.patients.findIndex(p => p.id === updated.id);
    if (index !== -1) {
      this.patients[index] = { ...this.patients[index], ...updated };
      this.refreshTable();
    }
  }

  private loadBagTypes(): void {
    this.bagTypesLoading = true;
    this.bagTypeService.getBagTypes()
      .pipe(finalize(() => this.bagTypesLoading = false))
      .subscribe({
        next: (types) => {
          this.bagTypes = types;
          this.ensureDefaultBagTypeSelection();
        },
        error: () => this.bagTypes = []
      });
  }

  private submitNewPatient(): void {
    if (!this.currentUserId) {
      console.warn('No se pudo determinar el usuario actual para registrar pacientes.');
      return;
    }

    if (this.newPatientForm.invalid) {
      this.newPatientForm.markAllAsTouched();
      return;
    }

    const { name, age, bagTypeId } = this.newPatientForm.value;
    const normalizedBagTypeId = Number(bagTypeId);

    const payload: PatientRequest = {
      name,
      age,
      bagTypeId: normalizedBagTypeId,
      userId: this.currentUserId,
      status: null
    };

    this.creatingPatient = true;
    this.patientService.createPatient(payload)
      .pipe(finalize(() => this.creatingPatient = false))
      .subscribe({
        next: (created) => {
          this.patients = [created, ...this.patients];
          this.refreshTable(true);
          this.newPatientForm.reset({
            name: '',
            age: null,
            bagTypeId: this.bagTypes[0]?.id ?? null
          });
        },
        error: (error) => {
          console.error('Error al crear paciente:', error);
        }
      });
  }

  private ensureDefaultBagTypeSelection(): void {
    const control = this.newPatientForm.get('bagTypeId');
    if (!control) {
      return;
    }
    const current = control.value;
    if ((current === null || current === undefined || current === '') && this.bagTypes.length) {
      control.setValue(this.bagTypes[0].id);
    }
  }
}
