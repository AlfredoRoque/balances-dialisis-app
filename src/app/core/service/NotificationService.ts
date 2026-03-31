import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Utility } from "./util/utility";
import { Notification } from "../../shared/models/Notification";
import { BehaviorSubject, Observable, Subject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class NotificationService {

    private API = '';
    private loginNotification$ = new Subject<void>();
    private bannerVisible$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private utility: Utility) {
    this.API = `${this.utility.getHostUrl()}/api/notifications`;
  }

  balanceHistoryCleanNotification(): Observable<Notification>{
    return this.http.get<Notification>(`${this.API}/users/balances/clean-history`);
  }

  triggerLoginNotification(): void {
    this.loginNotification$.next();
  }

  onLoginNotification(): Observable<void> {
    return this.loginNotification$.asObservable();
  }

  setBannerVisible(visible: boolean): void {
    this.bannerVisible$.next(visible);
  }

  isBannerVisible$(): Observable<boolean> {
    return this.bannerVisible$.asObservable();
  }

}