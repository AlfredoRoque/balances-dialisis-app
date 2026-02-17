import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import { BagType } from "../../shared/models/BagType";

@Injectable({ providedIn: 'root' })
export class BagTypeService {

  private API = 'http://localhost:8082/api/bag-types';

  constructor(private http: HttpClient) {}

  getBagTypes(): Observable<BagType[]> {
    return this.http.get<BagType[]>(this.API);
  }
}
