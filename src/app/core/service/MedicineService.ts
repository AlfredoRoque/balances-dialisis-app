import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Medicine } from "../../shared/models/Medicine";

@Injectable({ providedIn: 'root' })
export class MedicineService {

  private API = 'http://localhost:8082/api/medicines';

  constructor(private http: HttpClient) {}

  getMedicines() {
    return this.http.get<Medicine[]>(`${this.API}`);
  }

  createMedicine(payload: Medicine) {
    return this.http.post<Medicine>(`${this.API}/save`, payload);
  }

  updateMedicine(medicineId: number, payload: Medicine) {
      return this.http.patch<Medicine>(`${this.API}/${medicineId}`, payload);
    }
  
    deleteMedicine(medicineId: number) {
      return this.http.delete<void>(`${this.API}/${medicineId}`);
    }
}