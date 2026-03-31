import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Utility } from "./util/utility";
import { PaymentSubscription } from "../../shared/models/PaymentSuscription";
import { BehaviorSubject, Observable } from "rxjs";
import { Subscription } from "../../shared/models/Subscription";

@Injectable({ providedIn: 'root' })
export class SubscriptionService {

    private API = '';
    private planNameSubject = new BehaviorSubject<string | null>(null);
    planName$ = this.planNameSubject.asObservable();

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/subscriptions`;
  }

  existSubscription(): Observable<PaymentSubscription>{
    return this.http.get<PaymentSubscription>(`${this.API}/users/exist-subscription`);
  }

  getUserSubscription(): Observable<Subscription>{
    return this.http.get<Subscription>(`${this.API}/users/subscription`);
  }

  refreshPlanName(): void {
    this.getUserSubscription().subscribe({
      next: (subscription) => this.planNameSubject.next(subscription?.plan?.name ?? null),
      error: () => this.planNameSubject.next(null)
    });
  }
}