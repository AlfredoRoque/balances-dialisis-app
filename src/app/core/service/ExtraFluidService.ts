import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ExtraFluid } from "../../shared/models/ExtraFluid";
import { Utility } from "./util/utility";

@Injectable({ providedIn: 'root' })
export class ExtraFluidService {

  private API = 'http://localhost:8082/api/extra-fluids';

    constructor(private http: HttpClient, private utility: Utility) {}

    getExtraFluidBalances(patientId: number) {
       return this.http.get<ExtraFluid[]>(`${this.API}/patients/actual-date/${patientId}`,{
        params: { actualDate: this.utility.getToday().toISOString() }
       });
      }

    createExtraFluidBalance(payload: ExtraFluid) {
        console.log('Creating ExtraFluid with payload:', payload);
      return this.http.post<ExtraFluid>(`${this.API}/save`, payload);
    }

    updateExtraFluidBalance(extraFluidId: number, payload: ExtraFluid) {
      return this.http.patch<ExtraFluid>(`${this.API}/${extraFluidId}`, payload);
    }

    deleteExtraFluidBalance(extraFluidId: number) {
      return this.http.delete<void>(`${this.API}/${extraFluidId}`);
    }

    getExtraFluidBalancesByDates(patientId: number, startDate: Date, endDate: Date) {
       return this.http.get<ExtraFluid[]>(`${this.API}/patients/${patientId}/dates`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      });
    }
}