import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { VitalSign } from "../../shared/models/VitalSign";
import { Utility } from "./util/utility";

@Injectable({ providedIn: 'root' })
export class VitalSignService {

  private API = '';

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/vital-signs`;
  }

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