import { Injectable } from "@angular/core";
import { Utility } from "./util/utility";
import { HttpClient } from "@angular/common/http";
import { Plan } from "../../shared/models/Plan";

@Injectable({ providedIn: 'root' })
export class PlansService {

    private API = '';

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/plans`;
  }

  getPlans(){
    return this.http.get<Plan[]>(`${this.API}`);}
}