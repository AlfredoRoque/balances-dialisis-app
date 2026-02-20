import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class FluidDateService {

  private API = 'http://localhost:8082/api/fluid-dates';

    constructor(private http: HttpClient) {}

    getActiveDates() {
        return this.http.get<string[]>(`${this.API}/active-dates`);
    }
}