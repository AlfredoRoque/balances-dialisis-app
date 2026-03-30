import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Utility } from "./util/utility";
import { Observable } from 'rxjs';
import { PaymentSubscription } from "../../shared/models/PaymentSuscription";


@Injectable({ providedIn: 'root' })
export class PaymentService {

    private API = '';

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/payments`;
  }

  createPayment(priceId: string): Observable<PaymentSubscription>{
    return this.http.post<PaymentSubscription>(`${this.API}`,null,
      {
        params:{
          priceId:priceId
        }
      });
  }

  cancelSubscription(): Observable<PaymentSubscription>{
    return this.http.post<PaymentSubscription>(`${this.API}/cancel`,null);
  }

  changeSubscription(priceId: string): Observable<PaymentSubscription>{
    return this.http.post<PaymentSubscription>(`${this.API}/change-plan`,null,{
        params:{
          priceId:priceId
        }
      });
  }

  changeCards(): Observable<PaymentSubscription>{
    return this.http.post<PaymentSubscription>(`${this.API}/change-cards`,null);
  }
}
