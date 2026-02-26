import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MedicineDetail } from "../../shared/models/MedicineDetail";
import { Utility } from "./util/utility";

@Injectable({ providedIn: 'root' })
export class MedicineDetailService {

  private API = '';

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/medicines/details`;
  }

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