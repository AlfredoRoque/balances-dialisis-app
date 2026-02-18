import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { VitalSign } from "../../shared/models/VitalSign";

@Injectable({ providedIn: 'root' })
export class VitalSignService {

  private API = 'http://localhost:8082/api/vital-signs';

  constructor(private http: HttpClient) {}

  getVitalSigns() {
    return this.http.get<VitalSign[]>(`${this.API}`);
  }

  createVitalSign(payload: VitalSign) {
    return this.http.post<VitalSign>(`${this.API}/save`, payload);
  }

  updateVitalSign(vitalSignId: number, payload: VitalSign) {
      return this.http.patch<VitalSign>(`${this.API}/${vitalSignId}`, payload);
    }
  
    deleteVitalSign(vitalSignId: number) {
      return this.http.delete<void>(`${this.API}/${vitalSignId}`);
    }
}