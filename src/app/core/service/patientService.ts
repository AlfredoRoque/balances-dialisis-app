import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { PatientResponse } from "../../shared/models/patients/patientResponse";
import { PatientRequest } from "../../shared/models/patients/patientRequest";

@Injectable({ providedIn: 'root' })
export class PatientService {

  private API = 'http://localhost:8082/api/patients';

  constructor(private http: HttpClient) {}

  getPatients(userId: string) {
    return this.http.get<PatientResponse[]>(`${this.API}/users/${userId}`);
  }

  updatePatient(patientId: string, payload: PatientRequest) {
    return this.http.patch<PatientResponse>(`${this.API}/${patientId}`, payload);
  }

  createPatient(payload: PatientRequest) {
    return this.http.post<PatientResponse>(`${this.API}/save`, payload);
  }

  deletePatient(patientId: string) {
    return this.http.delete<void>(`${this.API}/${patientId}`);
  }
}