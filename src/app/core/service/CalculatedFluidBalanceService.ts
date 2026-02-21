import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Utility } from "./util/utility";
import { CalculatedFluidBalance } from "../../shared/models/CalculatedFluidBalance";

@Injectable({ providedIn: 'root' })
export class CalculatedFluidBalanceService {

  private API = 'http://localhost:8082/api/fluid-balances';

  constructor(private http: HttpClient, private utility: Utility) {}

  getFluidBalancesByDates(patientId: number, startDate?: Date | null, endDate?: Date | null) {
    const params: Record<string, string> = {};

    if (startDate && endDate) {
      params["startDate"] = startDate.toISOString();
      params["endDate"] = endDate.toISOString();
    } else {
      params["startDate"] = this.utility.getToday().toISOString();
    }

    return this.http.get<CalculatedFluidBalance[]>(`${this.API}/calculate/patients/${patientId}/dates`, { params });
  }

  getPDFFluidBalancesByDates(patientId: number, startDate?: Date | null, endDate?: Date | null) {
    const params: Record<string, string> = {};

    if (startDate && endDate) {
      params["startDate"] = startDate.toISOString();
      params["endDate"] = endDate.toISOString();
    } else {
      params["startDate"] = this.utility.getToday().toISOString();
    }

    return this.http.get(`${this.API}/reports/balances/patients/${patientId}/dates`, 
        { params, responseType: 'blob' });
  }

  getPDFFluidBalancesByDatesToEmail(patientId: number, startDate?: Date | null, endDate?: Date | null) {
    const params: Record<string, string> = {};

    if (startDate && endDate) {
      params["startDate"] = startDate.toISOString();
      params["endDate"] = endDate.toISOString();
    } else {
      params["startDate"] = this.utility.getToday().toISOString();
    }

    return this.http.get(`${this.API}/reports/balances/patients/${patientId}/dates/email`, 
        { params });
  }
}