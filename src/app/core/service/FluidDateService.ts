import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Utility } from "./util/utility";

@Injectable({ providedIn: 'root' })
export class FluidDateService {

  private API = '';

    constructor(private http: HttpClient, private utility: Utility) {
      this.API = `${this.utility.getHostUrl()}/api/fluid-dates`;
    }

    getActiveDates() {
        return this.http.get<string[]>(`${this.API}/active-dates`);
    }
}