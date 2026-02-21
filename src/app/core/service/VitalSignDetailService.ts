import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { VitalSignDetail } from "../../shared/models/VitalSignDetail";
import { Utility } from "./util/utility";

@Injectable({ providedIn: 'root' })
export class VitalSignDetailService {

  private API = 'http://localhost:8082/api/vital-signs/details';

  constructor(private http: HttpClient, private utility: Utility) {}

  createVitalSignDetail(payload: VitalSignDetail) {
    return this.http.post<VitalSignDetail>(`${this.API}/save`, payload);
  }

  updateVitalSignDetail(vitalSignId: number, payload: VitalSignDetail) {
      return this.http.patch<VitalSignDetail>(`${this.API}/${vitalSignId}`, payload);
    }
  
    deleteVitalSignDetail(vitalSignId: number) {
      return this.http.delete<void>(`${this.API}/${vitalSignId}`);
    }

    getActualVitalSignDetails(patientId: number) {
    return this.http.get<VitalSignDetail[]>(`${this.API}/patients/${patientId}/actual-date`,{
        params: { actualDate: this.utility.getToday().toISOString() }
    });
  }

   getRangeVitalSignDetails(patientId: number, startDate: Date, endDate: Date) {
    return this.http.get<VitalSignDetail[]>(`${this.API}/patients/${patientId}/dates`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    });
  }
}