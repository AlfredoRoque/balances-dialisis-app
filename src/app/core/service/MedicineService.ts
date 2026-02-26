import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Medicine } from "../../shared/models/Medicine";
import { Utility } from "./util/utility";

@Injectable({ providedIn: 'root' })
export class MedicineService {

  private API = '';

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/medicines`;
  }

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