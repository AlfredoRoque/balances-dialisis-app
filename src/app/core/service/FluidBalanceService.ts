import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { FluidBalance } from "../../shared/models/FluidBalance";
import { Utility } from "./util/utility";

@Injectable({ providedIn: 'root' })
export class FluidBalanceService {

  private API = '';

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/fluid-balances`;
  }

  getFluidBalances(patientId: number) {
    return this.http.get<FluidBalance[]>(`${this.API}/dates`, {
      params: { patientId: patientId.toString(), startDate: this.utility.getToday().toISOString() }
    });
  }

  getFluidBalancesByDates(patientId: number, startDate: Date, endDate: Date) {
    return this.http.get<FluidBalance[]>(`${this.API}/dates`, {
      params: { patientId: patientId.toString(), startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    });
  }

  createFluidBalance(payload: FluidBalance) {
    return this.http.post<FluidBalance>(`${this.API}/save`, payload);
  }

  updateFluidBalance(fluidBalanceId: number, payload: FluidBalance) {
      return this.http.patch<FluidBalance>(`${this.API}/${fluidBalanceId}`, payload);
    }
  
    deleteFluidBalance(fluidBalanceId: number) {
      return this.http.delete<void>(`${this.API}/${fluidBalanceId}`);
    }
}