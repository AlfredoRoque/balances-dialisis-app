import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import { BagType } from "../../shared/models/BagType";
import { Utility } from "./util/utility";

@Injectable({ providedIn: 'root' })
export class BagTypeService {

  private API = '';

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/bag-types`;
  }

  getBagTypes(): Observable<BagType[]> {
    return this.http.get<BagType[]>(this.API);
  }
}
