import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MedicineDetail } from "../../shared/models/MedicineDetail";

@Injectable({ providedIn: 'root' })
export class MedicineDetailService {

  private API = 'http://localhost:8082/api/medicines/details';

  constructor(private http: HttpClient) {}

  createMedicineDetail(payload: MedicineDetail) {
    return this.http.post<MedicineDetail>(`${this.API}/save`, payload);
  }

  updateMedicineDetail(medicineDetailId: number, payload: MedicineDetail) {
      return this.http.patch<MedicineDetail>(`${this.API}/${medicineDetailId}`, payload);
    }
  
    deleteMedicineDetail(medicineDetailId: number) {
      return this.http.delete<void>(`${this.API}/${medicineDetailId}`);
    }

     getMedicineDetails(patientId: number) {
    return this.http.get<MedicineDetail[]>(`${this.API}/patients/${patientId}`);
  }
}